'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import type { AuthError, User } from '@supabase/supabase-js'
import { Check, CircleHelp, Contrast, Eye, Gauge, Laptop, Moon, Palette, RotateCcw, Save, Sun, Type, Waves } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { applyWorkspaceAppearance, defaultAppearance, type AccentColor, type ContrastMode, type FontFamily, type MotionMode, type RadiusScale, type WorkspaceAppearance, type WorkspaceTheme } from '@/lib/workspace-theme'

type AppearanceKey = keyof WorkspaceAppearance

const accentOptions: Array<{ value: AccentColor; label: string; description: string; color: string }> = [
  { value: 'blue', label: 'Azul', description: 'Clássico e profissional', color: '#6485ff' },
  { value: 'violet', label: 'Violeta', description: 'Criativo e expressivo', color: '#9b7cff' },
  { value: 'emerald', label: 'Esmeralda', description: 'Natural e equilibrado', color: '#42c995' },
  { value: 'amber', label: 'Âmbar', description: 'Quente e energético', color: '#e5b45c' },
  { value: 'rose', label: 'Rosa', description: 'Vibrante e acolhedor', color: '#ee7d9a' },
]

const colorFields = [
  { key: 'primary_color', label: 'Primária', description: 'Botões, seleção, links e navegação.' },
  { key: 'secondary_color', label: 'Secundária', description: 'Apoio, ícones e elementos complementares.' },
  { key: 'tertiary_color', label: 'Terciária', description: 'Detalhes, indicadores e contrastes.' },
] as const

const palettes = [
  { id: 'codexa-original', label: 'Codexa Original', colors: ['#6485ff', '#9b7cff', '#42c995'] },
  { id: 'midnight-blue', label: 'Midnight Blue', colors: ['#4f8cff', '#3159d8', '#60a5fa'] },
  { id: 'cyber-violet', label: 'Cyber Violet', colors: ['#a78bfa', '#7c3aed', '#f0abfc'] },
  { id: 'emerald', label: 'Emerald', colors: ['#34d399', '#059669', '#a7f3d0'] },
  { id: 'ocean', label: 'Ocean', colors: ['#22d3ee', '#2563eb', '#38bdf8'] },
  { id: 'crimson', label: 'Crimson', colors: ['#fb7185', '#be123c', '#fda4af'] },
  { id: 'graphite', label: 'Graphite', colors: ['#94a3b8', '#475569', '#cbd5e1'] },
  { id: 'aurora', label: 'Aurora', colors: ['#2dd4bf', '#8b5cf6', '#f472b6'] },
  { id: 'sunset', label: 'Sunset', colors: ['#fb923c', '#ef4444', '#facc15'] },
  { id: 'ice', label: 'Ice', colors: ['#7dd3fc', '#bfdbfe', '#e0f2fe'] },
] as const

const appearanceOptions: Array<{ value: WorkspaceTheme; label: string; description: string; icon: typeof Moon }> = [
  { value: 'dark', label: 'Escuro', description: 'Reduz o brilho e favorece ambientes com pouca luz.', icon: Moon },
  { value: 'light', label: 'Claro', description: 'Mais contraste para ambientes bem iluminados.', icon: Sun },
  { value: 'system', label: 'Automático', description: 'Acompanha a preferência do sistema operacional.', icon: Laptop },
]

function isHex(value: string) { return /^#[0-9A-Fa-f]{6}$/.test(value) }

function OptionCard<T extends string>({ value, current, label, description, onSelect, children }: { value: T; current: T; label: string; description?: string; onSelect: (value: T) => void; children?: React.ReactNode }) {
  const selected = value === current
  return <button type="button" aria-pressed={selected} onClick={() => onSelect(value)} className={`group rounded-xl border p-4 text-left transition-all ${selected ? 'border-[var(--primary)] bg-[var(--primary)]/[0.12] shadow-[0_0_0_1px_var(--primary)]' : 'border-white/[0.08] bg-white/[0.025] hover:border-white/[0.2] hover:bg-white/[0.05]'}`}>
    <span className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-white">{label}</span>{selected && <Check className="size-4 text-[var(--primary)]" />}</span>
    {description && <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>}
    {children}
  </button>
}

export function AccountWorkspace({ section, initialName = '' }: { section: string; initialName?: string }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState(initialName)
  const [appearance, setAppearance] = useState<WorkspaceAppearance>(defaultAppearance)
  const [savedAppearance, setSavedAppearance] = useState<WorkspaceAppearance>(defaultAppearance)
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingAppearance, setLoadingAppearance] = useState(true)

  useEffect(() => {
    setName(initialName)
    const supabase = createClient()
    void Promise.all([
      supabase.auth.getUser(),
      supabase.from('user_preferences').select('theme,primary_color,secondary_color,tertiary_color,appearance_palette,accent_color,font_family,radius_scale,contrast_mode,motion_mode,navigation_collapsed,table_density').maybeSingle(),
    ]).then(([authResult, preferencesResult]) => {
      const { data, error }: { data: { user: User | null }; error: AuthError | null } = authResult
      if (error) {
        setMessageError(true)
        setMessage('Não foi possível carregar os dados da conta.')
      }
      setEmail(data.user?.email ?? '')
      const loaded = preferencesResult.data as Partial<WorkspaceAppearance> | null
      const nextAppearance = { ...defaultAppearance, ...(loaded ?? {}) } as WorkspaceAppearance
      setAppearance(nextAppearance)
      setSavedAppearance(nextAppearance)
      applyWorkspaceAppearance(nextAppearance)
      setLoadingAppearance(false)
    })
  }, [initialName])

  const isAppearance = section === 'Aparência'
  const hasAppearanceChanges = useMemo(() => JSON.stringify(appearance) !== JSON.stringify(savedAppearance), [appearance, savedAppearance])

  function updateAppearance<K extends AppearanceKey>(key: K, value: WorkspaceAppearance[K]) {
    const next = { ...appearance, [key]: value }
    setAppearance(next)
    applyWorkspaceAppearance(next)
    setMessage('')
  }

  function updateColor(key: 'primary_color' | 'secondary_color' | 'tertiary_color', value: string) {
    if (!isHex(value)) return
    updateAppearance(key, value)
  }

  function selectPalette(palette: typeof palettes[number]) {
    setAppearance((current) => {
      const next = { ...current, appearance_palette: palette.id, primary_color: palette.colors[0], secondary_color: palette.colors[1], tertiary_color: palette.colors[2] }
      applyWorkspaceAppearance(next)
      return next
    })
    setMessage('')
  }

  async function saveAppearance() {
    setSaving(true)
    setMessage('')
    setMessageError(false)
    const { error } = await createClient().from('user_preferences').upsert({
      user_id: (await createClient().auth.getUser()).data.user?.id,
      theme: appearance.theme,
      primary_color: appearance.primary_color,
      secondary_color: appearance.secondary_color,
      tertiary_color: appearance.tertiary_color,
      appearance_palette: appearance.appearance_palette,
      accent_color: appearance.accent_color,
      font_family: appearance.font_family,
      radius_scale: appearance.radius_scale,
      contrast_mode: appearance.contrast_mode,
      motion_mode: appearance.motion_mode,
    }, { onConflict: 'user_id' })
    if (error) {
      setMessageError(true)
      setMessage('Não foi possível salvar suas preferências.')
    } else {
      setSavedAppearance(appearance)
      setMessage('Preferências de aparência salvas.')
    }
    setSaving(false)
  }

  function resetAppearance() {
    setAppearance(defaultAppearance)
    applyWorkspaceAppearance(defaultAppearance)
    setMessage('Alterações restauradas para o padrão.')
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setMessageError(false)
    try {
      const response = await fetch('/api/workspace/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: name }) })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Não foi possível salvar seu perfil.')
      setMessage('Perfil atualizado com sucesso.')
      window.location.reload()
    } catch (error) {
      setMessageError(true)
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar seu perfil.')
    } finally {
      setSaving(false)
    }
  }

  if (!isAppearance) return <section className="mt-6 max-w-3xl rounded-xl border border-white/[0.07] bg-card p-6"><p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--primary)]">Configurações pessoais</p><h1 className="mt-2 text-2xl font-semibold text-white">Meu perfil</h1><p className="mt-2 text-sm text-muted-foreground">Consulte e atualize seus dados pessoais sem alterar suas permissões.</p><form onSubmit={saveProfile} className="mt-6 space-y-4"><div><label htmlFor="profile-name" className="text-xs text-slate-400">Nome de exibição</label><input id="profile-name" required minLength={2} maxLength={200} value={name} onChange={(event) => setName(event.target.value)} className="field mt-1" /></div><div><span className="text-xs text-slate-400">E-mail da conta</span><p className="mt-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-sm text-slate-300">{email || 'Carregando...'}</p></div><button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-60"><Save className="size-4" />{saving ? 'Salvando...' : 'Salvar alterações'}</button></form>{message && <p role={messageError ? 'alert' : 'status'} className={`mt-4 text-xs ${messageError ? 'text-rose-300' : 'text-emerald-300'}`}>{message}</p>}</section>

  return <main className="mt-6 w-full max-w-5xl pb-10"><header><p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--primary)]">Configurações pessoais</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-tight text-white">Aparência</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Personalize o workspace para trabalhar do seu jeito. As preferências ficam salvas apenas na sua conta.</p></div><div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400"><Eye className="size-3.5" />Prévia em tempo real</div></div></header>
    <div className="mt-8 space-y-5">
      <section className="rounded-2xl border border-white/[0.08] bg-card p-5 shadow-xl shadow-black/10"><div className="flex items-start gap-3"><div className="rounded-lg bg-[var(--primary)]/10 p-2.5 text-[var(--primary)]"><Palette className="size-5" /></div><div><h2 className="font-semibold text-white">Tema</h2><p className="mt-1 text-sm text-muted-foreground">Escolha a base visual do seu workspace.</p></div></div><div className="mt-5 grid gap-3 md:grid-cols-3">{appearanceOptions.map(({ value, label, description, icon: Icon }) => <OptionCard key={value} value={value} current={appearance.theme} label={label} description={description} onSelect={(next) => updateAppearance('theme', next)}><Icon className="mt-4 size-5 text-slate-400" /></OptionCard>)}</div></section>
      <section className="rounded-2xl border border-white/[0.08] bg-card p-5 shadow-xl shadow-black/10"><div className="flex items-start gap-3"><div className="rounded-lg bg-[var(--primary)]/10 p-2.5 text-[var(--primary)]"><Palette className="size-5" /></div><div><h2 className="font-semibold text-white">Cor de destaque</h2><p className="mt-1 text-sm text-muted-foreground">Aplicada a botões, links, foco e indicadores.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{accentOptions.map((option) => <OptionCard key={option.value} value={option.value} current={appearance.accent_color} label={option.label} description={option.description} onSelect={(next) => updateAppearance('accent_color', next)}><span className="mt-4 flex items-center gap-2 text-xs text-slate-500"><span className="size-3 rounded-full" style={{ backgroundColor: option.color }} />Amostra</span></OptionCard>)}</div></section>
      <section className="rounded-2xl border border-white/[0.08] bg-card p-5 shadow-xl shadow-black/10"><div className="flex items-start gap-3"><div className="rounded-lg bg-[var(--primary)]/10 p-2.5 text-[var(--primary)]"><Palette className="size-5" /></div><div><h2 className="font-semibold text-white">Cores personalizadas</h2><p className="mt-1 text-sm text-muted-foreground">Escolha cada cor em RGB ou informe o valor HEX.</p></div></div><div className="mt-5 grid gap-4 lg:grid-cols-3">{colorFields.map(({ key, label, description }) => { const value = appearance[key]; return <div key={key} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"><div className="flex items-center justify-between gap-2"><div><h3 className="text-sm font-semibold text-white">{label}</h3><p className="mt-1 text-xs text-slate-500">{description}</p></div><span className="size-9 rounded-lg border border-white/10" style={{ backgroundColor: value }} /></div><div className="mt-4 space-y-3"><input aria-label={`Cor ${label} em RGB`} type="color" value={value} onChange={(event) => updateColor(key, event.target.value)} className="h-10 w-full cursor-pointer rounded-lg border-0 bg-transparent" /><div className="grid grid-cols-3 gap-2">{(['R', 'G', 'B'] as const).map((channel, index) => { const rgb = Number.parseInt(value.slice(1 + index * 2, 3 + index * 2), 16); return <label key={channel} className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{channel}<input type="range" min="0" max="255" value={rgb} onChange={(event) => { const channels = [0, 0, 0].map((_, channelIndex) => channelIndex === index ? Number(event.target.value) : Number.parseInt(value.slice(1 + channelIndex * 2, 3 + channelIndex * 2), 16)); updateColor(key, `#${channels.map((part) => part.toString(16).padStart(2, '0')).join('')}`) }} className="mt-2 w-full accent-[var(--primary)]" /></label>})}</div><label className="block text-[10px] font-medium uppercase tracking-wider text-slate-500">HEX<input value={value} maxLength={7} onChange={(event) => { const next = event.target.value.startsWith('#') ? event.target.value : `#${event.target.value}`; if (isHex(next)) updateColor(key, next.toLowerCase()) }} className="field mt-1 font-mono text-xs uppercase" /></label></div></div>})}</div></section>
      <section className="rounded-2xl border border-white/[0.08] bg-card p-5 shadow-xl shadow-black/10"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-white">Paletas predefinidas</h2><p className="mt-1 text-sm text-muted-foreground">Escolha uma base e personalize as três cores antes de salvar.</p></div></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{palettes.map((palette) => <button type="button" key={palette.id} onClick={() => selectPalette(palette)} className={`rounded-xl border p-3 text-left transition ${appearance.appearance_palette === palette.id ? 'border-[var(--primary)] shadow-[0_0_0_1px_var(--primary)]' : 'border-white/[0.08] hover:border-white/20'}`}><span className="flex gap-1.5">{palette.colors.map((color) => <span key={color} className="h-5 flex-1 rounded" style={{ backgroundColor: color }} />)}</span><span className="mt-3 block text-xs font-medium text-white">{palette.label}</span></button>)}</div></section>
      <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-white/[0.08] bg-card p-5 shadow-xl shadow-black/10"><div className="flex items-start gap-3"><Type className="mt-1 size-5 text-[var(--primary)]" /><div><h2 className="font-semibold text-white">Tipografia</h2><p className="mt-1 text-sm text-muted-foreground">Ajuste a personalidade do texto.</p></div></div><div className="mt-5 space-y-2">{([['inter','Inter','Neutra e versátil'],['manrope','Manrope','Mais geométrica e espaçosa'],['ibm-plex-mono','IBM Plex Mono','Técnica e monoespaçada']] as const).map(([value, label, description]) => <OptionCard key={value} value={value} current={appearance.font_family} label={label} description={description} onSelect={(next) => updateAppearance('font_family', next)} />)}</div></section><section className="rounded-2xl border border-white/[0.08] bg-card p-5 shadow-xl shadow-black/10"><div className="flex items-start gap-3"><Waves className="mt-1 size-5 text-[var(--primary)]" /><div><h2 className="font-semibold text-white">Densidade e movimento</h2><p className="mt-1 text-sm text-muted-foreground">Deixe a interface mais compacta ou suave.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><OptionCard value="small" current={appearance.radius_scale} label="Compacto" description="Cantos mais discretos." onSelect={(next) => updateAppearance('radius_scale', next as RadiusScale)} /><OptionCard value="medium" current={appearance.radius_scale} label="Equilibrado" description="O padrão recomendado." onSelect={(next) => updateAppearance('radius_scale', next as RadiusScale)} /><OptionCard value="large" current={appearance.radius_scale} label="Suave" description="Cantos mais expressivos." onSelect={(next) => updateAppearance('radius_scale', next as RadiusScale)} /><OptionCard value="full" current={appearance.motion_mode} label="Movimento completo" description="Transições e feedbacks ativos." onSelect={(next) => updateAppearance('motion_mode', next as MotionMode)} /><OptionCard value="reduced" current={appearance.motion_mode} label="Movimento reduzido" description="Para foco e acessibilidade." onSelect={(next) => updateAppearance('motion_mode', next as MotionMode)} /></div></section></div>
      <section className="rounded-2xl border border-white/[0.08] bg-card p-5 shadow-xl shadow-black/10"><div className="flex items-start gap-3"><Contrast className="mt-1 size-5 text-[var(--primary)]" /><div><h2 className="font-semibold text-white">Acessibilidade</h2><p className="mt-1 text-sm text-muted-foreground">Ajustes para leitura e conforto visual.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><OptionCard value="normal" current={appearance.contrast_mode} label="Contraste normal" description="Equilíbrio entre hierarquia e suavidade." onSelect={(next) => updateAppearance('contrast_mode', next as ContrastMode)} /><OptionCard value="high" current={appearance.contrast_mode} label="Alto contraste" description="Bordas e textos mais definidos." onSelect={(next) => updateAppearance('contrast_mode', next as ContrastMode)} /></div></section>
    </div>
    <div className="sticky bottom-4 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.1] bg-[#0f141c]/95 p-3 shadow-2xl backdrop-blur"><div className="flex items-center gap-2 text-xs text-slate-400"><CircleHelp className="size-4" />{loadingAppearance ? 'Carregando suas preferências...' : hasAppearanceChanges ? 'Você tem alterações não salvas.' : 'Suas preferências estão atualizadas.'}</div><div className="flex gap-2"><button type="button" onClick={resetAppearance} className="inline-flex items-center gap-2 rounded-lg border border-white/[0.1] px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.05]"><RotateCcw className="size-3.5" />Restaurar padrão</button><button type="button" disabled={saving || loadingAppearance || !hasAppearanceChanges} onClick={() => void saveAppearance()} className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--primary-foreground)] disabled:cursor-not-allowed disabled:opacity-50"><Save className="size-3.5" />{saving ? 'Salvando...' : 'Salvar preferências'}</button></div></div>
    {message && <p role={messageError ? 'alert' : 'status'} className={`mt-3 text-xs ${messageError ? 'text-rose-300' : 'text-emerald-300'}`}>{message}</p>}
  </main>
}
