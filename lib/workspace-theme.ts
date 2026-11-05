export type WorkspaceTheme = 'dark' | 'light' | 'system'
export type AccentColor = 'blue' | 'violet' | 'emerald' | 'amber' | 'rose'
export type FontFamily = 'inter' | 'manrope' | 'ibm-plex-mono'
export type RadiusScale = 'small' | 'medium' | 'large'
export type ContrastMode = 'normal' | 'high'
export type MotionMode = 'full' | 'reduced'

export type WorkspaceAppearance = {
  theme: WorkspaceTheme
  primary_color: string
  secondary_color: string
  tertiary_color: string
  background_color: string
  surface_color: string
  sidebar_color: string
  header_color: string
  text_color: string
  muted_text_color: string
  border_color: string
  focus_color: string
  font_size_base: number
  heading_scale: number
  font_weight: 400 | 500 | 600 | 700
  line_height: number
  letter_spacing: number
  button_radius: number
  card_radius: number
  shadow_strength: number
  appearance_palette: string
  accent_color: AccentColor
  font_family: FontFamily
  radius_scale: RadiusScale
  contrast_mode: ContrastMode
  motion_mode: MotionMode
  navigation_collapsed?: boolean
  table_density?: 'comfortable' | 'compact'
}

const defaultAppearance: WorkspaceAppearance = {
  theme: 'dark',
  primary_color: '#6485ff',
  secondary_color: '#9b7cff',
  tertiary_color: '#42c995',
  background_color: '#090b10',
  surface_color: '#11161e',
  sidebar_color: '#0d1118',
  header_color: '#090b10',
  text_color: '#f8fafc',
  muted_text_color: '#94a3b8',
  border_color: '#253044',
  focus_color: '#6485ff',
  font_size_base: 16,
  heading_scale: 1,
  font_weight: 400,
  line_height: 1.5,
  letter_spacing: 0,
  button_radius: 0.65,
  card_radius: 0.75,
  shadow_strength: 20,
  appearance_palette: 'custom',
  accent_color: 'blue',
  font_family: 'inter',
  radius_scale: 'medium',
  contrast_mode: 'normal',
  motion_mode: 'full',
}

export function getDefaultWorkspaceAppearance(): WorkspaceAppearance {
  return { ...defaultAppearance }
}

function hexToRgb(hex: string) {
  const normalized = /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex.slice(1) : '6485ff'
  return `${Number.parseInt(normalized.slice(0, 2), 16)}, ${Number.parseInt(normalized.slice(2, 4), 16)}, ${Number.parseInt(normalized.slice(4, 6), 16)}`
}

export function applyWorkspaceAppearance(appearance: WorkspaceAppearance): void {
  const root = document.documentElement
  root.style.setProperty('--primary-custom', appearance.primary_color)
  root.style.setProperty('--secondary-custom', appearance.secondary_color)
  root.style.setProperty('--tertiary-custom', appearance.tertiary_color)
  root.style.setProperty('--primary-custom-rgb', hexToRgb(appearance.primary_color))
  root.style.setProperty('--secondary-custom-rgb', hexToRgb(appearance.secondary_color))
  root.style.setProperty('--tertiary-custom-rgb', hexToRgb(appearance.tertiary_color))
  root.style.setProperty('--workspace-background', appearance.background_color)
  root.style.setProperty('--workspace-surface', appearance.surface_color)
  root.style.setProperty('--workspace-sidebar', appearance.sidebar_color)
  root.style.setProperty('--workspace-header', appearance.header_color)
  root.style.setProperty('--workspace-text', appearance.text_color)
  root.style.setProperty('--workspace-muted', appearance.muted_text_color)
  root.style.setProperty('--workspace-border', appearance.border_color)
  root.style.setProperty('--focus-color', appearance.focus_color)
  root.style.setProperty('--font-size-base', `${appearance.font_size_base}px`)
  root.style.setProperty('--heading-scale', String(appearance.heading_scale))
  root.style.setProperty('--font-weight-base', String(appearance.font_weight))
  root.style.setProperty('--line-height-base', String(appearance.line_height))
  root.style.setProperty('--letter-spacing-base', `${appearance.letter_spacing}em`)
  root.style.setProperty('--button-radius', `${appearance.button_radius}rem`)
  root.style.setProperty('--card-radius', `${appearance.card_radius}rem`)
  root.style.setProperty('--shadow-strength', `${appearance.shadow_strength}%`)
  root.style.setProperty('--background', appearance.background_color)
  root.style.setProperty('--card', appearance.surface_color)
  root.style.setProperty('--popover', appearance.surface_color)
  root.style.setProperty('--sidebar', appearance.sidebar_color)
  root.style.setProperty('--foreground', appearance.text_color)
  root.style.setProperty('--muted-foreground', appearance.muted_text_color)
  root.style.setProperty('--border', appearance.border_color)
  root.style.setProperty('--input', appearance.border_color)
  root.style.setProperty('--primary', appearance.primary_color)
  root.style.setProperty('--ring', appearance.primary_color)
  root.style.setProperty('--sidebar-primary', appearance.primary_color)
  root.style.setProperty('--chart-1', appearance.primary_color)
  root.style.setProperty('--chart-2', appearance.secondary_color)
  root.style.setProperty('--chart-3', appearance.tertiary_color)
  root.style.setProperty('--secondary', appearance.secondary_color)
  root.style.setProperty('--accent', appearance.tertiary_color)
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
  const resolvedTheme = appearance.theme === 'system' ? (prefersLight ? 'light' : 'dark') : appearance.theme
  root.dataset.theme = resolvedTheme
  root.dataset.themePreference = appearance.theme
  root.classList.toggle('light', resolvedTheme === 'light')
  root.classList.toggle('dark', resolvedTheme === 'dark')
  root.dataset.accent = appearance.accent_color
  root.dataset.font = appearance.font_family
  root.dataset.radius = appearance.radius_scale
  root.dataset.contrast = appearance.contrast_mode
  root.dataset.motion = appearance.motion_mode
}

export function getWorkspaceThemePreference(): WorkspaceTheme {
  const preference = document.documentElement.dataset.themePreference
  return preference === 'light' || preference === 'system' ? preference : 'dark'
}

export function applyWorkspaceTheme(preference: WorkspaceTheme): void {
  applyWorkspaceAppearance({ ...defaultAppearance, theme: preference })
}

export { defaultAppearance }
