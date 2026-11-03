import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analyzeAdminClient, generateRotaUnicaIntegration } from '../../lib/licensing/rota-unica-generator.ts'

const modules = [
  { code: 'billing', name: 'Financeiro' },
  { code: 'support', name: 'Suporte' },
  { code: 'reports', name: 'Relatórios' },
]

test('detects state navigation, conditional content, and module aliases', () => {
  const source = `
    type Section = 'billing' | 'support' | 'reports'
    export default function AdminClient() {
      const [section, setSection] = useState<Section>('billing')
      return <main><nav><button data-module="billing" onClick={() => setSection('billing')}>Financeiro</button><button value="support" onClick={() => setSection('support')}>Suporte</button><button aria-controls="reports" onClick={() => setSection('reports')}>Relatórios</button></nav>{section === 'billing' && <BillingPanel />}{section === 'support' && <SupportPanel />}{section === 'reports' && <ReportsPanel />}</main>
    }
  `
  const result = analyzeAdminClient(source, modules)
  assert.deepEqual(result.tabs.sort(), ['billing', 'reports', 'support'])
  assert.equal(result.detectedTabs.filter((item) => item.code).length, 3)
  assert.equal(result.uncertain.length, 0)
})

test('detects route menus and switch-based content without useState unions', () => {
  const source = `
    const views = { billing: BillingView, support: SupportView }
    export default function AdminClient() {
      const [active, setActive] = useState('billing')
      function renderContent() { switch (active) { case 'billing': return <BillingView />; case 'support': return <SupportView /> } }
      return <><aside><a href="/billing">Financeiro</a><a href="/support">Suporte</a></aside><button onClick={() => navigate('/support')}>Abrir</button>{renderContent()}</>
    }
  `
  const result = analyzeAdminClient(source, modules)
  assert.ok(result.tabs.includes('billing'))
  assert.ok(result.tabs.includes('support'))
  assert.ok(result.detectedTabs.some((item) => item.tab === 'billing' && item.hasContent))
  assert.ok(result.detectedTabs.some((item) => item.tab === 'support' && item.hasTrigger))
})

test('preserves partial analysis and uses explicit manual mapping for ambiguous modules', () => {
  const source = `export default function AdminClient() { const [active, setActive] = useState('billing'); return <><button onClick={() => setActive('billing')}>Financeiro</button>{active === 'billing' && <BillingPanel />}</> }`
  const analysis = analyzeAdminClient(source, modules)
  assert.ok(analysis.tabs.includes('billing'))
  assert.equal(analysis.mappings[0].code, 'billing')
  const generated = generateRotaUnicaIntegration(source, modules, [{ tab: 'billing', code: 'billing' }])
  assert.match(generated.source, /CODEXA_TAB_MAPPING/)
  assert.ok(generated.analysis.detectedTabs[0].navigationElements.length >= 1)
  assert.ok(generated.analysis.detectedTabs[0].contentEvidence.length >= 1)
})

test('preserves existing AdminClient props while adding the licensing prop', () => {
  const source = `export default function AdminClient({ user, theme }: { user: string; theme: string }) { const [active, setActive] = useState('billing'); return <section><button onClick={() => setActive('billing')}>Financeiro</button>{active === 'billing' && <BillingPanel />}</section> }`
  const generated = generateRotaUnicaIntegration(source, modules, [{ tab: 'billing', code: 'billing' }])
  assert.match(generated.source, /allowedModules/)
  assert.match(generated.source, /user/)
})
