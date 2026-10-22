'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2 } from 'lucide-react'

type Member = { user_id: string | null; full_name: string; email: string; status: string }

type RequestRow = { id: string; task_id: string; requester_id: string; target_id: string; request_type: 'share' | 'transfer'; status: string }

export function TaskSharing({ taskId, projectId, currentUserId, responsibleId, onChanged }: { taskId: string; projectId: string; currentUserId: string; responsibleId: string | null; onChanged?: () => void }) {
  const [members, setMembers] = useState<Member[]>([])
  const [target, setTarget] = useState('')
  const [requestType, setRequestType] = useState<'share' | 'transfer'>('share')
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  async function load() {
    const [memberResult, requestResult] = await Promise.all([
      supabase.from('team_members').select('user_id,full_name,email,status').eq('status', 'Ativo').order('full_name'),
      supabase.from('task_transfer_requests').select('id,task_id,requester_id,target_id,request_type,status').eq('task_id', taskId).order('created_at', { ascending: false }),
    ])
    setMembers((memberResult.data ?? []) as Member[])
    setRequests((requestResult.data ?? []) as RequestRow[])
  }
  useEffect(() => { void load() }, [taskId])

  async function request() {
    if (!target || target === currentUserId) return
    setBusy(true); setMessage('')
    const { error } = await supabase.from('task_transfer_requests').insert({ task_id: taskId, requester_id: currentUserId, target_id: target, request_type: requestType })
    if (error) setMessage('Não foi possível enviar a solicitação.')
    else {
      await supabase.from('notifications').insert({ recipient_id: target, notification_type: `task_${requestType}`, message: `Você recebeu uma solicitação de ${requestType === 'share' ? 'compartilhamento' : 'transferência'} de task.`, entity_type: 'task', entity_id: taskId, link_path: `/workspace/projetos/${projectId}` })
      setMessage('Solicitação enviada para consentimento.'); setTarget(''); await load(); onChanged?.()
    }
    setBusy(false)
  }

  async function respond(item: RequestRow, status: 'accepted' | 'rejected') {
    setBusy(true); setMessage('')
    const { error } = await supabase.from('task_transfer_requests').update({ status, responded_at: new Date().toISOString() }).eq('id', item.id).eq('target_id', currentUserId)
    if (!error && status === 'accepted' && item.request_type === 'transfer') {
      await supabase.from('project_tasks').update({ responsible_id: currentUserId }).eq('id', taskId)
    }
    if (!error) { await supabase.from('notifications').insert({ recipient_id: item.requester_id, notification_type: `task_${status}`, message: `Sua solicitação de ${item.request_type === 'share' ? 'compartilhamento' : 'transferência'} foi ${status === 'accepted' ? 'aceita' : 'recusada'}.`, entity_type: 'task', entity_id: taskId, link_path: `/workspace/projetos/${projectId}` }); await load(); onChanged?.() }
    else setMessage('Não foi possível responder à solicitação.')
    setBusy(false)
  }

  return <div className="mt-4 rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
    <p className="text-xs font-semibold text-slate-300">Compartilhar ou transferir atividade</p>
    <div className="mt-2 flex flex-wrap gap-2"><select value={requestType} onChange={(event) => setRequestType(event.target.value as 'share' | 'transfer')} className="field"><option value="share">Compartilhar</option><option value="transfer">Transferir responsabilidade</option></select><select value={target} onChange={(event) => setTarget(event.target.value)} className="field"><option value="">Escolha um membro</option>{members.filter((member) => member.user_id && member.user_id !== currentUserId && member.user_id !== responsibleId).map((member) => <option key={member.user_id} value={member.user_id as string}>{member.full_name}</option>)}</select><button type="button" onClick={() => void request()} disabled={!target || busy} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><Send className="size-3.5" />{busy ? <Loader2 className="size-3.5 animate-spin" /> : 'Enviar'}</button></div>
    {requests.filter((item) => item.status === 'pending' && item.target_id === currentUserId).map((item) => <div key={item.id} className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-amber-400/10 p-2 text-xs text-amber-100"><span>Solicitação de {item.request_type === 'share' ? 'compartilhamento' : 'transferência'} pendente.</span><span className="flex gap-1"><button type="button" onClick={() => void respond(item, 'accepted')} className="rounded bg-emerald-500/20 px-2 py-1">Aceitar</button><button type="button" onClick={() => void respond(item, 'rejected')} className="rounded bg-rose-500/20 px-2 py-1">Recusar</button></span></div>)}
    {message && <p role="status" className="mt-2 text-xs text-slate-400">{message}</p>}
  </div>
}
