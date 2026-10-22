export type WorkspaceTheme = 'dark' | 'light' | 'system'

const themeStorageKey = 'codexa-theme'

export function getWorkspaceThemePreference(): WorkspaceTheme {
  const saved = window.localStorage.getItem(themeStorageKey)
  return saved === 'light' || saved === 'system' ? saved : 'dark'
}

export function applyWorkspaceTheme(preference: WorkspaceTheme): void {
  window.localStorage.setItem(themeStorageKey, preference)
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
  document.documentElement.dataset.theme = preference === 'system'
    ? (prefersLight ? 'light' : 'dark')
    : preference
  document.documentElement.dataset.themePreference = preference
}
