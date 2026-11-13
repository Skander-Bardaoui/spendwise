import { createContext, useContext } from 'react'
import type { ResolvedTheme, ThemePreference } from '@/lib/theme'

export type ThemeContextValue = {
  preference: ThemePreference
  theme: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme doit être utilisé dans ThemeProvider')
  }
  return context
}
