'use client'

import { FormEvent, useEffect, useState } from 'react'
import type { AuthError, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { applyWorkspaceTheme, getWorkspaceThemePreference, type WorkspaceTheme } from '@/lib/workspace-theme'

export function AccountWorkspace({ section, initialName = '' }: { section: string; initialName?: string }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState(initialName)
  const [theme, setTheme] = useState<WorkspaceTheme>('dark')
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setTheme(getWorkspaceThemePreference())
    setName(initialName)
    void createClient().auth.getUser().then(({ data, error }: { data: { user: User | null }; error: AuthError | null }) => {
      if (error) {
        console.error('Account profile load failed:', error.message)
        setMessageError(true)
        setMessage('Não foi possível carregar os dados da conta.')
        return
      }
      setEmail(data.user?.email ?? '')
    })
  }, [initialName])

  function selectTheme(value: WorkspaceTheme) {
    setTheme(value)
    applyWorkspaceTheme(value)
    setMessageError(false)
    setMessage('Preferência de aparência salva.')
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setMessageError(false)
    try {
      const response = await fetch('/api/workspace/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: name }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Não foi possível salvar seu perfil.')
      setMessage('Perfil atualizado com sucesso.')
      window.location.reload()
    } catch (error) {
      console.error('Account profile save failed:', error)
      setMessageError(true)
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar seu perfil.')
    } finally {
      setSaving(false)
    }
  }

  const isAppearance = section === 'Aparência'
  return <section className="mt-6 max-w-3xl rounded-xl border border-white/[0.07] bg-[#11161e] p-6">
    <p className="text-xs font-medium uppercase tracking-[0.16em] text-violet-400">Configurações pessoais</p>
    <h1 className="mt-2 text-2xl font-semibold text-white">{isAppearance ? 'Aparência' : 'Meu perfil'}</h1>
    <p className="mt-2 text-sm text-slate-500">{isAppearance ? 'Escolha como o workspace aparece para você.' : 'Consulte e atualize seus dados pessoais sem alterar suas permissões.'}</p>
    {isAppearance ? <div className="mt-6 grid gap-3 sm:grid-cols-3">{([['dark','Escuro'],['light','Claro'],['system','Automático']] as const).map(([value,label]) => <button key={value} aria-pressed={theme === value} onClick={() => selectTheme(value)} className={`rounded-xl border p-4 text-left ${theme === value ? 'border-violet-400 bg-violet-400/10' : 'border-white/[0.08] bg-white/[0.03]'}`}><span className="block text-sm font-medium text-white">{label}</span><span className="mt-1 block text-xs text-slate-500">{value === 'system' ? 'Seguir a preferência do dispositivo' : `Aplicar tema ${label.toLowerCase()}`}</span></button>)}</div> : <form onSubmit={saveProfile} className="mt-6 space-y-4"><div><label htmlFor="profile-name" className="text-xs text-slate-400">Nome de exibição</label><input id="profile-name" required minLength={2} maxLength={200} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-3 text-sm text-white outline-none" /></div><div><span className="text-xs text-slate-400">E-mail da conta</span><p className="mt-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-sm text-slate-300">{email || 'Carregando...'}</p></div><button disabled={saving} className="rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Salvando...' : 'Salvar alterações'}</button></form>}
    {message && <p role={messageError ? 'alert' : 'status'} className={`mt-4 text-xs ${messageError ? 'text-rose-300' : 'text-emerald-300'}`}>{message}</p>}
  </section>
}
