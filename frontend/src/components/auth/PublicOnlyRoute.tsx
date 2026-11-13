import { Navigate, Outlet } from 'react-router-dom'
import { FullPageLoader } from '@/components/FullPageLoader'
import { useAuth } from '@/hooks/useAuth'

export function PublicOnlyRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return <FullPageLoader message="Chargement de votre espace…" />
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
