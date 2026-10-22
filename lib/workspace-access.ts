export const workspaceAccess: Record<string, string[]> = {
  leads: ['leads:view'],
  clientes: ['clients:view'],
  contatos: ['contacts:view'],
  propostas: ['proposals:view'],
  contratos: ['contracts:view'],
  projetos: ['projects:view'],
  tarefas: ['projects:view'],
  solicitacoes: ['change_requests:view'],
  suporte: ['support:view'],
  sistemas: ['systems:view'],
  modulos: ['modules:view'],
  planos: ['plans:view'],
  licencas: ['licenses:view'],
  'contas-a-receber': ['accounts_receivable:view'],
  'contas-a-pagar': ['accounts_payable:view'],
  'fluxo-de-caixa': ['finance:view'],
  transacoes: ['finance:view'],
  'categorias-financeiras': ['finance:view'],
  relatorios: ['reports_commercial:view', 'reports_financial:view'],
  equipe: ['team:view'],
  usuarios: ['users:manage_users'],
  'papeis-e-permissoes': ['roles:manage_roles'],
  'meu-perfil': ['profile:view'],
  'meu-historico': ['projects:view'],
  configuracoes: ['settings:view'],
  aparencia: ['appearance:view'],
  auditoria: ['audit:view_audit'],
}

export function hasWorkspaceAccess(permissions: string[], slug: string): boolean {
  if (permissions.includes('*')) return true
  if (slug === 'dashboard') return permissions.includes('dashboard:view') || permissions.includes('dashboard_comercial:view')
  const required = workspaceAccess[slug]
  return Boolean(required?.some((permission) => permissions.includes(permission)))
}

export function normalizeWorkspaceRoleName(name: string): string {
  return name.trim().toLocaleLowerCase('pt-BR')
}
