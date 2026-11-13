import { Toaster } from 'sonner'
import { useTheme } from '@/components/theme/themeContext'

export function AppToaster() {
  const { theme } = useTheme()
  return <Toaster richColors position="top-right" theme={theme} />
}
