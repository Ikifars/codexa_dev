'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, BarChart3, Blocks, ChevronRight, Code2, LineChart, ShieldCheck, Sparkles, Workflow } from 'lucide-react'

const services = [
  { icon: Code2, title: 'Sites que convertem', description: 'Landing pages e sites institucionais rápidos, estratégicos e desenhados para transformar atenção em oportunidade.' },
  { icon: Workflow, title: 'Sistemas sob medida', description: 'Plataformas web e ferramentas internas que eliminam retrabalho e acompanham a operação real do seu negócio.' },
  { icon: Blocks, title: 'Automação e integrações', description: 'Conectamos suas ferramentas e automatizamos processos para sua equipe ganhar tempo e previsibilidade.' },
]

const portfolio = [
  { label: 'Produto digital', title: 'Plataforma de gestão para times em crescimento', description: 'Um ecossistema web modular para centralizar operação, indicadores e decisões.', accent: 'from-cyan-300/30 to-blue-500/5' },
  { label: 'Presença digital', title: 'Marca posicionada para vender mais', description: 'Site institucional com narrativa, performance e jornadas pensadas para conversão.', accent: 'from-violet-300/30 to-fuchsia-500/5' },
  { label: 'Automação', title: 'Processos conectados sem planilhas', description: 'Integrações que transformam tarefas manuais em fluxos simples e rastreáveis.', accent: 'from-emerald-300/25 to-cyan-500/5' },
]

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
            <a href="#portfolio" className="transition-colors hover:text-white">Portfólio</a>
            <a href="#metodo" className="transition-colors hover:text-white">Nosso método</a>
          </nav>
          <a href="#contato" className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white transition hover:border-cyan-300/50 hover:bg-white/[0.08]">
            Vamos conversar <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </header>

        <section className="grid min-h-[650px] items-center gap-14 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.13em] text-cyan-200">
              <Sparkles className="size-3.5" /> Engenharia para negócios ambiciosos
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-7xl lg:text-[5.8rem]">Ideias fortes merecem uma presença <span className="landing-gradient-text">à altura.</span></h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">A Codexa cria sites, sistemas e automações que ajudam negócios ambiciosos a vender melhor, operar com clareza e crescer com tecnologia.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a href="#contato" className="group inline-flex items-center gap-3 rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-[#071016] transition hover:bg-cyan-200">Comece um projeto <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
              <a href="#portfolio" className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-slate-300 transition hover:text-white">Ver portfólio <ChevronRight className="size-4" /></a>
            </div>
            <div className="mt-14 flex flex-wrap gap-x-8 gap-y-3 text-[11px] uppercase tracking-[0.13em] text-slate-500"><span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-emerald-300" /> Produto e operação</span><span>Brasil · remoto</span><span>Desde 2020</span></div>
          </div>

          <div className="relative mx-auto w-full max-w-[31rem] lg:ml-auto">
            <div className="absolute -inset-8 rounded-[3rem] bg-cyan-300/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#0e131c]/90 p-3 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
              <div className="rounded-[1.2rem] border border-white/10 bg-[#111923] p-5">
                <div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.17em] text-slate-500">Projeto em destaque</p><p className="mt-1 text-sm font-semibold text-white">Experiência digital sob medida</p></div><div className="flex gap-1.5"><span className="size-2 rounded-full bg-rose-300/70" /><span className="size-2 rounded-full bg-amber-300/70" /><span className="size-2 rounded-full bg-emerald-300/70" /></div></div>
                <div className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 bg-white/[0.035] p-4"><BarChart3 className="size-4 text-cyan-300" /><p className="mt-6 text-[10px] text-slate-500">Receita no mês</p><p className="mt-1 text-xl font-semibold text-white">R$ 84,2k</p><p className="mt-1 text-[10px] text-emerald-300">+18,4% vs. mês anterior</p></div><div className="rounded-xl border border-white/10 bg-white/[0.035] p-4"><LineChart className="size-4 text-violet-300" /><p className="mt-6 text-[10px] text-slate-500">Projetos ativos</p><p className="mt-1 text-xl font-semibold text-white">24</p><p className="mt-1 text-[10px] text-slate-400">8 em produção</p></div></div>
                <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.035] p-4"><div className="flex items-center justify-between"><p className="text-xs font-medium text-slate-300">Pipeline comercial</p><span className="text-[10px] text-cyan-300">Ver detalhes</span></div><div className="mt-5 flex h-24 items-end gap-2"><span className="h-[34%] flex-1 rounded-t bg-cyan-300/25" /><span className="h-[52%] flex-1 rounded-t bg-cyan-300/35" /><span className="h-[45%] flex-1 rounded-t bg-cyan-300/45" /><span className="h-[70%] flex-1 rounded-t bg-cyan-300/60" /><span className="h-[82%] flex-1 rounded-t bg-cyan-300/80" /><span className="h-full flex-1 rounded-t bg-cyan-300" /></div></div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 flex items-center gap-3 rounded-2xl border border-white/15 bg-[#101720] px-4 py-3 shadow-xl"><span className="grid size-8 place-items-center rounded-full bg-emerald-300/15 text-emerald-300"><ShieldCheck className="size-4" /></span><span><span className="block text-[10px] uppercase tracking-wider text-slate-500">Tudo conectado</span><span className="block text-xs font-medium text-white">Uma fonte de verdade</span></span></div>
          </div>
        </section>

        <section id="servicos" className="scroll-mt-20 border-t border-white/[0.08] py-24"><div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">O que fazemos</p><h2 className="mt-4 max-w-md text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Da primeira ideia à operação que sustenta o crescimento.</h2></div><div className="grid gap-3 sm:grid-cols-3">{services.map((service) => { const Icon = service.icon; return <article key={service.title} className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[0.05]"><Icon className="size-5 text-cyan-300" /><h3 className="mt-12 text-sm font-semibold text-white">{service.title}</h3><p className="mt-3 text-xs leading-5 text-slate-500">{service.description}</p></article> })}</div></div></section>

        <section id="portfolio" className="scroll-mt-20 border-y border-white/[0.08] py-24"><div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Portfólio em movimento</p><h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Projetos que tiram negócios do lugar.</h2></div><p className="max-w-sm text-sm leading-6 text-slate-500">Cada entrega combina estratégia, design e engenharia para resolver um problema de verdade.</p></div><div className="mt-12 grid gap-4 lg:grid-cols-3">{portfolio.map((project, index) => <article key={project.title} className={`group relative min-h-72 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${project.accent} p-6 transition hover:-translate-y-1 hover:border-cyan-300/40`}><div className="absolute inset-x-6 top-6 h-28 rounded-xl border border-white/10 bg-[#0b1119]/70 p-3 opacity-80 transition group-hover:scale-[1.02]"><div className="flex gap-1.5"><span className="size-1.5 rounded-full bg-cyan-300" /><span className="size-1.5 rounded-full bg-white/20" /><span className="size-1.5 rounded-full bg-white/20" /></div><div className="mt-5 grid grid-cols-4 gap-2"><span className="h-2 rounded bg-white/15" /><span className="col-span-2 h-2 rounded bg-cyan-300/45" /><span className="h-2 rounded bg-white/10" /></div><div className="mt-2 grid grid-cols-3 gap-2"><span className="col-span-2 h-8 rounded bg-white/10" /><span className="h-8 rounded bg-violet-300/30" /></div></div><div className="relative mt-36"><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200">0{index + 1} · {project.label}</span><h3 className="mt-3 text-lg font-semibold leading-tight text-white">{project.title}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{project.description}</p></div></article>)}</div></section>

        <section id="contato" className="scroll-mt-20 py-24"><div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-300/10 via-white/[0.03] to-violet-300/10 px-6 py-12 text-center sm:px-12"><div className="absolute -right-16 -top-20 size-56 rounded-full bg-cyan-300/10 blur-3xl" /><p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Seu próximo projeto começa aqui</p><h2 className="relative mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Vamos transformar sua ideia em algo que as pessoas querem usar.</h2><p className="relative mx-auto mt-5 max-w-xl text-sm leading-6 text-slate-400">Conte o que você está construindo e a Codexa responde com clareza sobre o melhor próximo passo.</p><a href="mailto:ola@codexa.dev" className="relative mt-8 inline-flex items-center gap-3 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-[#071016] transition hover:bg-cyan-200">Falar com a Codexa <ArrowUpRight className="size-4" /></a></div></section>

        <section id="metodo" className="scroll-mt-20 py-24"><div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Como trabalhamos</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Pensar. Construir. Evoluir.</h2></div><p className="max-w-sm text-sm leading-6 text-slate-500">Times enxutos, decisões claras e tecnologia que acompanha o ritmo real do negócio.</p></div><div className="mt-12 grid gap-5 border-t border-white/10 pt-6 sm:grid-cols-3">{['01 / Descoberta', '02 / Construção', '03 / Evolução'].map((step, index) => <div key={step}><span className="text-xs font-medium text-cyan-300">{step}</span><p className="mt-5 text-lg font-medium text-white">{['Encontramos o que importa.', 'Entregamos valor em ciclos.', 'Medimos e melhoramos sempre.'][index]}</p><p className="mt-3 text-sm leading-6 text-slate-500">{['Estratégia e produto alinhados ao objetivo certo.', 'Código limpo, feedback rápido e operação visível.', 'A próxima versão começa com o que aprendemos.'][index]}</p></div>)}</div></section>

        <footer className="flex flex-col gap-5 border-t border-white/[0.08] py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Image src="/codexa-logo.png" alt="Codexa" width={52} height={52} className="size-8 object-contain" /><span>Codexa · Software house</span></div><span>© 2026 Codexa. Tecnologia com direção.</span></footer>
      </div>
    </main>
  )
}
