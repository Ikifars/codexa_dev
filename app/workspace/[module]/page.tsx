import { notFound } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'

const modules: Record<string, string> = {
  dashboard: 'Dashboard', leads: 'Leads', clientes: 'Clientes', contatos: 'Contatos', propostas: 'Propostas', contratos: 'Contratos',
  projetos: 'Projetos', tarefas: 'Tarefas', solicitacoes: 'Solicitações de alteração', suporte: 'Suporte', sistemas: 'Sistemas dos clientes', modulos: 'Módulos', planos: 'Planos', licencas: 'Licenças',
  'contas-a-receber': 'Contas a receber', 'contas-a-pagar': 'Contas a pagar', 'fluxo-de-caixa': 'Fluxo de caixa', transacoes: 'Transações', 'categorias-financeiras': 'Categorias financeiras', relatorios: 'Relatórios', equipe: 'Equipe', usuarios: 'Usuários', 'papeis-e-permissoes': 'Papéis e permissões', 'meu-perfil': 'Meu perfil', configuracoes: 'Configurações', aparencia: 'Aparência', auditoria: 'Auditoria',
}

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params
  const label = modules[module]
  if (!label || module === 'dashboard') notFound()
  return <DashboardShell initialSection={label} />
}
