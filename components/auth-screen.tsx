'use client'

import { FormEvent, useEffect, useState } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Loader2, LockKeyhole, Mail } from 'lucide-react'

export function AuthScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => { if (data.session) onAuthenticated() })
    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => { if (session) onAuthenticated() })
    return () => listener.subscription.unsubscribe()
  }, [onAuthenticated])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password })
    if (error) setMessage(error.message.toLowerCase().includes('email not confirmed') ? 'Confirme seu e-mail antes de entrar.' : 'E-mail ou senha inválidos.')
    setLoading(false)
  }

  return <main className="grid min-h-screen place-items-center bg-[#080b10] px-4 text-slate-100"><form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#11161e] p-7 shadow-2xl"><div className="mb-7"><div className="mb-4 grid size-11 place-items-center rounded-xl bg-blue-500/15 text-blue-300"><LockKeyhole className="size-5" /></div><p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-400">CRM operacional</p><h1 className="mt-2 text-2xl font-semibold text-white">Entrar no workspace</h1><p className="mt-2 text-sm text-slate-500">Use seu e-mail e senha para acessar os registros.</p></div><label className="mb-3 block text-xs text-slate-400">E-mail<div className="mt-1 flex items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3"><Mail className="size-4 text-slate-600" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full bg-transparent py-3 text-sm text-white outline-none" autoComplete="email" /></div></label><label className="block text-xs text-slate-400">Senha<input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-3 text-sm text-white outline-none" autoComplete="current-password" /></label>{message && <p role="alert" className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-300">{message}</p>}<button disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 py-3 text-sm font-semibold text-white hover:bg-blue-400 disabled:opacity-60">{loading && <Loader2 className="size-4 animate-spin" />}Entrar</button></form></main>
}
