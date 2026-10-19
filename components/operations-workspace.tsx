'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClipboardList, FolderKanban, Headphones, Loader2, Plus, Search, Trash2, X } from 'lucide-react'

type Module = 'projects' | 'change_requests' | 'support_tickets'
type Project = { id: string; name: string; status: string; priority: string; due_date: string | null; contracted_value: number; client_id: string | null }
type ChangeRequest = { id: string; title: string; requester: string; status: string; priority: string; category: string; effort_hours: number }
type Ticket = { id: string; ticket_number: string; subject: string; requester: string; status: string; priority: string; category: string; due_at: string | null }

const modules = [
  ['projects', FolderKanban, 'Projetos'],
  ['change_requests', ClipboardList, 'Alterações'],
  ['support_tickets', Headphones, 'Suporte'],
] as const

export function OperationsWorkspace() {
  const [module, setModule] = useState<Module>('projects')
  const [projects, setProjects] = useState<Project[]>([])
  const [requests, setRequests] = useState<ChangeRequest[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(false)
  const [error, setError] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const [projectResult, requestResult, ticketResult] = await Promise.all([
      supabase.from('projects').select('id,name,status,priority,due_date,contracted_value,client_id').order('created_at', { ascending: false }),
      supabase.from('change_requests').select('id,title,requester,status,priority,category,effort_hours').order('created_at', { ascending: false }),
      supabase.from('support_tickets').select('id,ticket_number,subject,requester,status,priority,category,due_at').order('created_at', { ascending: false }),
    ])
    if (projectResult.error || requestResult.error || ticketResult.error) setError('Não foi possível carregar os dados operacionais. Verifique sua sessão.')
    setProjects((projectResult.data ?? []) as Project[])
    setRequests((requestResult.data ?? []) as ChangeRequest[])
    setTickets((ticketResult.data ?? []) as Ticket[])
    setLoading(false)
  }

  useEffect(() => { void loadData() }, [])

  const filtered = useMemo(() => {
    const term = query.toLowerCase()
    if (module === 'projects') return projects.filter((item) => `${item.name} ${item.status} ${item.priority}`.toLowerCase().includes(term))
    if (module === 'change_requests') return requests.filter((item) => `${item.title} ${item.requester} ${item.category}`.toLowerCase().includes(term))
    return tickets.filter((item) => `${item.ticket_number} ${item.subject} ${item.requester}`.toLowerCase().includes(term))
  }, [module, projects, query, requests, tickets])

  async function remove(id: string) {
    if (!window.confirm('Excluir este registro?')) return
    const table = module === 'projects' ? 'projects' : module === 'change_requests' ? 'change_requests' : 'support_tickets'
    const { error: deleteError } = await createClient().from(table).delete().eq('id', id)
    if (deleteError) setError('Não foi possível excluir o registro.')
    else void loadData()
  }

  async function createRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const data = Object.fromEntries(new FormData(event.currentTarget).entries())
    const payload = module === 'projects'
      ? { name: data.name, description: data.description || null, priority: data.priority || 'Média', status: data.status || 'Backlog' }
      : module === 'change_requests'
        ? { requester: data.requester, title: data.title, description: data.description, category: data.category || 'Nova funcionalidade', priority: data.priority || 'Média' }
        : { ticket_number: data.ticket_number, requester: data.requester, subject: data.subject, description: data.description, category: data.category || 'Suporte corretivo', priority: data.priority || 'Média' }
    const table = module === 'projects' ? 'projects' : module === 'change_requests' ? 'change_requests' : 'support_tickets'
    const { error: insertError } = await createClient().from(table).insert(payload)
    if (insertError) setError('Não foi possível salvar. Confira os campos obrigatórios e a sessão.')
    else { setModal(false); void loadData() }
    setSaving(false)
  }

  const title = module === 'projects' ? 'Projetos e entregas' : module === 'change_requests' ? 'Solicitações de alteração' : 'Central de suporte'
  const empty = module === 'projects' ? 'Nenhum projeto cadastrado' : module === 'change_requests' ? 'Nenhuma solicitação cadastrada' : 'Nenhum chamado cadastrado'

  return <section className="mt-6 rounded-xl border border-white/[0.07] bg-[#11161e]">
    <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 lg:flex-row lg:items-center lg:justify-between">
      <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-400">Operação e entrega</p><h2 className="mt-1 text-lg font-semibold text-white">{title}</h2><p className="mt-1 text-xs text-slate-500">Acompanhe a execução da software house em um único lugar.</p></div>
      <div className="flex flex-wrap gap-2">{modules.map(([key, Icon, label]) => <button key={key} onClick={() => { setModule(key); setQuery('') }} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${module === key ? 'bg-cyan-500 text-slate-950' : 'bg-white/[0.04] text-slate-400 hover:text-white'}`}><Icon className="size-3.5" />{label}</button>)}<button onClick={() => setModal(true)} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-200"><Plus className="size-3.5" />Novo registro</button></div>
    </div>
    <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-3"><div className="flex flex-1 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2"><Search className="size-4 text-slate-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar registros..." className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600" /></div><button onClick={() => void loadData()} className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-slate-400 hover:text-white">Atualizar</button></div>
    {error && <div className="mx-5 mt-4 flex items-center justify-between rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-300"><span>{error}</span><button onClick={() => setError('')} aria-label="Fechar aviso"><X className="size-3.5" /></button></div>}
    <div className="overflow-x-auto">{loading ? <div className="flex min-h-40 items-center justify-center text-xs text-slate-500"><Loader2 className="mr-2 size-4 animate-spin" />Carregando operação...</div> : filtered.length === 0 ? <div className="flex min-h-40 flex-col items-center justify-center text-center"><p className="text-sm text-slate-400">{empty}</p><p className="mt-1 text-xs text-slate-600">Use “Novo registro” para começar.</p></div> : <table className="w-full text-left text-xs"><thead className="border-b border-white/[0.07] text-[10px] uppercase tracking-wider text-slate-600"><tr>{module === 'projects' ? <><th className="px-5 py-3">Projeto</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Prazo</th></> : module === 'change_requests' ? <><th className="px-5 py-3">Solicitação</th><th className="px-5 py-3">Solicitante</th><th className="px-5 py-3">Status</th></> : <><th className="px-5 py-3">Chamado</th><th className="px-5 py-3">Solicitante</th><th className="px-5 py-3">Status</th></>}<th className="px-5 py-3 text-right">Ações</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className="border-b border-white/[0.05] last:border-0"><td className="px-5 py-3 font-medium text-slate-200">{module === 'projects' ? (item as Project).name : module === 'change_requests' ? (item as ChangeRequest).title : `${(item as Ticket).ticket_number} · ${(item as Ticket).subject}`}</td><td className="px-5 py-3 text-slate-400">{module === 'projects' ? (item as Project).status : module === 'change_requests' ? (item as ChangeRequest).requester : (item as Ticket).requester}</td><td className="px-5 py-3 text-slate-500">{module === 'projects' ? ((item as Project).due_date || 'Sem prazo') : module === 'change_requests' ? (item as ChangeRequest).status : (item as Ticket).status}</td><td className="px-5 py-3 text-right"><button onClick={() => void remove(item.id)} aria-label="Excluir registro" className="rounded p-1.5 text-slate-600 hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="size-3.5" /></button></td></tr>)}</tbody></table>}</div>
    {modal && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#151b24] p-5 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-semibold text-white">Novo {module === 'projects' ? 'projeto' : module === 'change_requests' ? 'solicitação' : 'chamado'}</h3><p className="mt-1 text-xs text-slate-500">Os campos obrigatórios são validados pelo banco.</p></div><button onClick={() => setModal(false)} aria-label="Fechar formulário" className="text-slate-500 hover:text-white"><X className="size-4" /></button></div><form onSubmit={createRecord} className="flex flex-col gap-3">{module === 'projects' && <><input required name="name" placeholder="Nome do projeto *" className="field" /><textarea name="description" placeholder="Descrição e escopo" rows={3} className="field resize-none" /><select name="priority" className="field"><option>Média</option><option>Baixa</option><option>Alta</option><option>Urgente</option></select></>}{module === 'change_requests' && <><input required name="requester" placeholder="Solicitante *" className="field" /><input required name="title" placeholder="Título da solicitação *" className="field" /><textarea required name="description" placeholder="Descrição *" rows={3} className="field resize-none" /><input name="category" placeholder="Categoria" className="field" /></>}{module === 'support_tickets' && <><input required name="ticket_number" placeholder="Número do chamado *" className="field" /><input required name="requester" placeholder="Solicitante *" className="field" /><input required name="subject" placeholder="Assunto *" className="field" /><textarea required name="description" placeholder="Descrição do problema *" rows={3} className="field resize-none" /><input name="category" placeholder="Categoria" className="field" /></>}<div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => setModal(false)} className="rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-white">Cancelar</button><button disabled={saving} className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60">{saving && <Loader2 className="size-3.5 animate-spin" />}Salvar registro</button></div></form></div></div>}
  </section>
}
