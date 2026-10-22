'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, Check, ClipboardList, Save, Search, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Member = { id: string; user_id: string | null; full_name: string; email: string; job_title: string | null; department: string | null; role_name: string; status: string }
type Notification = { id: string; message: string; notification_type: string; read_at: string | null; created_at: string }
type AuditEvent = { id: string; action_name: string; entity_type: string; result: string; created_at: string }

const tabs = [['team', 'Equipe'], ['notifications', 'Notificações'], ['audit', 'Auditoria'], ['settings', 'Configurações']] as const

export function AdminWorkspace({ section }: { section: string }) {
  const supabase = createClient()
  const [tab, setTab] = useState<(typeof tabs)[number][0]>(section === 'Configurações' ? 'settings' : section === 'Equipe' ? 'team' : section === 'Relatórios' ? 'audit' : 'notifications')
  const [members, setMembers] = useState<Member[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [audit, setAudit] = useState<AuditEvent[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [settings, setSettings] = useState({ trade_name: '', legal_name: '', email: '', phone: '' })
  const [memberTasks, setMemberTasks] = useState<{ id: string; title: string; project_id: string | null }[]>([])
  const [selectedMember, setSelectedMember] = useState('')

  async function load() {
    setLoading(true)
    const [{ data: memberRows }, { data: notificationRows }, { data: auditRows }, { data: companyRows }] = await Promise.all([
      supabase.from('team_members').select('id,user_id,full_name,email,job_title,department,role_name,status').order('full_name'),
      supabase.from('notifications').select('id,message,notification_type,read_at,created_at').order('created_at', { ascending: false }).limit(30),
      supabase.from('admin_audit_events').select('id,action_name,entity_type,result,created_at').order('created_at', { ascending: false }).limit(30),
      supabase.from('company_settings').select('trade_name,legal_name,email,phone').limit(1),
    ])
    setMembers(memberRows ?? [])
    setNotifications(notificationRows ?? [])
    setAudit(auditRows ?? [])
    setSettings(companyRows?.[0] ?? { trade_name: '', legal_name: '', email: '', phone: '' })
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  async function viewMemberTasks(member: Member) {
    if (!member.user_id) return
    setSelectedMember(member.id)
    const { data } = await supabase.from('project_tasks').select('id,title,project_id').or(`responsible_id.eq.${member.user_id},participants.cs.{${member.user_id}}`).order('created_at', { ascending: false }).limit(100)
    setMemberTasks(data ?? [])
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item))
  }

  async function saveSettings() {
    const { data: existing } = await supabase.from('company_settings').select('id').limit(1).maybeSingle()
    const result = existing ? await supabase.from('company_settings').update(settings).eq('id', existing.id) : await supabase.from('company_settings').insert(settings)
    setMessage(result.error ? 'Não foi possível salvar as configurações.' : 'Configurações salvas com sucesso.')
  }

  const filteredMembers = useMemo(() => members.filter((member) => `${member.full_name} ${member.email} ${member.role_name}`.toLowerCase().includes(search.toLowerCase())), [members, search])
  const unread = notifications.filter((item) => !item.read_at).length

  return <section className="space-y-6" id="admin-workspace">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-blue-400">Administração</p><h1 className="text-2xl font-semibold text-white">Controle do workspace</h1><p className="mt-1.5 text-sm text-slate-500">Equipe, permissões, notificações, auditoria e dados institucionais.</p></div><div className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="size-4 text-emerald-400" />RLS ativo</div></header>
    <div className="flex gap-1 overflow-x-auto border-b border-white/[0.07]">{tabs.map(([value, label]) => <button key={value} onClick={() => setTab(value)} className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs font-medium ${tab === value ? 'border-blue-400 text-blue-300' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>{label}{value === 'notifications' && unread > 0 ? ` (${unread})` : ''}</button>)}</div>
    {loading ? <div className="rounded-xl border border-white/[0.07] bg-[#11161e] p-8 text-sm text-slate-500">Carregando dados administrativos...</div> : tab === 'team' ? <div className="space-y-4"><div className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-[#11161e] px-3 py-2"><Search className="size-4 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar pessoa, e-mail ou papel" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" /></div><div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#11161e]"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><h2 className="text-sm font-semibold text-slate-200">Membros da equipe</h2><UserPlus className="size-4 text-slate-500" /></div>{filteredMembers.length ? filteredMembers.map((member) => <div key={member.id} className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4 last:border-0"><div><p className="text-sm font-medium text-slate-200">{member.full_name}</p><p className="mt-1 text-xs text-slate-500">{member.email} · {member.job_title || 'Sem cargo'}</p></div><div className="flex items-center gap-3 text-right"><div><p className="text-xs text-blue-300">{member.role_name}</p><p className="mt-1 text-[11px] text-emerald-400">{member.status}</p></div><button type="button" onClick={() => void viewMemberTasks(member)} className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/5">Ver atividades</button></div></div>) : <div className="flex min-h-40 flex-col items-center justify-center text-center"><Users className="mb-3 size-6 text-slate-600" /><p className="text-sm text-slate-400">Nenhum membro cadastrado</p><p className="mt-1 text-xs text-slate-600">Cadastre a equipe para controlar acessos.</p></div>}</div>{selectedMember && <div className="rounded-xl border border-blue-400/20 bg-blue-400/5 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-200">Atividades do membro selecionado</h3><button type="button" onClick={() => { setSelectedMember(''); setMemberTasks([]) }} className="text-xs text-slate-500 hover:text-slate-300">Fechar</button></div>{memberTasks.length ? <div className="space-y-2">{memberTasks.map((task) => <div key={task.id} className="rounded-lg border border-white/[0.06] bg-[#11161e] px-3 py-2 text-xs text-slate-300">{task.title}<span className="ml-2 text-slate-600">{task.project_id ? 'Vinculada a projeto' : 'Sem projeto'}</span></div>)}</div> : <p className="text-xs text-slate-500">Nenhuma atividade encontrada para este membro.</p>}</div>}</div> : tab === 'notifications' ? <div className="rounded-xl border border-white/[0.07] bg-[#11161e]">{notifications.length ? notifications.map((item) => <div key={item.id} className="flex items-start gap-3 border-b border-white/[0.05] px-5 py-4 last:border-0"><Bell className={`mt-0.5 size-4 ${item.read_at ? 'text-slate-600' : 'text-blue-400'}`} /><div className="min-w-0 flex-1"><p className="text-sm text-slate-300">{item.message}</p><p className="mt-1 text-[11px] text-slate-600">{new Date(item.created_at).toLocaleString('pt-BR')}</p></div>{!item.read_at && <button onClick={() => void markRead(item.id)} className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-white" aria-label="Marcar como lida"><Check className="size-4" /></button>}</div>) : <div className="p-10 text-center text-sm text-slate-500">Nenhuma notificação encontrada.</div>}</div> : tab === 'audit' ? <div className="rounded-xl border border-white/[0.07] bg-[#11161e]">{audit.length ? audit.map((event) => <div key={event.id} className="flex items-center gap-3 border-b border-white/[0.05] px-5 py-4 last:border-0"><ClipboardList className="size-4 text-slate-500" /><div className="flex-1"><p className="text-sm text-slate-300">{event.action_name} · {event.entity_type}</p><p className="mt-1 text-[11px] text-slate-600">{new Date(event.created_at).toLocaleString('pt-BR')}</p></div><span className="text-xs text-emerald-400">{event.result}</span></div>) : <div className="p-10 text-center text-sm text-slate-500">Nenhum evento de auditoria encontrado.</div>}</div> : <div className="max-w-2xl rounded-xl border border-white/[0.07] bg-[#11161e] p-5"><div className="grid gap-4 sm:grid-cols-2">{([['trade_name', 'Nome comercial'], ['legal_name', 'Razão social'], ['email', 'E-mail institucional'], ['phone', 'Telefone']] as const).map(([key, label]) => <label key={key} className="text-xs text-slate-500">{label}<input value={settings[key]} onChange={(event) => setSettings({ ...settings, [key]: event.target.value })} className="mt-2 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400" /></label>)}</div><button onClick={() => void saveSettings()} className="mt-5 flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-400"><Save className="size-4" />Salvar configurações</button>{message && <p className="mt-3 text-xs text-emerald-400">{message}</p>}</div>}
  </section>
}
