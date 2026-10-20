'use client'

import { useState } from 'react'
import { CrmWorkspace } from '@/components/crm-workspace'
import { CommercialWorkspace } from '@/components/commercial-workspace'
import { OperationsWorkspace } from '@/components/operations-workspace'
import { CatalogWorkspace } from '@/components/catalog-workspace'
import { FinanceWorkspace } from '@/components/finance-workspace'
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileText,
  FolderKanban,
  Gauge,
  Headphones,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  PanelsTopLeft,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Users,
  WalletCards,
  X,
} from 'lucide-react'

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Leads', icon: Inbox },
  { label: 'Mensagens', icon: Bell },
  { label: 'Clientes', icon: Building2 },
  { label: 'Propostas', icon: FileText },
  { label: 'Projetos', icon: FolderKanban },
  { label: 'Solicitações de alteração', icon: ClipboardList },
  { label: 'Suporte', icon: Headphones },
  { label: 'Contratos', icon: BriefcaseBusiness },
  { label: 'Sistemas', icon: Gauge },
  { label: 'Módulos', icon: PanelsTopLeft },
  { label: 'Planos', icon: WalletCards },
  { label: 'Licenças', icon: ShieldCheck },
  { label: 'Financeiro', icon: CircleDollarSign },
  { label: 'Equipe', icon: Users },
  { label: 'Relatórios', icon: Activity },
  { label: 'Configurações', icon: Settings },
]


const metrics = [
  { label: 'Leads ativos', value: '0', hint: 'Nenhum lead cadastrado', icon: Inbox, tone: 'blue' },
  { label: 'Clientes ativos', value: '0', hint: 'Nenhum cliente cadastrado', icon: Building2, tone: 'violet' },
  { label: 'Projetos em andamento', value: '0', hint: 'Nenhum projeto cadastrado', icon: FolderKanban, tone: 'cyan' },
  { label: 'Chamados abertos', value: '0', hint: 'Nenhum chamado aberto', icon: Headphones, tone: 'amber' },
  { label: 'Contratos ativos', value: '0', hint: 'Nenhum contrato cadastrado', icon: BriefcaseBusiness, tone: 'emerald' },
  { label: 'Valores a receber', value: 'R$ 0,00', hint: 'Nenhum lançamento pendente', icon: CircleDollarSign, tone: 'teal' },
  { label: 'Valores vencidos', value: 'R$ 0,00', hint: 'Nenhum lançamento vencido', icon: WalletCards, tone: 'rose' },
  { label: 'Receita no mês', value: 'R$ 0,00', hint: 'Nenhum recebimento registrado', icon: CircleDollarSign, tone: 'indigo' },
]

const toneClasses: Record<string, string> = {
  blue: 'bg-blue-500/10 text-blue-400',
  violet: 'bg-violet-500/10 text-violet-400',
  cyan: 'bg-cyan-500/10 text-cyan-400',
  amber: 'bg-amber-500/10 text-amber-400',
  emerald: 'bg-emerald-500/10 text-emerald-400',
  teal: 'bg-teal-500/10 text-teal-400',
  rose: 'bg-rose-500/10 text-rose-400',
  indigo: 'bg-indigo-500/10 text-indigo-400',
}

export function DashboardShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('Dashboard')

  function openSection(label: string) {
    setActiveSection(label)
    setMobileOpen(false)
    const targetId = label === 'Dashboard' ? 'dashboard-overview' : label === 'Propostas' || label === 'Contratos' ? 'commercial-workspace' : ['Leads', 'Mensagens', 'Clientes'].includes(label) ? 'crm-workspace' : ['Projetos', 'Solicitações de alteração', 'Suporte'].includes(label) ? 'operations-workspace' : ['Sistemas', 'Módulos', 'Planos', 'Licenças'].includes(label) ? 'catalog-workspace' : label === 'Financeiro' ? 'finance-workspace' : null
    if (targetId) window.requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <div className="min-h-screen bg-[#0b0e13] text-slate-100">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col border-r border-white/[0.07] bg-[#10141b] transition-transform duration-200 lg:translate-x-0 ${collapsed ? 'lg:w-[78px]' : ''} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[72px] items-center border-b border-white/[0.07] px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20"><LayoutDashboard className="size-[18px]" /></div>
            {!collapsed && <div className="min-w-0"><p className="truncate text-sm font-semibold tracking-tight">Nexus<span className="text-blue-400">OS</span></p><p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Admin workspace</p></div>}
          </div>
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto hidden rounded-md p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-200 lg:block" aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}>{collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}</button>
          <button onClick={() => setMobileOpen(false)} className="ml-auto rounded-md p-1.5 text-slate-500 lg:hidden" aria-label="Fechar menu"><X className="size-4" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5"><p className={`mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 ${collapsed ? 'text-center' : ''}`}>{collapsed ? '•••' : 'Workspace'}</p><div className="flex flex-col gap-1">{navigation.map((item) => { const Icon = item.icon; return <button key={item.label} onClick={() => openSection(item.label)} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors ${activeSection === item.label ? 'bg-blue-500/12 font-medium text-blue-300' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'} ${collapsed ? 'justify-center px-0' : ''}`} title={collapsed ? item.label : undefined} aria-current={activeSection === item.label ? 'page' : undefined}><Icon className={`size-[17px] shrink-0 ${item.active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />{!collapsed && <><span className="truncate">{item.label}</span>{item.label !== 'Dashboard' && <span className="ml-auto rounded bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-slate-600">Em breve</span>}</>}</button> })}</div></nav>
        {!collapsed && <div className="border-t border-white/[0.07] p-3"><div className="flex items-center gap-3 rounded-lg p-2"><div className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-700 text-xs font-semibold text-slate-200">AD</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-200">Administrador</p><p className="truncate text-[11px] text-slate-500">Configuração pendente</p></div><ChevronDown className="size-3.5 text-slate-600" /></div></div>}
      </aside>
      {mobileOpen && <button className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" />}
      <div className={`transition-[margin] duration-200 ${collapsed ? 'lg:ml-[78px]' : 'lg:ml-[258px]'}`}>
        <header className="sticky top-0 z-20 flex h-[72px] items-center gap-4 border-b border-white/[0.07] bg-[#0b0e13]/90 px-4 backdrop-blur-xl sm:px-7"><button className="rounded-md p-2 text-slate-400 hover:bg-white/5 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu className="size-5" /></button><div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex"><span>Workspace</span><ChevronRight className="size-3" /><span className="text-slate-300">{activeSection}</span></div><div className="ml-auto flex items-center gap-2"><button className="hidden items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs text-slate-500 transition-colors hover:border-white/15 hover:text-slate-300 md:flex"><Search className="size-3.5" />Buscar<span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-600">⌘ K</span></button><button className="relative rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Notificações"><Bell className="size-[18px]" /><span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-blue-400" /></button><div className="mx-1 h-5 w-px bg-white/10" /><button className="flex items-center gap-2 rounded-lg p-1.5 pr-2 hover:bg-white/5"><div className="grid size-7 place-items-center rounded-full bg-blue-500/20 text-[10px] font-bold text-blue-300">AD</div><ChevronDown className="size-3.5 text-slate-500" /></button></div></header>
        <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9">{activeSection === 'Dashboard' && <div id="dashboard-overview" className="scroll-mt-24"><div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-blue-400">Visão geral</p><h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">Bom dia, administrador</h1><p className="mt-1.5 text-sm text-slate-500">Acompanhe a operação da sua software house em um só lugar.</p></div><button className="flex w-fit items-center gap-2 rounded-lg bg-blue-500 px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/15 transition-colors hover:bg-blue-400"><Plus className="size-4" />Adicionar registro</button></div>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => { const Icon = metric.icon; return <article key={metric.label} className="rounded-xl border border-white/[0.07] bg-[#11161e] p-4 transition-colors hover:border-white/[0.12]"><div className="flex items-start justify-between"><div className={`grid size-9 place-items-center rounded-lg ${toneClasses[metric.tone]}`}><Icon className="size-[17px]" /></div><button aria-label={`Mais opções de ${metric.label}`} className="text-slate-600 hover:text-slate-300"><MoreHorizontal className="size-4" /></button></div><p className="mt-4 text-xs text-slate-500">{metric.label}</p><p className="mt-1 text-xl font-semibold tracking-tight text-slate-100">{metric.value}</p><p className="mt-1 text-[11px] text-slate-600">{metric.hint}</p></article> })}</section>
          <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]"><div className="rounded-xl border border-white/[0.07] bg-[#11161e]"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div><h2 className="text-sm font-semibold text-slate-200">Atividade recente</h2><p className="mt-0.5 text-xs text-slate-500">Acompanhe as últimas ações do workspace</p></div><button className="text-xs font-medium text-blue-400 hover:text-blue-300">Ver histórico</button></div><div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center"><div className="mb-3 grid size-11 place-items-center rounded-full border border-white/[0.08] bg-white/[0.03]"><Activity className="size-5 text-slate-600" /></div><p className="text-sm font-medium text-slate-400">Nenhuma atividade registrada</p><p className="mt-1 max-w-xs text-xs leading-5 text-slate-600">As ações da sua equipe aparecerão aqui quando os primeiros registros forem criados.</p></div></div><div className="rounded-xl border border-white/[0.07] bg-[#11161e]"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div><h2 className="text-sm font-semibold text-slate-200">Próximos vencimentos</h2><p className="mt-0.5 text-xs text-slate-500">Compromissos financeiros e contratuais</p></div><button className="text-slate-600 hover:text-slate-300" aria-label="Mais opções"><MoreHorizontal className="size-4" /></button></div><div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center"><div className="mb-3 grid size-11 place-items-center rounded-full border border-white/[0.08] bg-white/[0.03]"><WalletCards className="size-5 text-slate-600" /></div><p className="text-sm font-medium text-slate-400">Tudo em dia</p><p className="mt-1 max-w-xs text-xs leading-5 text-slate-600">Nenhum vencimento encontrado para os próximos dias.</p></div></div></section>
          <section className="mt-6 rounded-xl border border-white/[0.07] bg-[#11161e]"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div><h2 className="text-sm font-semibold text-slate-200">Projetos por status</h2><p className="mt-0.5 text-xs text-slate-500">Distribuição dos projetos ativos</p></div><button className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300">Este mês <ChevronDown className="size-3.5" /></button></div><div className="flex min-h-[150px] items-center justify-center px-6 text-center"><p className="text-xs text-slate-600">Cadastre projetos para visualizar a distribuição por status.</p></div></section>
          </div>}
          {['Leads', 'Mensagens', 'Clientes'].includes(activeSection) && <div id="crm-workspace" className="scroll-mt-24"><CrmWorkspace /></div>}
          {['Propostas', 'Contratos'].includes(activeSection) && <div id="commercial-workspace" className="scroll-mt-24"><CommercialWorkspace /></div>}
          {['Projetos', 'Solicitações de alteração', 'Suporte'].includes(activeSection) && <div id="operations-workspace" className="scroll-mt-24"><OperationsWorkspace /></div>}
          {['Sistemas', 'Módulos', 'Planos', 'Licenças'].includes(activeSection) && <div id="catalog-workspace" className="scroll-mt-24"><CatalogWorkspace /></div>}
          {activeSection === 'Financeiro' && <div id="finance-workspace" className="scroll-mt-24"><FinanceWorkspace /></div>}
          {!['Dashboard', 'Leads', 'Mensagens', 'Clientes', 'Propostas', 'Contratos', 'Projetos', 'Solicitações de alteração', 'Suporte', 'Sistemas', 'Módulos', 'Planos', 'Licenças', 'Financeiro'].includes(activeSection) && <section className="rounded-xl border border-white/[0.07] bg-[#11161e] p-8"><p className="text-xs font-medium uppercase tracking-[0.16em] text-blue-400">Módulo</p><h1 className="mt-2 text-2xl font-semibold text-white">{activeSection}</h1><p className="mt-2 text-sm text-slate-500">Esta página está preparada para receber os registros deste módulo.</p></section>}
          <div className="mt-7 flex items-center gap-2 text-[11px] text-slate-600"><div className="size-1.5 rounded-full bg-amber-400" />Supabase conectado · CRM pronto para seus primeiros registros.</div>
        </main>
      </div>
    </div>
  )
}
