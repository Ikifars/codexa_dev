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
  appearance_palette: 'codexa-original',
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
