'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, Loader2, Paperclip, Trash2, Upload } from 'lucide-react'

type Attachment = { id: string; file_name: string; storage_path: string; mime_type: string; file_size: number; uploaded_by: string | null; created_at: string }
type TeamMember = { id: string; user_id: string | null; full_name: string }

export function EntityAttachments({ entityType, entityId }: { entityType: string; entityId: string }) {
  const [items, setItems] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [members, setMembers] = useState<TeamMember[]>([])
  const supabase = createClient()

  async function load() {
    const [attachmentResult, memberResult] = await Promise.all([
      supabase.from('entity_attachments').select('id,file_name,storage_path,mime_type,file_size,uploaded_by,created_at').eq('entity_type', entityType).eq('entity_id', entityId).order('created_at', { ascending: false }),
      supabase.from('team_members').select('id,user_id,full_name'),
    ])
    if (attachmentResult.error) setMessage(attachmentResult.error.message)
    else setItems((attachmentResult.data ?? []) as Attachment[])
    if (memberResult.error) setMessage(memberResult.error.message)
    else setMembers((memberResult.data ?? []) as TeamMember[])
    setLoading(false)
  }

  useEffect(() => { void load() }, [entityId, entityType])

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setMessage('O arquivo deve ter no máximo 10 MB.'); return }
    if (!file.name.trim() || (file.type && !/^[\w!#$&^_.+-]+\/[\w!#$&^_.+-]+$/.test(file.type))) { setMessage('O tipo ou nome do arquivo não é válido.'); return }
    setUploading(true); setMessage('')
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) { setMessage(userError.message); setUploading(false); return }
    if (!userData.user) { setMessage('Sua sessão expirou. Entre novamente.'); setUploading(false); return }
    const storagePath = `${userData.user.id}/${entityType}/${entityId}/${crypto.randomUUID()}-${file.name}`
    const uploadResult = await supabase.storage.from('private-documents').upload(storagePath, file, { contentType: file.type || 'application/octet-stream', upsert: false })
    if (uploadResult.error) { setMessage(uploadResult.error.message); setUploading(false); return }
    const insertResult = await supabase.from('entity_attachments').insert({ entity_type: entityType, entity_id: entityId, file_name: file.name, storage_path: storagePath, mime_type: file.type || 'application/octet-stream', file_size: file.size, uploaded_by: userData.user.id })
    if (insertResult.error) {
      const { error: cleanupError } = await supabase.storage.from('private-documents').remove([storagePath])
      setMessage(cleanupError ? `Não foi possível registrar o anexo (${insertResult.error.message}) nem remover o arquivo enviado (${cleanupError.message}).` : insertResult.error.message)
      setUploading(false)
      return
    }
    setMessage('Anexo enviado.'); await load(); setUploading(false)
  }

  async function download(item: Attachment) {
    const { data, error } = await supabase.storage.from('private-documents').createSignedUrl(item.storage_path, 60)
    if (error || !data?.signedUrl) { setMessage(error?.message ?? 'O armazenamento não retornou um link de acesso.'); return }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  async function remove(item: Attachment) {
    if (!window.confirm(`Excluir “${item.file_name}”?`)) return
    const { error: storageError } = await supabase.storage.from('private-documents').remove([item.storage_path])
    if (storageError) { setMessage(storageError.message); return }
    const { error } = await supabase.from('entity_attachments').delete().eq('id', item.id)
    if (error) setMessage(`Arquivo removido do armazenamento, mas os metadados não puderam ser excluídos: ${error.message}`)
    else { setMessage('Anexo excluído.'); await load() }
  }

  return <div className="mt-5 rounded-lg border border-white/[0.07] bg-white/[0.02] p-4"><div className="flex items-center justify-between"><div><p className="flex items-center gap-2 text-xs font-semibold text-slate-300"><Paperclip className="size-3.5 text-violet-300" />Anexos</p><p className="mt-1 text-[11px] text-slate-600">Documentos privados, disponíveis somente para usuários autenticados.</p></div><label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-2 text-[11px] font-semibold text-white hover:bg-violet-400"><Upload className="size-3.5" />{uploading ? 'Enviando...' : 'Adicionar arquivo'}<input type="file" className="sr-only" onChange={upload} disabled={uploading} /></label></div>{message && <p role="status" className="mt-3 text-xs text-slate-400">{message}</p>}{loading ? <p className="mt-4 flex items-center text-xs text-slate-600"><Loader2 className="mr-2 size-3.5 animate-spin" />Carregando anexos...</p> : items.length === 0 ? <p className="mt-4 text-sm text-slate-500">Nenhum anexo.</p> : <div className="mt-3 space-y-2">{items.map((item) => { const member = members.find((person) => person.user_id === item.uploaded_by || person.id === item.uploaded_by); return <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-white/[0.06] px-3 py-2"><div className="min-w-0"><p className="truncate text-sm text-slate-200">{item.file_name}</p><p className="mt-1 flex flex-wrap gap-x-2 text-xs text-slate-500"><span>{item.mime_type || 'Tipo não informado'}</span><span>{Math.max(1, Math.round(item.file_size / 1024))} KB</span><span>{member?.full_name || 'Membro da equipe'}</span><span>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(item.created_at))}</span></p></div><div className="flex shrink-0 gap-1"><button type="button" onClick={() => void download(item)} aria-label={`Baixar ${item.file_name}`} className="rounded p-2 text-slate-400 hover:bg-white/5 hover:text-white"><Download className="size-4" /></button><button type="button" onClick={() => void remove(item)} aria-label={`Excluir ${item.file_name}`} className="rounded p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="size-4" /></button></div></div>})}</div>}</div>
}
