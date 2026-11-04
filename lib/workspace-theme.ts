export type WorkspaceTheme = 'dark' | 'light' | 'system'
export type AccentColor = 'blue' | 'violet' | 'emerald' | 'amber' | 'rose'
export type FontFamily = 'inter' | 'manrope' | 'ibm-plex-mono'
export type RadiusScale = 'small' | 'medium' | 'large'
export type ContrastMode = 'normal' | 'high'
export type MotionMode = 'full' | 'reduced'

export type WorkspaceAppearance = {
  theme: WorkspaceTheme
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
  accent_color: 'blue',
  font_family: 'inter',
  radius_scale: 'medium',
  contrast_mode: 'normal',
  motion_mode: 'full',
}

export function getDefaultWorkspaceAppearance(): WorkspaceAppearance {
  return { ...defaultAppearance }
}

export function applyWorkspaceAppearance(appearance: WorkspaceAppearance): void {
  const root = document.documentElement
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
