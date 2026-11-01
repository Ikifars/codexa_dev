import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import * as t from '@babel/types'

export type IntegrationModule = { code: string; name: string }
export type TabMapping = { code: string; tab: string; confidence?: number; evidence?: string[] }
export type DetectedTab = { tab: string; code: string; evidence: string[]; confidence: number; hasContent: boolean; hasTrigger: boolean }
export type RotaUnicaAnalysis = {
  stateName: string | null
  tabs: string[]
  detectedTabs: DetectedTab[]
  mappings: TabMapping[]
  sharedComponents: string[]
  warnings: string[]
  uncertain: string[]
  requiresConfirmation: boolean
}

const NAV_NAMES = /(?:active|current|selected|open|visible|section|view|panel|tab)/i
const NAV_VALUES = /^[a-z][a-z0-9]*(?:[-_][a-z0-9]+)*$/i
const unique = <T,>(values: T[]) => [...new Set(values)]

function parseSource(source: string) {
  return parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx', 'decorators-legacy'], errorRecovery: false })
}

function literal(node: t.Node | null | undefined): string | null {
  if (!node) return null
  if (t.isStringLiteral(node)) return node.value
  if (t.isNumericLiteral(node)) return String(node.value)
  if (t.isTemplateLiteral(node) && node.expressions.length === 0) return node.quasis[0]?.value.cooked ?? null
  return null
}

function valuesFromType(node: t.TSType | null | undefined): string[] {
  if (!node) return []
  if (t.isTSUnionType(node)) return node.types.flatMap(valuesFromType)
  if (t.isTSLiteralType(node)) return literal(node.literal) ? [literal(node.literal)!] : []
  if (t.isTSTypeReference(node) && t.isIdentifier(node.typeName)) return []
  return []
}

function valuesFromExpression(node: t.Node | null | undefined): string[] {
  if (!node) return []
  if (t.isArrayExpression(node)) return node.elements.flatMap((item) => item && !t.isSpreadElement(item) ? [literal(item)].filter(Boolean) as string[] : [])
  if (t.isStringLiteral(node) || t.isNumericLiteral(node) || t.isTemplateLiteral(node)) return [literal(node)!].filter(Boolean)
  if (t.isObjectExpression(node)) return node.properties.flatMap((property) => {
    if (!t.isObjectProperty(property)) return []
    const key = t.isIdentifier(property.key) ? property.key.name : literal(property.key)
    return key ? [key] : []
  })
  return []
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '')
}

function score(tab: string, module: IntegrationModule) {
  const a = normalize(tab); const b = normalize(module.code); const c = normalize(module.name)
  if (a === b || a === c) return 1
  if (a.includes(b) || b.includes(a) || a.includes(c) || c.includes(a)) return 0.86
  const words = tab.toLowerCase().split(/[_\-\s]+/).filter(Boolean)
  const hits = words.filter((word) => normalize(module.name).includes(normalize(word))).length
  return words.length && hits ? Math.min(0.78, 0.45 + hits / words.length * 0.3) : 0
}

export function parseOptionalTabMapping(input: string | null | undefined): TabMapping[] | undefined {
  const text = input?.trim()
  if (!text) return undefined
  const candidate = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  let value: unknown
  try { value = JSON.parse(candidate) } catch (error) { throw new Error(`O mapeamento precisa ser um JSON válido${error instanceof SyntaxError && error.message ? `: ${error.message}` : '.'}`) }
  if (!Array.isArray(value)) throw new Error('O mapeamento precisa ser uma lista JSON.')
  const result = value.map((item, index) => {
    if (!item || typeof item !== 'object' || typeof (item as { tab?: unknown }).tab !== 'string' || typeof (item as { code?: unknown }).code !== 'string') throw new Error(`Mapeamento inválido no item ${index + 1}. Use { "tab": "...", "code": "..." }.`)
    return { tab: (item as { tab: string }).tab.trim(), code: (item as { code: string }).code.trim() }
  })
  if (result.some((item) => !item.tab || !item.code)) throw new Error('Cada mapeamento precisa ter tab e code preenchidos.')
  return result
}

export function analyzeAdminClient(source: string, modules: IntegrationModule[]): RotaUnicaAnalysis {
  const ast = parseSource(source)
  const candidates = new Map<string, { evidence: string[]; trigger: boolean; content: boolean }>()
  const stateNames: string[] = []; const sharedComponents: string[] = []; const warnings: string[] = []
  const addCandidate = (value: string, evidence: string, field: 'trigger' | 'content' | null = null) => {
    if (!value || value.length > 80 || !NAV_VALUES.test(value)) return
    const current = candidates.get(value) ?? { evidence: [], trigger: false, content: false }
    current.evidence = unique([...current.evidence, evidence])
    if (field) current[field] = true
    candidates.set(value, current)
  }
  const visitor: any = {
    TSTypeAliasDeclaration(path: any) { for (const value of valuesFromType(path.node.typeAnnotation)) addCandidate(value, `type:${path.node.id.name}`) },
    TSInterfaceDeclaration(path: any) { path.node.body.body.forEach((member: any) => { if (t.isTSPropertySignature(member)) { const key = t.isIdentifier(member.key) ? member.key.name : literal(member.key); valuesFromType(member.typeAnnotation?.typeAnnotation).forEach((value) => addCandidate(value, `interface:${path.node.id.name}.${key ?? 'property'}`)) } }) },
    VariableDeclarator(path: any) {
      const name = t.isIdentifier(path.node.id) ? path.node.id.name : ''
      if (NAV_NAMES.test(name)) {
        valuesFromExpression(path.node.init).forEach((value) => addCandidate(value, `constant:${name}`))
        if (t.isCallExpression(path.node.init) && t.isIdentifier(path.node.init.callee) && path.node.init.callee.name === 'useState') stateNames.push(name)
      }
      if (t.isArrayPattern(path.node.id) && path.node.id.elements[0] && t.isIdentifier(path.node.id.elements[0]) && NAV_NAMES.test(path.node.id.elements[0].name)) {
        const state = path.node.id.elements[0].name; stateNames.push(state)
        const initial = t.isCallExpression(path.node.init) ? path.node.init.arguments[0] : null
        valuesFromExpression(initial).forEach((value) => addCandidate(value, `useState:${state}`))
        if (t.isCallExpression(path.node.init) && t.isCallExpression(path.node.init.arguments[0])) valuesFromExpression(path.node.init.arguments[0]).forEach((value) => addCandidate(value, `useState:${state}`))
      }
      if (t.isIdentifier(path.node.id) && /^[A-Z]/.test(path.node.id.name) && (t.isArrowFunctionExpression(path.node.init) || t.isFunctionExpression(path.node.init))) sharedComponents.push(path.node.id.name)
    },
    CallExpression(path: any) {
      if (t.isIdentifier(path.node.callee) && /^useState$/.test(path.node.callee.name)) {
        const parent = path.parentPath
        if (parent.isVariableDeclarator() && t.isArrayPattern(parent.node.id)) {
          const state = parent.node.id.elements[0]
          if (t.isIdentifier(state) && NAV_NAMES.test(state.name)) { stateNames.push(state.name); valuesFromExpression(path.node.arguments[0]).forEach((value) => addCandidate(value, `useState:${state.name}`)); const typeParameters = path.node.typeParameters?.params ?? []; typeParameters.flatMap((parameter: any) => valuesFromType(parameter)).forEach((value: string) => addCandidate(value, `useStateType:${state.name}`)) }
        }
      }
    },
    JSXAttribute(path: any) {
      const name = t.isJSXIdentifier(path.node.name) ? path.node.name.name : ''
      if (/onClick|href|value|data-tab|aria-controls/.test(name)) valuesFromExpression(path.node.value).forEach((value) => addCandidate(value, `jsx:${name}`, 'trigger'))
    },
    JSXExpressionContainer(path: any) {
      const text = generate(path.node.expression).code
      if (/active|current|selected|tab|section|panel|view/i.test(text)) {
        const matches = text.match(/['"`]([a-z][a-z0-9_-]{1,60})['"`]/gi) ?? []
        matches.forEach((match) => addCandidate(match.slice(1, -1), 'jsx:conditional', 'content'))
      }
    },
    SwitchCase(path: any) { const value = literal(path.node.test); if (value) addCandidate(value, 'switch:case', 'content') },
    FunctionDeclaration(path: any) { if (path.node.id && /^[A-Z]/.test(path.node.id.name)) sharedComponents.push(path.node.id.name) },
  }
  traverse(ast, visitor)
  const tabs = [...candidates.entries()].filter(([tab, info]) => info.content || info.trigger || stateNames.length > 0 && !['true', 'false'].includes(tab)).map(([tab]) => tab)
  const detectedTabs: DetectedTab[] = tabs.map((tab) => {
    const info = candidates.get(tab)!; const best = modules.map((module) => ({ module, score: score(tab, module) })).sort((a, b) => b.score - a.score)[0]
    return { tab, code: best?.score >= 0.78 ? best.module.code : '', evidence: info.evidence, confidence: best?.score ?? 0, hasContent: info.content, hasTrigger: info.trigger }
  })
  const mappings: TabMapping[] = detectedTabs.filter((tab) => tab.code).map((tab) => ({ tab: tab.tab, code: tab.code, confidence: tab.confidence, evidence: tab.evidence }))
  const uncertain = detectedTabs.filter((tab) => !tab.code || !tab.hasContent || !tab.hasTrigger).map((tab) => tab.tab)
  if (!stateNames.length) warnings.push('Nenhum estado de navegação inequívoco foi encontrado; revise as abas detectadas.')
  if (!tabs.length) warnings.push('Nenhuma aba foi detectada no código enviado.')
  if (sharedComponents.length) warnings.push(`Componentes auxiliares preservados: ${unique(sharedComponents).join(', ')}.`)
  return { stateName: stateNames[0] ?? null, tabs, detectedTabs, mappings, sharedComponents: unique(sharedComponents), warnings, uncertain: unique(uncertain), requiresConfirmation: uncertain.length > 0 }
}

function addAllowedProp(ast: t.File) {
  traverse(ast, { ExportDefaultDeclaration(path: any) {
    const declaration = path.node.declaration
    if (!t.isFunctionDeclaration(declaration) && !t.isArrowFunctionExpression(declaration) && !t.isFunctionExpression(declaration)) return
    const prop = t.objectProperty(t.identifier('allowedModules'), t.identifier('allowedModules'), false, true)
    const param = declaration.params[0]
    if (!param) declaration.params = [t.objectPattern([prop])]
    else if (t.isObjectPattern(param) && !param.properties.some((item) => t.isObjectProperty(item) && t.isIdentifier(item.key) && item.key.name === 'allowedModules')) param.properties.push(prop)
  } })
}

export function generateRotaUnicaIntegration(originalCode: string, modules: IntegrationModule[], mapping?: TabMapping[]) {
  const analysis = analyzeAdminClient(originalCode, modules)
  const selected = mapping?.length ? mapping.map((item) => ({ ...item, evidence: analysis.detectedTabs.find((tab) => tab.tab === item.tab)?.evidence })) : analysis.mappings
  const knownCodes = new Set(modules.map((module) => module.code))
  const invalid = selected.filter((item) => !knownCodes.has(item.code) || !analysis.tabs.includes(item.tab))
  if (invalid.length) throw new Error(`Mapeamentos inválidos: ${invalid.map((item) => `${item.tab} → ${item.code}`).join(', ')}`)
  if (analysis.requiresConfirmation && !mapping?.length) throw new Error(`A análise encontrou abas ambíguas ou sem conteúdo/acionador: ${analysis.uncertain.join(', ')}. Envie um mapeamento parcial ou revise o código.`)
  const ast = parseSource(originalCode); addAllowedProp(ast)
  const generated = generate(ast, { retainLines: false, jsescOption: { minimal: true } }).code
  const guard = `\n\nexport type CodexaAllowedModules = Record<string, boolean>\nexport function codexaCanUseModule(allowedModules: CodexaAllowedModules, code: string) { return allowedModules[code] === true }\nexport const CODEXA_TAB_MAPPING = ${JSON.stringify(selected, null, 2)} as const\n`
  return { source: `${generated}${guard}`, analysis: { ...analysis, mappings: selected } }
}

export function generatePageWrapper() {
  return `import AdminClient from './AdminClient'\nimport { getCodexaDecision } from '@/lib/licensing/server'\n\nexport default async function AdminPage() {\n  const decision = await getCodexaDecision()\n  if (!decision.valid) return <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center p-6"><section><h1>Acesso administrativo indisponível</h1><p>{decision.reason ?? 'A licença não está válida ou o serviço não está disponível.'}</p></section></main>\n  const allowedModules = Object.fromEntries(decision.modules.map((module) => [module.code, module.available && module.licensed]))\n  return <AdminClient allowedModules={allowedModules} />\n}\n`
}

export function generateClientGuard() {
  return `import type { ReactNode } from 'react'\nexport function CodexaModuleGuard({ allowed, children, name }: { allowed: boolean; children: ReactNode; name: string }) {\n  if (allowed) return <>{children}</>\n  return <section className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-5"><h2>Módulo não disponível</h2><p>O módulo {name} não está liberado para esta licença.</p></section>\n}\n`
}

export function generateServerLicenseHelper(apiUrl: string) {
  return `export type CodexaModule = { code: string; name: string; contracted: boolean; enabled: boolean; available: boolean; licensed: boolean }\nexport type CodexaDecision = { valid: boolean; reason: string | null; expiresAt: string | null; modules: CodexaModule[] }\nconst empty = (reason: string): CodexaDecision => ({ valid: false, reason, expiresAt: null, modules: [] })\nexport async function getCodexaDecision(): Promise<CodexaDecision> {\n  const key = process.env.CODEXA_LICENSE_KEY\n  if (!key) return empty('CODEXA_LICENSE_KEY não configurada.')\n  try {\n    const response = await fetch(process.env.CODEXA_LICENSE_API_URL ?? ${JSON.stringify(apiUrl)}, { method: 'POST', headers: { Authorization: 'Bearer ' + key, Accept: 'application/json' }, cache: 'no-store' })\n    if (!response.ok) return empty('Serviço de licenciamento indisponível.')\n    const result = await response.json() as Partial<CodexaDecision>\n    if (result.valid !== true || !Array.isArray(result.modules)) return empty('Resposta de licenciamento inválida.')\n    return { valid: true, reason: result.reason ?? null, expiresAt: result.expiresAt ?? null, modules: result.modules }\n  } catch { return empty('Não foi possível consultar o serviço de licenciamento.') }\n}\nexport async function requireLicensedModule(code: string) { const decision = await getCodexaDecision(); const module = decision.modules.find((item) => item.code === code); if (!decision.valid || !module?.available || !module.licensed) throw new Error('Módulo não licenciado.'); return decision }\n`
}
