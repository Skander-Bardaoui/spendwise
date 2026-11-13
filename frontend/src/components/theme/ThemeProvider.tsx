import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import type { ReactNode } from 'react'
import { ThemeContext } from '@/components/theme/themeContext'
import {
  applyTheme,
  getStoredThemePreference,
  THEME_STORAGE_KEY,
} from '@/lib/theme'
import type { ResolvedTheme, ThemePreference } from '@/lib/theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function subscribeToSystemTheme(callback: () => void) {
  const media = window.matchMedia(DARK_QUERY)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(
    getStoredThemePreference,
  )
  const systemTheme = useSyncExternalStore<ResolvedTheme>(
    subscribeToSystemTheme,
    getSystemTheme,
    () => 'light',
  )
  const theme: ResolvedTheme =
    preference === 'system' ? systemTheme : preference

  useEffect(() => {
    applyTheme(preference)
  }, [preference, systemTheme])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return
      const next = event.newValue
      if (next === 'light' || next === 'dark' || next === 'system') {
        setPreference(next)
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const toggleTheme = useCallback(() => {
    setPreference(theme === 'dark' ? 'light' : 'dark')
  }, [theme])

  const value = useMemo(
    () => ({ preference, theme, setPreference, toggleTheme }),
    [preference, theme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
