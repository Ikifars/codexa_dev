'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, BarChart3, Blocks, Check, ChevronRight, Code2, Layers3, LineChart, ShieldCheck, Sparkles, Workflow } from 'lucide-react'

const services = [
  { icon: Code2, title: 'Produtos digitais', description: 'Web apps e plataformas sob medida, do discovery ao deploy, com foco em performance e escala.' },
  { icon: Workflow, title: 'Operação conectada', description: 'CRM, financeiro, projetos e suporte em fluxos que dão visibilidade para cada decisão.' },
  { icon: Blocks, title: 'Sistemas modulares', description: 'Arquitetura preparada para crescer por módulos, integrações e novas frentes de negócio.' },
]

const capabilities = ['CRM e pipeline comercial', 'Projetos, tarefas e suporte', 'Contratos, licenças e módulos', 'Financeiro e fluxo de caixa', 'Relatórios e auditoria', 'Papéis, equipes e permissões']

export function PublicLanding() {
  return (
    <main className="landing-page min-h-screen overflow-hidden bg-[#07090d] text-slate-100">
      <div className="landing-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="landing-orb landing-orb-one pointer-events-none absolute -right-40 top-0 size-[34rem] rounded-full blur-3xl" />
      <div className="landing-orb landing-orb-two pointer-events-none absolute left-[-18rem] top-[32rem] size-[30rem] rounded-full blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <header className="flex h-20 items-center justify-between border-b border-white/[0.08]">
          <Link href="/" aria-label="Codexa — início" className="flex items-center gap-3">
            <Image src="/codexa-logo.png" alt="Codexa" width={92} height={92} priority className="size-14 object-contain" />
            <span className="hidden border-l border-white/15 pl-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:block">Software house</span>
          </Link>
          <nav className="hidden items-center gap-7 text-xs text-slate-400 md:flex" aria-label="Navegação da página">
            <a href="#servicos" className="transition-colors hover:text-white">Serviços</a>
            <a href="#workspace" className="transition-colors hover:text-white">Workspace</a>
            <a href="#metodo" className="transition-colors hover:text-white">Nosso método</a>
          </nav>
          <Link href="/admin/login" className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white transition hover:border-cyan-300/50 hover:bg-white/[0.08]">
            Acessar workspace <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </header>

        <section className="grid min-h-[650px] items-center gap-14 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.13em] text-cyan-200">
              <Sparkles className="size-3.5" /> Engenharia para negócios ambiciosos
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-7xl lg:text-[5.8rem]">Software que transforma complexidade em <span className="landing-gradient-text">movimento.</span></h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">A Codexa cria produtos digitais e organiza a operação por trás deles. Estratégia, tecnologia e execução no mesmo time.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a href="#servicos" className="group inline-flex items-center gap-3 rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-[#071016] transition hover:bg-cyan-200">Conheça nosso trabalho <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
              <a href="#workspace" className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-slate-300 transition hover:text-white">Ver o workspace <ChevronRight className="size-4" /></a>
            </div>
            <div className="mt-14 flex flex-wrap gap-x-8 gap-y-3 text-[11px] uppercase tracking-[0.13em] text-slate-500"><span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-emerald-300" /> Produto e operação</span><span>Brasil · remoto</span><span>Desde 2020</span></div>
          </div>

          <div className="relative mx-auto w-full max-w-[31rem] lg:ml-auto">
            <div className="absolute -inset-8 rounded-[3rem] bg-cyan-300/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#0e131c]/90 p-3 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
              <div className="rounded-[1.2rem] border border-white/10 bg-[#111923] p-5">
                <div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.17em] text-slate-500">Codexa workspace</p><p className="mt-1 text-sm font-semibold text-white">Visão da operação</p></div><div className="flex gap-1.5"><span className="size-2 rounded-full bg-rose-300/70" /><span className="size-2 rounded-full bg-amber-300/70" /><span className="size-2 rounded-full bg-emerald-300/70" /></div></div>
                <div className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 bg-white/[0.035] p-4"><BarChart3 className="size-4 text-cyan-300" /><p className="mt-6 text-[10px] text-slate-500">Receita no mês</p><p className="mt-1 text-xl font-semibold text-white">R$ 84,2k</p><p className="mt-1 text-[10px] text-emerald-300">+18,4% vs. mês anterior</p></div><div className="rounded-xl border border-white/10 bg-white/[0.035] p-4"><LineChart className="size-4 text-violet-300" /><p className="mt-6 text-[10px] text-slate-500">Projetos ativos</p><p className="mt-1 text-xl font-semibold text-white">24</p><p className="mt-1 text-[10px] text-slate-400">8 em produção</p></div></div>
                <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.035] p-4"><div className="flex items-center justify-between"><p className="text-xs font-medium text-slate-300">Pipeline comercial</p><span className="text-[10px] text-cyan-300">Ver detalhes</span></div><div className="mt-5 flex h-24 items-end gap-2"><span className="h-[34%] flex-1 rounded-t bg-cyan-300/25" /><span className="h-[52%] flex-1 rounded-t bg-cyan-300/35" /><span className="h-[45%] flex-1 rounded-t bg-cyan-300/45" /><span className="h-[70%] flex-1 rounded-t bg-cyan-300/60" /><span className="h-[82%] flex-1 rounded-t bg-cyan-300/80" /><span className="h-full flex-1 rounded-t bg-cyan-300" /></div></div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 flex items-center gap-3 rounded-2xl border border-white/15 bg-[#101720] px-4 py-3 shadow-xl"><span className="grid size-8 place-items-center rounded-full bg-emerald-300/15 text-emerald-300"><ShieldCheck className="size-4" /></span><span><span className="block text-[10px] uppercase tracking-wider text-slate-500">Tudo conectado</span><span className="block text-xs font-medium text-white">Uma fonte de verdade</span></span></div>
          </div>
        </section>

        <section id="servicos" className="scroll-mt-20 border-t border-white/[0.08] py-24"><div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">O que fazemos</p><h2 className="mt-4 max-w-md text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Da primeira ideia à operação que sustenta o crescimento.</h2></div><div className="grid gap-3 sm:grid-cols-3">{services.map((service) => { const Icon = service.icon; return <article key={service.title} className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[0.05]"><Icon className="size-5 text-cyan-300" /><h3 className="mt-12 text-sm font-semibold text-white">{service.title}</h3><p className="mt-3 text-xs leading-5 text-slate-500">{service.description}</p></article> })}</div></div></section>

        <section id="workspace" className="scroll-mt-20 border-y border-white/[0.08] py-24"><div className="grid items-center gap-12 lg:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Um sistema, todos os sinais</p><h2 className="mt-4 max-w-lg text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Mais contexto para decidir. Menos abas para procurar.</h2><p className="mt-5 max-w-lg text-sm leading-6 text-slate-400">O workspace Codexa foi desenhado para software houses que precisam transformar dados espalhados em uma operação previsível.</p><Link href="/admin/login" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200">Entrar no workspace <ArrowUpRight className="size-4" /></Link></div><div className="grid gap-3 sm:grid-cols-2">{capabilities.map((capability) => <div key={capability} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-4 text-sm text-slate-300"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-300/10 text-emerald-300"><Check className="size-3.5" /></span>{capability}</div>)}</div></div></section>

        <section id="metodo" className="scroll-mt-20 py-24"><div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Como trabalhamos</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Pensar. Construir. Evoluir.</h2></div><p className="max-w-sm text-sm leading-6 text-slate-500">Times enxutos, decisões claras e tecnologia que acompanha o ritmo real do negócio.</p></div><div className="mt-12 grid gap-5 border-t border-white/10 pt-6 sm:grid-cols-3">{['01 / Descoberta', '02 / Construção', '03 / Evolução'].map((step, index) => <div key={step}><span className="text-xs font-medium text-cyan-300">{step}</span><p className="mt-5 text-lg font-medium text-white">{['Encontramos o que importa.', 'Entregamos valor em ciclos.', 'Medimos e melhoramos sempre.'][index]}</p><p className="mt-3 text-sm leading-6 text-slate-500">{['Estratégia e produto alinhados ao objetivo certo.', 'Código limpo, feedback rápido e operação visível.', 'A próxima versão começa com o que aprendemos.'][index]}</p></div>)}</div></section>

        <footer className="flex flex-col gap-5 border-t border-white/[0.08] py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Image src="/codexa-logo.png" alt="Codexa" width={52} height={52} className="size-8 object-contain" /><span>Codexa · Software house</span></div><span>© 2026 Codexa. Tecnologia com direção.</span></footer>
      </div>
    </main>
  )
}
