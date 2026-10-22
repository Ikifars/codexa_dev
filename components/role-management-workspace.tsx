'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Save, Search, Shield, Users } from 'lucide-react'

type Permission = { id: string; module_name: string; action_name: string }
type Role = {
  id: string
  name: string
  description: string
  is_system: boolean
  is_active: boolean
  memberCount: number
  permissions: string[]
}
type Member = {
  id: string
  user_id: string | null
  full_name: string
  email: string
  role_name: string
  status: string
  created_at: string
}

const moduleGroups: Record<string, string> = {
  dashboard: 'Painel',
  dashboard_comercial: 'Comercial',
  leads: 'Comercial',
  clients: 'Relacionamento',
  contacts: 'Relacionamento',
  proposals: 'Comercial',
  contracts: 'Comercial',
  projects: 'Projetos',
  change_requests: 'Operações',
  support: 'Suporte',
  systems: 'Operações',
  modules: 'Operações',
  plans: 'Operações',
  licenses: 'Operações',
  accounts_receivable: 'Financeiro',
  accounts_payable: 'Financeiro',
  finance: 'Financeiro',
  reports_commercial: 'Relatórios',
  reports_financial: 'Relatórios',
  team: 'Administração',
  users: 'Administração',
  roles: 'Administração',
  settings: 'Administração',
  appearance: 'Administração',
  audit: 'Administração',
  profile: 'Conta',
  documents: 'Documentos',
  attachments: 'Documentos',
  notifications: 'Conta',
  calendar: 'Comercial',
}

const moduleLabels: Record<string, string> = {
  dashboard: 'Dashboard geral', dashboard_comercial: 'Dashboard comercial', leads: 'Leads', clients: 'Clientes',
  contacts: 'Contatos', proposals: 'Propostas', contracts: 'Contratos', projects: 'Projetos e tarefas',
  change_requests: 'Solicitações', support: 'Suporte', systems: 'Sistemas dos clientes', modules: 'Módulos',
  plans: 'Planos', licenses: 'Licenças e liberações', accounts_receivable: 'Contas a receber',
  accounts_payable: 'Contas a pagar', finance: 'Financeiro', reports_commercial: 'Relatórios comerciais',
  reports_financial: 'Relatórios financeiros', team: 'Equipe', users: 'Usuários', roles: 'Cargos e permissões',
  settings: 'Configurações globais', appearance: 'Aparência global', audit: 'Auditoria', profile: 'Meu perfil',
  documents: 'Documentos', attachments: 'Anexos', notifications: 'Notificações', calendar: 'Agenda',
}

const actionLabels: Record<string, string> = {
  view: 'Visualizar', create: 'Criar', update: 'Editar', delete: 'Excluir', manage: 'Gerenciar',
  approve: 'Aprovar', export: 'Exportar', upload: 'Enviar arquivos', download: 'Baixar arquivos',
  assign: 'Atribuir', change_status: 'Alterar status', manage_licenses: 'Gerenciar licenças',
  release_modules: 'Liberar módulos', manage_users: 'Gerenciar usuários', manage_roles: 'Gerenciar cargos',
  view_audit: 'Consultar auditoria',
}

const inputClass = 'mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#0d1118] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-400/60'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const result = await response.json() as T & { error?: string; warning?: string | null }
  if (!response.ok) throw new Error(result.error || 'A operação não foi concluída.')
  return result
}

export function RoleManagementWorkspace({ initialView = 'roles' }: { initialView?: 'roles' | 'users' }) {
  const [view, setView] = useState(initialView)
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [selectedRole, setSelectedRole] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [creatingRole, setCreatingRole] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [roleActive, setRoleActive] = useState(true)
  const [roleGrants, setRoleGrants] = useState<string[]>([])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [roleData, userData, accessData] = await Promise.all([
        api<{ roles: Role[]; permissions: Permission[] }>('/api/admin/rbac/roles'),
        api<{ members: Member[] }>('/api/admin/rbac/users'),
        api<{ actorId: string }>('/api/workspace/access'),
      ])
      setRoles(roleData.roles)
      setPermissions(roleData.permissions)
      setMembers(userData.members)
      setCurrentUserId(accessData.actorId)
      setSelectedRole((previous) => roleData.roles.some((role) => role.id === previous)
        ? previous
        : roleData.roles.find((role) => role.name.toLowerCase() !== 'admin')?.id ?? roleData.roles[0]?.id ?? '')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os cargos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const role = roles.find((item) => item.id === selectedRole)
  useEffect(() => {
    if (!role) return
    setRoleName(role.name)
    setRoleDescription(role.description ?? '')
    setRoleActive(role.is_active)
    setRoleGrants(role.permissions)
    setCreatingRole(false)
  }, [role])

  const groupedPermissions = useMemo(() => {
    const term = search.trim().toLowerCase()
    return permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
      const module = permission.module_name
      const label = moduleLabels[module] ?? module
      const action = actionLabels[permission.action_name] ?? permission.action_name
      if (term && !`${label} ${action} ${module}`.toLowerCase().includes(term)) return groups
      const group = moduleGroups[module] ?? 'Outros'
      groups[group] = [...(groups[group] ?? []), permission]
      return groups
    }, {})
  }, [permissions, search])

  function selectRole(id: string) {
    setSelectedRole(id)
    setCreatingRole(false)
    setError('')
    setNotice('')
  }

  function newRole() {
    setSelectedRole('')
    setCreatingRole(true)
    setRoleName('')
    setRoleDescription('')
    setRoleActive(true)
    setRoleGrants([])
    setError('')
    setNotice('')
  }

  function togglePermission(permission: Permission, checked: boolean) {
    if (roleName.toLowerCase() === 'admin') return
    const permissionName = `${permission.module_name}:${permission.action_name}`
    setRoleGrants((current) => checked
      ? [...new Set([...current, permissionName])]
      : current.filter((item) => item !== permissionName))
  }

  async function saveRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      if (creatingRole) {
        const result = await api<{ role: Role }>('/api/admin/rbac/roles', {
          method: 'POST',
          body: JSON.stringify({ name: roleName, description: roleDescription, permissions: roleGrants }),
        })
        setNotice('Cargo criado e auditado.')
        await load()
        setSelectedRole(result.role.id)
      } else if (role) {
        await api('/api/admin/rbac/roles', {
          method: 'PUT',
          body: JSON.stringify({ id: role.id, name: roleName, description: roleDescription, permissions: roleGrants, isActive: roleActive }),
        })
        setNotice('Cargo e permissões atualizados.')
        await load()
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar o cargo.')
    } finally {
      setSaving(false)
    }
  }

  async function updateMember(member: Member, patch: { roleName?: string; status?: string }) {
    setError('')
    setNotice('')
    try {
      const result = await api<{ warning?: string | null }>(`/api/admin/rbac/users/${member.id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      setNotice(result.warning || 'Usuário atualizado e alteração registrada na auditoria.')
      await load()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Não foi possível atualizar o usuário.')
    }
  }

  async function inviteMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    const form = new FormData(event.currentTarget)
    try {
      const result = await api<{ warning?: string | null }>('/api/admin/rbac/users', {
        method: 'POST',
        body: JSON.stringify({
          fullName: form.get('fullName'),
          email: form.get('email'),
          roleName: form.get('roleName'),
        }),
      })
      setInviteOpen(false)
      setNotice(result.warning || 'Convite enviado e usuário associado ao cargo.')
      await load()
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Não foi possível convidar o usuário.')
    } finally {
      setSaving(false)
    }
  }

  return <section className="space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-blue-400">Administração segura</p><h1 className="text-2xl font-semibold text-white">Cargos e permissões</h1><p className="mt-1.5 text-sm text-slate-500">Configure acesso por setor, ação e cargo individual da equipe.</p></div>
      <div className="flex gap-2">
        {view === 'roles' ? <button onClick={newRole} className="flex items-center gap-2 rounded-lg bg-blue-500 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-blue-400"><Plus className="size-4" />Novo cargo</button>
          : <button onClick={() => setInviteOpen((open) => !open)} className="flex items-center gap-2 rounded-lg bg-blue-500 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-blue-400"><Plus className="size-4" />Convidar usuário</button>}
      </div>
    </header>

    <div className="flex gap-1 border-b border-white/[0.07]">
      <button onClick={() => setView('roles')} className={`border-b-2 px-4 py-3 text-xs font-medium ${view === 'roles' ? 'border-blue-400 text-blue-300' : 'border-transparent text-slate-500'}`}><Shield className="mr-2 inline size-3.5" />Cargos e matriz</button>
      <button onClick={() => setView('users')} className={`border-b-2 px-4 py-3 text-xs font-medium ${view === 'users' ? 'border-blue-400 text-blue-300' : 'border-transparent text-slate-500'}`}><Users className="mr-2 inline size-3.5" />Usuários</button>
    </div>
    {error && <div role="alert" className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>}
    {notice && <div role="status" className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{notice}</div>}

    {loading ? <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-[#11161e] p-8 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" />Carregando dados de acesso...</div>
      : view === 'roles' ? <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit rounded-xl border border-white/[0.07] bg-[#11161e] p-3">
          <h2 className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Cargos ({roles.length})</h2>
          <div className="space-y-1">{roles.map((item) => <button key={item.id} onClick={() => selectRole(item.id)} className={`w-full rounded-lg px-3 py-3 text-left ${selectedRole === item.id && !creatingRole ? 'bg-blue-500/10 text-blue-200' : 'text-slate-300 hover:bg-white/[0.04]'}`}>
            <span className="flex items-center justify-between gap-2 text-sm font-medium"><span className="truncate">{item.name}</span>{item.name.toLowerCase() === 'admin' && <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[9px] uppercase text-amber-300">Protegido</span>}</span>
            <span className="mt-1 block text-[11px] text-slate-500">{item.memberCount} usuário(s) · {item.is_active ? 'Ativo' : 'Inativo'}</span>
          </button>)}
            {creatingRole && <div className="rounded-lg bg-blue-500/10 px-3 py-3 text-sm font-medium text-blue-200">Novo cargo</div>}
          </div>
        </aside>
        <form onSubmit={(event) => void saveRole(event)} className="min-w-0 space-y-4 rounded-xl border border-white/[0.07] bg-[#11161e] p-5">
          {role || creatingRole ? <>
            <div className="grid gap-4 sm:grid-cols-[1fr_1.5fr_auto]">
              <label className="text-xs text-slate-500">Nome do cargo<input required minLength={2} maxLength={50} disabled={role?.name.toLowerCase() === 'admin'} value={roleName} onChange={(event) => setRoleName(event.target.value)} className={inputClass} /></label>
              <label className="text-xs text-slate-500">Descrição<input maxLength={300} value={roleDescription} onChange={(event) => setRoleDescription(event.target.value)} className={inputClass} /></label>
              {!creatingRole && role?.name.toLowerCase() !== 'admin' && <label className="flex items-center gap-2 self-end pb-3 text-xs text-slate-400"><input type="checkbox" checked={roleActive} onChange={(event) => setRoleActive(event.target.checked)} className="accent-blue-500" />Ativo</label>}
            </div>
            {role?.name.toLowerCase() === 'admin' && <p className="rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2 text-xs text-amber-200">Admin mantém acesso integral e protegido; este cargo não pode ser renomeado, desativado ou reduzido.</p>}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-sm font-semibold text-white">Matriz granular de permissões</h2><p className="mt-1 text-xs text-slate-500">Permissões não selecionadas são negadas por padrão.</p></div><div className="flex items-center gap-2 rounded-lg border border-white/[0.07] px-3 py-2"><Search className="size-3.5 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar módulo ou ação" className="w-44 bg-transparent text-xs text-slate-200 outline-none" /></div></div>
            <div className="max-h-[56vh] space-y-4 overflow-y-auto pr-1">
              {Object.entries(groupedPermissions).map(([group, entries]) => {
                const modulePermissions = new Map<string, Permission[]>()
                for (const permission of entries) modulePermissions.set(permission.module_name, [...(modulePermissions.get(permission.module_name) ?? []), permission])
                return <section key={group} className="rounded-lg border border-white/[0.06]">
                  <h3 className="border-b border-white/[0.06] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-blue-300">{group}</h3>
                  <div className="divide-y divide-white/[0.04]">{[...modulePermissions].map(([module, actions]) => <div key={module} className="grid gap-2 px-4 py-3 md:grid-cols-[190px_1fr]">
                    <p className="pt-1 text-xs font-medium text-slate-300">{moduleLabels[module] ?? module}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">{actions.map((permission) => {
                      const key = `${permission.module_name}:${permission.action_name}`
                      const checked = roleName.toLowerCase() === 'admin' || roleGrants.includes(key)
                      return <label key={permission.id} className={`flex items-center gap-1.5 text-[11px] ${roleName.toLowerCase() === 'admin' ? 'text-amber-200' : 'text-slate-400'}`}>
                        <input type="checkbox" checked={checked} disabled={roleName.toLowerCase() === 'admin'} onChange={(event) => togglePermission(permission, event.target.checked)} className="accent-blue-500" />
                        {actionLabels[permission.action_name] ?? permission.action_name}
                      </label>
                    })}</div>
                  </div>)}</div>
                </section>
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4"><p className="text-[11px] text-slate-600">{role?.memberCount ?? 0} usuário(s) · alterações são registradas na auditoria</p><button disabled={saving || role?.name.toLowerCase() === 'admin'} className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{creatingRole ? 'Criar cargo' : 'Salvar permissões'}</button></div>
          </> : <p className="p-8 text-sm text-slate-500">Selecione um cargo para consultar sua matriz.</p>}
        </form>
      </div> : <div className="space-y-4">
        {inviteOpen && <form onSubmit={(event) => void inviteMember(event)} className="grid gap-3 rounded-xl border border-white/[0.07] bg-[#11161e] p-5 sm:grid-cols-4">
          <label className="text-xs text-slate-500">Nome<input name="fullName" required minLength={2} maxLength={200} className={inputClass} /></label>
          <label className="text-xs text-slate-500">E-mail<input name="email" type="email" required className={inputClass} /></label>
          <label className="text-xs text-slate-500">Cargo<select name="roleName" required className={inputClass}>{roles.filter((item) => item.is_active).map((item) => <option key={item.id}>{item.name}</option>)}</select></label>
          <button disabled={saving} className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}Enviar convite</button>
        </form>}
        <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-[#11161e]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/[0.07] text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Membro</th><th className="px-4 py-3">Cargo</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Criado em</th></tr></thead>
            <tbody className="divide-y divide-white/[0.04]">{members.map((member) => {
              const self = member.user_id === currentUserId
              return <tr key={member.id}>
                <td className="px-4 py-3"><p className="text-xs font-medium text-slate-200">{member.full_name}{self ? ' (você)' : ''}</p><p className="mt-1 text-[11px] text-slate-500">{member.email}</p></td>
                <td className="px-4 py-3"><select aria-label={`Cargo de ${member.full_name}`} disabled={self} value={member.role_name} onChange={(event) => void updateMember(member, { roleName: event.target.value })} className="rounded-lg border border-white/[0.08] bg-[#0d1118] px-2 py-2 text-xs text-slate-200 disabled:opacity-50">{roles.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></td>
                <td className="px-4 py-3"><select aria-label={`Status de ${member.full_name}`} disabled={self} value={member.status.replace(/['"]/g, '').trim().toLowerCase() === 'ativo' || member.status.toLowerCase() === 'active' ? 'Ativo' : 'Inativo'} onChange={(event) => void updateMember(member, { status: event.target.value })} className="rounded-lg border border-white/[0.08] bg-[#0d1118] px-2 py-2 text-xs text-slate-200 disabled:opacity-50"><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option></select></td>
                <td className="px-4 py-3 text-xs text-slate-500">{new Date(member.created_at).toLocaleDateString('pt-BR')}</td>
              </tr>
            })}</tbody>
          </table>
          {!members.length && <div className="p-10 text-center text-sm text-slate-500">Nenhum membro cadastrado.</div>}
        </div>
        <p className="text-[11px] text-slate-600">Alterações de cargo/status são auditadas. Um usuário não pode alterar a própria conta ou desativar o último administrador.</p>
      </div>}
  </section>
}
