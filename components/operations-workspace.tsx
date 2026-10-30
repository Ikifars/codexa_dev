'use client'

import { FormEvent, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClipboardList, Eye, FolderKanban, Headphones, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { ProjectListWorkspace } from '@/components/project-list-workspace'
import { hasWorkspaceAccess } from '@/lib/workspace-access'

type Module = 'projects' | 'change_requests' | 'support_tickets'
type ChangeRequest = { id: string; title: string; requester: string; description: string | null; status: string; priority: string; category: string; effort_hours: number }
type Ticket = { id: string; ticket_number: string; subject: string; requester: string; description: string | null; status: string; priority: string; category: string; sector: string; technical_responsible_id: string | null; due_at: string | null; scheduled_at: string | null; resolution: string | null; resolved_at: string | null }
type Member = { id: string; full_name: string; role_name: string }
type OperationalRecord = ChangeRequest | Ticket

const modules = [
  ['projects', FolderKanban, 'Projetos'],
  ['change_requests', ClipboardList, 'Alterações'],
  ['support_tickets', Headphones, 'Suporte'],
] as const
const inputClass = 'w-full rounded-lg border border-white/10 bg-[#151b24] p-3 text-sm text-white'
const supportStatuses = ['Aberto', 'Em andamento', 'Aguardando cliente', 'Resolvido', 'Fechado']
const supportSectors = ['Suporte Técnico', 'Financeiro', 'Comercial', 'Operações']

function rolesForSector(sector: string) {
  if (sector === 'Suporte Técnico') return ['suporte']
  if (sector === 'Financeiro') return ['financeiro']
  if (sector === 'Comercial') return ['comercial']
  if (sector === 'Operações') return ['operacional']
  return []
}

async function awardXp(actionKey: string, entityType: string, entityId: string) {
  await fetch('/api/workspace/xp/award', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actionKey, entityType, entityId }) })
}

function toLocalDateTime(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

function toIsoDateTime(value: FormDataEntryValue | undefined) {
  if (typeof value !== 'string' || !value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function OperationsWorkspace({ initialModule = 'projects', permissions }: { initialModule?: Module; permissions: string[] }) {
  const [module, setModule] = useState<Module>(initialModule)
  const [requests, setRequests] = useState<ChangeRequest[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [responsibleFilter, setResponsibleFilter] = useState('')
  const [editingSector, setEditingSector] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(false)
  const [record, setRecord] = useState<OperationalRecord | null>(null)
  const [editingRecord, setEditingRecord] = useState(false)
  const [error, setError] = useState('')
  const permissionModule = module === 'support_tickets' ? 'support' : module
  const canCreate = permissions.includes('*') || permissions.includes(`${permissionModule}:create`)
  const canUpdate = permissions.includes('*') || permissions.includes(`${permissionModule}:update`)
  const canDelete = permissions.includes('*') || permissions.includes(`${permissionModule}:delete`)
  const canAssign = permissions.includes('*') || permissions.includes('support:assign')
  const availableModules = modules.filter(([key]) => hasWorkspaceAccess(permissions, key === 'support_tickets' ? 'suporte' : key === 'change_requests' ? 'solicitacoes' : 'projetos'))

  useEffect(() => {
    setModule(initialModule)
    setQuery('')
    setCategoryFilter('')
    setSectorFilter('')
    setStatusFilter('')
    setPriorityFilter('')
    setResponsibleFilter('')
    setError('')
    setModal(false)
    setRecord(null)
  }, [initialModule])

  async function loadData() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    if (module === 'change_requests') {
      const { data, error: queryError } = await supabase.from('change_requests')
        .select('id,title,requester,description,status,priority,category,effort_hours')
        .order('created_at', { ascending: false })
      if (queryError) setError(`Não foi possível carregar as solicitações: ${queryError.message}`)
      else setRequests((data ?? []) as ChangeRequest[])
    } else {
      const { data, error: queryError } = await supabase.from('support_tickets')
        .select('id,ticket_number,subject,requester,description,status,priority,category,sector,technical_responsible_id,due_at,scheduled_at,resolution,resolved_at')
        .order('created_at', { ascending: false })
      if (queryError) setError(`Não foi possível carregar os chamados: ${queryError.message}`)
      else setTickets((data ?? []) as Ticket[])
      if (canAssign) {
        const { data: memberRows, error: membersError } = await supabase.from('team_members')
          .select('id,full_name,role_name')
          .eq('status', 'Ativo')
          .order('full_name')
        if (membersError) setError((current) => current || `Não foi possível carregar os responsáveis: ${membersError.message}`)
        else setMembers((memberRows ?? []) as Member[])
      } else {
        setMembers([])
      }
    }
    setLoading(false)
  }

  useEffect(() => { if (module !== 'projects') void loadData() }, [module])

  const operationalRows: OperationalRecord[] = module === 'change_requests'
    ? requests.filter((item) => `${item.title} ${item.requester} ${item.category}`.toLowerCase().includes(query.toLowerCase()))
    : tickets.filter((item) =>
        `${item.ticket_number} ${item.subject} ${item.requester} ${item.category} ${item.sector}`.toLowerCase().includes(query.toLowerCase())
        && (!categoryFilter || item.category === categoryFilter)
        && (!sectorFilter || item.sector === sectorFilter)
        && (!statusFilter || item.status === statusFilter)
        && (!priorityFilter || item.priority === priorityFilter)
        && (!responsibleFilter || item.technical_responsible_id === responsibleFilter))

  function membersForSector(sector: string) {
    const allowedRoles = rolesForSector(sector)
    return members.filter((member) => allowedRoles.includes(member.role_name.trim().toLowerCase()))
  }

  function openEditor(item: OperationalRecord) {
    setRecord(item)
    setEditingRecord(true)
    setEditingSector('sector' in item ? item.sector : '')
    setError('')
  }

  async function remove(id: string) {
    if (!canDelete || !window.confirm('Excluir este registro?')) return
    const table = module === 'change_requests' ? 'change_requests' : 'support_tickets'
    const { error: deleteError } = await createClient().from(table).delete().eq('id', id)
    if (deleteError) setError(`Não foi possível excluir o registro: ${deleteError.message}`)
    else await loadData()
  }

  async function createRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canCreate) return
    setSaving(true)
    setError('')
    const data = Object.fromEntries(new FormData(event.currentTarget).entries())
    const payload = module === 'change_requests'
      ? { requester: data.requester, title: data.title, description: data.description, category: data.category || 'Nova funcionalidade', priority: data.priority || 'Média' }
      : {
          ticket_number: data.ticket_number,
          requester: data.requester,
          subject: data.subject,
          description: data.description,
          category: data.category || 'Suporte corretivo',
          sector: data.sector,
          priority: data.priority || 'Média',
          status: data.status || 'Aberto',
          due_at: toIsoDateTime(data.due_at),
          scheduled_at: toIsoDateTime(data.scheduled_at),
          resolution: data.resolution || null,
          resolved_at: ['Resolvido', 'Fechado'].includes(String(data.status)) ? new Date().toISOString() : null,
        }
    const table = module === 'change_requests' ? 'change_requests' : 'support_tickets'
    const { error: insertError } = await createClient().from(table).insert(payload)
    if (insertError) {
      console.error('Operational record creation failed:', insertError.message)
      setError(`Não foi possível salvar: ${insertError.message}`)
    } else {
      setModal(false)
      await loadData()
    }
    setSaving(false)
  }

  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record || !canUpdate) return
    setSaving(true)
    setError('')
    const data = Object.fromEntries(new FormData(event.currentTarget).entries())
    const isSupportTicket = module === 'support_tickets'
    const previousTicket = isSupportTicket ? record as Ticket : null
    const isResolved = isSupportTicket && ['Resolvido', 'Fechado'].includes(String(data.status))
    const wasResolved = previousTicket && ['Resolvido', 'Fechado'].includes(previousTicket.status)
    const payload = isSupportTicket
      ? {
          subject: data.subject,
          requester: data.requester,
          description: data.description || null,
          category: data.category,
          sector: data.sector,
          priority: data.priority,
          status: data.status,
          due_at: toIsoDateTime(data.due_at),
          scheduled_at: toIsoDateTime(data.scheduled_at),
          resolution: data.resolution || null,
          resolved_at: isResolved ? (wasResolved ? previousTicket.resolved_at : new Date().toISOString()) : null,
          ...(canAssign ? { technical_responsible_id: data.technical_responsible_id || null } : {}),
        }
      : { title: data.title, requester: data.requester, description: data.description || null, category: data.category, priority: data.priority, status: data.status }
    const table = module === 'change_requests' ? 'change_requests' : 'support_tickets'
    const { error: updateError } = await createClient().from(table).update(payload).eq('id', record.id)
    if (updateError) setError(`Não foi possível salvar as alterações: ${updateError.message}`)
    else {
      if (isSupportTicket && isResolved && !wasResolved) await awardXp('resolve_support_ticket', 'support_ticket', record.id)
      if (!isSupportTicket && String(data.status).toLowerCase().includes('aprov')) await awardXp('approve_change_request', 'change_request', record.id)
      setRecord(null)
      setEditingRecord(false)
      await loadData()
    }
    setSaving(false)
  }

  const title = module === 'change_requests' ? 'Solicitações de alteração' : 'Central de suporte'
  const empty = module === 'change_requests' ? 'Nenhuma solicitação cadastrada' : 'Nenhum chamado cadastrado'
  if (module === 'projects') return <ProjectListWorkspace permissions={permissions} onSwitchModule={setModule} />

  return <section className="mt-6 rounded-xl border border-white/[0.07] bg-[#11161e]">
    <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 lg:flex-row lg:items-center lg:justify-between">
      <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-400">Operação e entrega</p><h2 className="mt-1 text-lg font-semibold text-white">{title}</h2><p className="mt-1 text-xs text-slate-500">Acompanhe a execução da software house em um único lugar.</p></div>
      <div className="flex flex-wrap gap-2">{availableModules.map(([key, Icon, label]) => <button key={key} onClick={() => { setModule(key); setQuery(''); setCategoryFilter(''); setSectorFilter(''); setStatusFilter(''); setPriorityFilter(''); setResponsibleFilter(''); setError(''); setModal(false); setRecord(null) }} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${module === key ? 'bg-cyan-500 text-slate-950' : 'bg-white/[0.04] text-slate-400 hover:text-white'}`}><Icon className="size-3.5" />{label}</button>)}{canCreate && <button onClick={() => setModal(true)} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-200"><Plus className="size-3.5" />Novo registro</button>}</div>
    </div>
    <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.07] px-5 py-3"><div className="flex min-w-48 flex-1 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2"><Search className="size-4 text-slate-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar registros..." className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600" /></div>{module === 'support_tickets' && <>
      <select aria-label="Filtrar por categoria" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className={`${inputClass} w-auto min-w-36 py-2 text-xs`}><option value="">Todas categorias</option>{Array.from(new Set(tickets.map((ticket) => ticket.category))).map((category) => <option key={category}>{category}</option>)}</select>
      <select aria-label="Filtrar por setor" value={sectorFilter} onChange={(event) => setSectorFilter(event.target.value)} className={`${inputClass} w-auto min-w-36 py-2 text-xs`}><option value="">Todos os setores</option>{supportSectors.map((sector) => <option key={sector}>{sector}</option>)}</select>
      <select aria-label="Filtrar por status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={`${inputClass} w-auto min-w-36 py-2 text-xs`}><option value="">Todos os status</option>{supportStatuses.map((status) => <option key={status}>{status}</option>)}</select>
      <select aria-label="Filtrar por prioridade" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className={`${inputClass} w-auto min-w-32 py-2 text-xs`}><option value="">Todas prioridades</option>{['Baixa', 'Média', 'Alta', 'Urgente'].map((priority) => <option key={priority}>{priority}</option>)}</select>
      <select aria-label="Filtrar por responsável" value={responsibleFilter} onChange={(event) => setResponsibleFilter(event.target.value)} className={`${inputClass} w-auto min-w-36 py-2 text-xs`}><option value="">Todos responsáveis</option>{Array.from(new Set(tickets.map((ticket) => ticket.technical_responsible_id).filter((id): id is string => Boolean(id)))).map((id) => <option key={id} value={id}>{members.find((member) => member.id === id)?.full_name ?? id}</option>)}</select>
    </>}<button onClick={() => void loadData()} className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-slate-400 hover:text-white">Atualizar</button></div>
    {error && <div className="mx-5 mt-4 flex items-center justify-between rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-300"><span>{error}</span><button onClick={() => setError('')} aria-label="Fechar aviso"><X className="size-3.5" /></button></div>}
    <div className="overflow-x-auto">{loading ? <div className="flex min-h-40 items-center justify-center text-xs text-slate-500"><Loader2 className="mr-2 size-4 animate-spin" />Carregando operação...</div> : operationalRows.length === 0 ? <div className="flex min-h-40 flex-col items-center justify-center text-center"><p className="text-sm text-slate-400">{empty}</p><p className="mt-1 text-xs text-slate-600">{canCreate ? 'Use “Novo registro” para começar.' : 'Nenhum registro encontrado.'}</p></div> : <table className="w-full text-left text-xs">
      <thead className="border-b border-white/[0.07] text-[10px] uppercase tracking-wider text-slate-600"><tr>{module === 'change_requests' ? <><th className="px-5 py-3">Solicitação</th><th className="px-5 py-3">Solicitante</th><th className="px-5 py-3">Status</th></> : <><th className="px-5 py-3">Chamado</th><th className="px-5 py-3">Categoria</th><th className="px-5 py-3">Setor</th><th className="px-5 py-3">Responsável</th><th className="px-5 py-3">Solicitante</th><th className="px-5 py-3">Status</th></>}<th className="px-5 py-3 text-right">Ações</th></tr></thead>
      <tbody>{operationalRows.map((item) => <tr key={item.id} className="border-b border-white/[0.05] last:border-0">
        <td className="px-5 py-3 font-medium text-slate-200">{'ticket_number' in item ? `${item.ticket_number} · ${item.subject}` : item.title}</td>
        {'ticket_number' in item && <><td className="px-5 py-3 text-slate-400">{item.category}</td><td className="px-5 py-3 text-slate-400">{item.sector}</td><td className="px-5 py-3 text-slate-400">{members.find((member) => member.id === item.technical_responsible_id)?.full_name ?? item.technical_responsible_id ?? '—'}</td></>}
        <td className="px-5 py-3 text-slate-400">{item.requester}</td>
        <td className="px-5 py-3 text-slate-500">{item.status}</td>
        <td className="px-5 py-3 text-right"><div className="inline-flex gap-1"><button onClick={() => { setRecord(item); setEditingRecord(false); setError('') }} aria-label="Ver detalhes" className="rounded p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"><Eye className="size-3.5" /></button>{canUpdate && <button onClick={() => openEditor(item)} aria-label="Editar registro" className="rounded p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"><Pencil className="size-3.5" /></button>}{canDelete && <button onClick={() => void remove(item.id)} aria-label="Excluir registro" className="rounded p-1.5 text-slate-600 hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="size-3.5" /></button>}</div></td>
      </tr>)}</tbody>
    </table>}</div>
    {modal && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4"><div className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#151b24] p-5 shadow-2xl">
      <div className="mb-5 flex items-center justify-between"><div><h3 className="font-semibold text-white">Novo {module === 'change_requests' ? 'solicitação' : 'chamado'}</h3><p className="mt-1 text-xs text-slate-500">Os campos obrigatórios são validados pelo banco.</p></div><button onClick={() => setModal(false)} aria-label="Fechar formulário"><X className="size-4 text-slate-500" /></button></div>
      <form onSubmit={(event) => void createRecord(event)} className="grid gap-3 sm:grid-cols-2">
        {module === 'change_requests' ? <>
          <label className="text-xs text-slate-400">Solicitante<input required name="requester" className={`${inputClass} mt-1.5`} /></label>
          <label className="text-xs text-slate-400">Título<input required name="title" className={`${inputClass} mt-1.5`} /></label>
          <label className="text-xs text-slate-400">Categoria<select name="category" className={`${inputClass} mt-1.5`}><option>Nova funcionalidade</option><option>Melhoria</option><option>Correção</option></select></label>
          <label className="text-xs text-slate-400">Prioridade<select name="priority" className={`${inputClass} mt-1.5`}><option>Média</option><option>Baixa</option><option>Alta</option><option>Urgente</option></select></label>
          <label className="text-xs text-slate-400 sm:col-span-2">Descrição<textarea required name="description" rows={4} className={`${inputClass} mt-1.5 resize-y`} /></label>
        </> : <>
          <label className="text-xs text-slate-400">Número do chamado<input required name="ticket_number" className={`${inputClass} mt-1.5`} /></label>
          <label className="text-xs text-slate-400">Solicitante<input required name="requester" className={`${inputClass} mt-1.5`} /></label>
          <label className="text-xs text-slate-400 sm:col-span-2">Assunto<input required name="subject" className={`${inputClass} mt-1.5`} /></label>
          <label className="text-xs text-slate-400">Categoria<select name="category" className={`${inputClass} mt-1.5`}><option>Suporte corretivo</option><option>Dúvida</option><option>Solicitação</option></select></label>
          <label className="text-xs text-slate-400">Setor responsável<select required name="sector" defaultValue="" className={`${inputClass} mt-1.5`}><option value="" disabled>Selecione o setor</option>{supportSectors.map((sector) => <option key={sector}>{sector}</option>)}</select></label>
          <label className="text-xs text-slate-400">Prioridade<select name="priority" className={`${inputClass} mt-1.5`}><option>Média</option><option>Baixa</option><option>Alta</option><option>Urgente</option></select></label>
          <label className="text-xs text-slate-400">Status<select name="status" defaultValue="Aberto" className={`${inputClass} mt-1.5`}>{supportStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label className="text-xs text-slate-400">Prazo<input name="due_at" type="datetime-local" className={`${inputClass} mt-1.5`} /></label>
          <label className="text-xs text-slate-400 sm:col-span-2">Horário agendado<input name="scheduled_at" type="datetime-local" className={`${inputClass} mt-1.5`} /></label>
          <label className="text-xs text-slate-400 sm:col-span-2">Descrição do problema<textarea required name="description" rows={4} className={`${inputClass} mt-1.5 resize-y`} /></label>
          <label className="text-xs text-slate-400 sm:col-span-2">Resolução (opcional)<textarea name="resolution" rows={3} className={`${inputClass} mt-1.5 resize-y`} /></label>
        </>}
        <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setModal(false)} className="rounded-lg px-3 py-2 text-xs text-slate-400">Cancelar</button><button disabled={saving} className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60">{saving ? 'Salvando...' : 'Salvar'}</button></div>
      </form>
    </div></div>}
    {record && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRecord(null) }}><div className="w-full max-w-xl rounded-xl border border-white/10 bg-[#151b24] p-5 shadow-2xl">
      <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-wider text-cyan-300">{module === 'change_requests' ? 'Solicitação' : `Chamado ${(record as Ticket).ticket_number}`}</p><h3 className="mt-1 text-lg font-semibold text-white">{editingRecord ? 'Editar registro' : ('subject' in record ? record.subject : record.title)}</h3></div><button type="button" onClick={() => setRecord(null)} aria-label="Fechar detalhes"><X className="size-5 text-slate-400" /></button></div>
      {editingRecord ? <form onSubmit={(event) => void saveRecord(event)} className="grid gap-3 sm:grid-cols-2">
        {'ticket_number' in record ? <label className="text-xs text-slate-400">Assunto<input name="subject" required defaultValue={record.subject} className={`${inputClass} mt-1`} /></label> : <label className="text-xs text-slate-400">Título<input name="title" required defaultValue={record.title} className={`${inputClass} mt-1`} /></label>}
        <label className="text-xs text-slate-400">Solicitante<input name="requester" required defaultValue={record.requester} className={`${inputClass} mt-1`} /></label>
        <label className="text-xs text-slate-400">Categoria<input name="category" required defaultValue={record.category} className={`${inputClass} mt-1`} /></label>
        {'ticket_number' in record && <label className="text-xs text-slate-400">Setor responsável<select name="sector" required value={editingSector} onChange={(event) => setEditingSector(event.target.value)} className={`${inputClass} mt-1`}>{supportSectors.map((sector) => <option key={sector}>{sector}</option>)}</select></label>}
        {'ticket_number' in record && canAssign && <label className="text-xs text-slate-400">Responsável<select name="technical_responsible_id" defaultValue={record.technical_responsible_id ?? ''} className={`${inputClass} mt-1`}><option value="">Atribuição automática do setor</option>{membersForSector(editingSector).map((member) => <option key={member.id} value={member.id}>{member.full_name}</option>)}</select></label>}
        <label className="text-xs text-slate-400">Prioridade<select name="priority" defaultValue={record.priority} className={`${inputClass} mt-1`}><option>Baixa</option><option>Média</option><option>Alta</option><option>Urgente</option></select></label>
        {'ticket_number' in record
          ? <label className="text-xs text-slate-400">Status<select name="status" required defaultValue={record.status} className={`${inputClass} mt-1`}>{!supportStatuses.includes(record.status) && <option>{record.status}</option>}{supportStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          : <label className="text-xs text-slate-400">Status<input name="status" required defaultValue={record.status} className={`${inputClass} mt-1`} /></label>}
        {'ticket_number' in record && <>
          <label className="text-xs text-slate-400">Prazo<input name="due_at" type="datetime-local" defaultValue={toLocalDateTime(record.due_at)} className={`${inputClass} mt-1`} /></label>
          <label className="text-xs text-slate-400">Horário agendado<input name="scheduled_at" type="datetime-local" defaultValue={toLocalDateTime(record.scheduled_at)} className={`${inputClass} mt-1`} /></label>
        </>}
        <label className="text-xs text-slate-400 sm:col-span-2">Descrição<textarea name="description" defaultValue={record.description || ''} rows={5} className={`${inputClass} mt-1 resize-y`} /></label>
        {'ticket_number' in record && <label className="text-xs text-slate-400 sm:col-span-2">Resolução<textarea name="resolution" defaultValue={record.resolution || ''} rows={4} className={`${inputClass} mt-1 resize-y`} /></label>}
        <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setEditingRecord(false)} className="rounded-lg px-3 py-2 text-xs text-slate-300">Cancelar</button><button disabled={saving} className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950">{saving ? 'Salvando...' : 'Salvar alterações'}</button></div>
      </form> : <><div className="grid gap-4 text-sm sm:grid-cols-2"><p className="text-slate-400">Solicitante<span className="mt-1 block text-slate-200">{record.requester}</span></p><p className="text-slate-400">Status / prioridade<span className="mt-1 block text-slate-200">{record.status} · {record.priority}</span></p><p className="text-slate-400">Categoria<span className="mt-1 block text-slate-200">{record.category}</span></p>{'ticket_number' in record && <>
        <p className="text-slate-400">Setor responsável<span className="mt-1 block text-slate-200">{record.sector}</span></p>
        <p className="text-slate-400">Responsável<span className="mt-1 block text-slate-200">{members.find((member) => member.id === record.technical_responsible_id)?.full_name ?? record.technical_responsible_id ?? '—'}</span></p>
        <p className="text-slate-400">Prazo<span className="mt-1 block text-slate-200">{record.due_at ? new Date(record.due_at).toLocaleString('pt-BR') : 'Não definido'}</span></p>
        <p className="text-slate-400">Horário agendado<span className="mt-1 block text-slate-200">{record.scheduled_at ? new Date(record.scheduled_at).toLocaleString('pt-BR') : 'Não definido'}</span></p>
        <p className="text-slate-400">Resolvido em<span className="mt-1 block text-slate-200">{record.resolved_at ? new Date(record.resolved_at).toLocaleString('pt-BR') : '—'}</span></p>
        <p className="whitespace-pre-wrap text-slate-300 sm:col-span-2">Descrição: {record.description || 'Sem descrição cadastrada.'}</p>
        <p className="whitespace-pre-wrap text-slate-300 sm:col-span-2">Resolução: {record.resolution || 'Ainda não informada.'}</p>
      </>}
      {'ticket_number' in record ? null : <p className="whitespace-pre-wrap text-slate-300 sm:col-span-2">{record.description || 'Sem descrição cadastrada.'}</p>}
      </div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setRecord(null)} className="rounded-lg px-3 py-2 text-xs text-slate-300">Fechar</button>{canUpdate && <button type="button" onClick={() => { setEditingRecord(true); setEditingSector('sector' in record ? record.sector : '') }} className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950"><Pencil className="size-3.5" />Editar</button>}</div></>}
      {error && <p role="alert" className="mt-4 rounded-lg bg-amber-400/10 p-3 text-xs text-amber-300">{error}</p>}
    </div></div>}
  </section>
}
