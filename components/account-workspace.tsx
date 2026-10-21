'use client'

import { FormEvent, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AccountWorkspace({ section }: { section: string }) {
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState('')
  const [theme, setTheme] = useState('dark')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem('codexa-theme')
    if (saved) setTheme(saved)
    void createClient().auth.getUser().then(({ data }: { data: { user: any } }) => {
      setUser(data.user)
      setName(data.user?.user_metadata?.display_name ?? '')
    })
  }, [])

  function applyTheme(value: string) {
    setTheme(value)
    window.localStorage.setItem('codexa-theme', value)
    document.documentElement.dataset.theme = value
    setMessage('Preferência de aparência salva.')
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault(); setSaving(true); setMessage('')
    const { error } = await createClient().auth.updateUser({ data: { display_name: name.trim() } })
    setMessage(error ? 'Não foi possível salvar seu perfil.' : 'Perfil atualizado com sucesso.')
    setSaving(false)
  }

  const isAppearance = section === 'Aparência'
  return <section className="mt-6 max-w-3xl rounded-xl border border-white/[0.07] bg-[#11161e] p-6">
    <p className="text-xs font-medium uppercase tracking-[0.16em] text-violet-400">Configurações pessoais</p>
    <h1 className="mt-2 text-2xl font-semibold text-white">{isAppearance ? 'Aparência' : 'Meu perfil'}</h1>
    <p className="mt-2 text-sm text-slate-500">{isAppearance ? 'Escolha como o workspace aparece para você.' : 'Consulte e atualize seus dados pessoais sem alterar suas permissões.'}</p>
    {isAppearance ? <div className="mt-6 grid gap-3 sm:grid-cols-3">{[['dark','Escuro'],['light','Claro'],['system','Automático']].map(([value,label]) => <button key={value} onClick={() => applyTheme(value)} className={`rounded-xl border p-4 text-left ${theme === value ? 'border-violet-400 bg-violet-400/10' : 'border-white/[0.08] bg-white/[0.03]'}`}><span className="block text-sm font-medium text-white">{label}</span><span className="mt-1 block text-xs text-slate-500">Aplicar tema {label.toLowerCase()}</span></button>)}</div> : <form onSubmit={saveProfile} className="mt-6 space-y-4"><div><label className="text-xs text-slate-400">Nome de exibição</label><input value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-3 text-sm text-white outline-none" /></div><div><span className="text-xs text-slate-400">E-mail da conta</span><p className="mt-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-sm text-slate-300">{user?.email ?? 'Carregando...'}</p></div><button disabled={saving} className="rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Salvando...' : 'Salvar alterações'}</button></form>}
    {message && <p role="status" className="mt-4 text-xs text-emerald-300">{message}</p>}
  </section>
}
