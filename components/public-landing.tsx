'use client'

import Image from 'next/image'
import { ArrowRight, Sparkles } from 'lucide-react'

export function PublicLanding() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080b10] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-7 lg:px-10">
        <header className="flex min-h-24 items-center justify-between border-b border-white/[0.06]">
          <Image src="/codexa-logo.png" alt="Codexa" width={150} height={150} priority className="size-24 shrink-0 object-contain" />
          <span className="text-right text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Software operations</span>
        </header>
        <section className="flex flex-1 items-center py-20"><div className="max-w-3xl"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/5 px-3 py-1.5 text-xs text-violet-300"><Sparkles className="size-3.5" /> Gestão inteligente para software houses</div><h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">Transforme operação complexa em clareza.</h1><p className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">A Codexa reúne clientes, projetos, contratos, finanças e decisões em um único workspace operacional.</p><div className="mt-9 flex items-center gap-4"><span className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20">Conheça a Codexa <ArrowRight className="size-4" /></span><span className="text-xs text-slate-600">Built for focused teams</span></div></div></section>
        <footer className="border-t border-white/[0.07] pt-5 text-xs text-slate-600"><span>© 2026 Codexa</span></footer>
      </div>
    </main>
  )
}
