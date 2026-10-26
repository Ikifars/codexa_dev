import { parse } from '@babel/parser'
import traverse, { type NodePath } from '@babel/traverse'
import generate from '@babel/generator'
import * as t from '@babel/types'

export type IntegrationModule = { code: string; name: string }
export type TabMapping = { code: string; tab: string }

export type RotaUnicaAnalysis = {
  stateName: string
  tabs: string[]
  mappings: TabMapping[]
  warnings: string[]
}

function unique(values: string[]) { return [...new Set(values)] }

export function analyzeAdminClient(source: string, modules: IntegrationModule[]): RotaUnicaAnalysis {
  let ast: t.File
  try {
    ast = parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] })
  } catch (error) {
    throw new Error(`AdminClient.tsx inválido: ${error instanceof Error ? error.message : 'não foi possível analisar o TSX.'}`)
  }
  let stateName = ''
  const tabs: string[] = []
  traverse(ast, {
    CallExpression(path) {
      if (!t.isIdentifier(path.node.callee, { name: 'useState' })) return
      const argument = path.node.arguments[0]
      if (!argument || !t.isStringLiteral(argument)) return
      const parent = path.parentPath
      if (!parent.isVariableDeclarator() || !t.isArrayPattern(parent.node.id)) return
      const [state] = parent.node.id.elements
      if (!t.isIdentifier(state)) return
      const annotation = t.isPattern(parent.node.id) ? parent.node.id.typeAnnotation : null
      const typeText = annotation ? generate(annotation).code : ''
      const values = [...typeText.matchAll(/['\"]([^'\"]+)['\"]/g)].map((match) => match[1])
      if (values.length > 0 && !stateName) { stateName = state.name; tabs.push(...values) }
    },
  })
  if (!stateName || tabs.length < 2) throw new Error('Não foi possível detectar uma navegação de abas segura. Informe uma página que use useState com união literal de abas, ou configure o mapeamento manualmente.')
  const normalizedTabs = unique(tabs)
  const mappings = normalizedTabs.map((tab, index) => ({ code: modules[index]?.code ?? '', tab })).filter((item) => item.code)
  const warnings = modules.length > normalizedTabs.length ? ['Há mais módulos do que abas detectadas; revise o mapeamento antes de instalar.'] : []
  return { stateName, tabs: normalizedTabs, mappings, warnings }
}

function addAllowedProp(ast: t.File) {
  let changed = false
  traverse(ast, {
    FunctionDeclaration(path) {
      if (!path.node.id?.name || !path.node.id.name.toLowerCase().includes('admin')) return
      if (path.node.params.length === 0) path.node.params.push(t.objectPattern([t.objectProperty(t.identifier('allowedModules'), t.identifier('allowedModules'))]))
      changed = true
      path.stop()
    },
    VariableDeclarator(path) {
      if (!t.isIdentifier(path.node.id) || !path.node.id.name.toLowerCase().includes('admin') || !t.isArrowFunctionExpression(path.node.init)) return
      const fn = path.node.init
      if (fn.params.length === 0) fn.params.push(t.objectPattern([t.objectProperty(t.identifier('allowedModules'), t.identifier('allowedModules'))]))
      changed = true
      path.stop()
    },
  })
  return changed
}

export function generateRotaUnicaIntegration(originalCode: string, modules: IntegrationModule[], mapping?: TabMapping[]) {
  const analysis = analyzeAdminClient(originalCode, modules)
  const selected = mapping?.length ? mapping : analysis.mappings
  if (selected.length === 0) throw new Error('Nenhum módulo pôde ser associado às abas detectadas.')
  const ast = parse(originalCode, { sourceType: 'module', plugins: ['typescript', 'jsx'] })
  if (!addAllowedProp(ast)) throw new Error('A página foi analisada, mas não encontrei um componente AdminClient modificável.')
  const generated = generate(ast, { retainLines: false, jsescOption: { minimal: true } }).code
  const guard = `\n\nexport type CodexaAllowedModules = Record<string, boolean>\n\nexport function codexaCanUseModule(allowedModules: CodexaAllowedModules, code: string) {\n  return allowedModules[code] === true\n}\n\nexport const CODEXA_TAB_MAPPING = ${JSON.stringify(selected, null, 2)} as const\n`
  return { source: `${generated}${guard}`, analysis: { ...analysis, mappings: selected } }
}

export function generatePageWrapper() {
  return `import AdminClient from './AdminClient'\nimport { getCodexaDecision } from '@/lib/codexa-license'\n\nexport default async function AdminPage() {\n  const decision = await getCodexaDecision()\n  if (!decision.valid) return <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center p-6"><section><h1>Acesso administrativo indisponível</h1><p>{decision.reason ?? 'A licença não está válida ou o serviço não está disponível.'}</p></section></main>\n  const allowedModules = Object.fromEntries(decision.modules.map((module) => [module.code, module.contracted && module.enabled && module.available && module.licensed]))\n  return <AdminClient allowedModules={allowedModules} />\n}\n`
}
