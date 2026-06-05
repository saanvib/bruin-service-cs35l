import { useSession } from '@descope/react-sdk'
import { Outlet, Navigate } from 'react-router-dom'

export default function RequireAuth() {
  if (import.meta.env.VITE_TEST_MODE === 'true') return <Outlet />
  const { isAuthenticated, isSessionLoading } = useSession()
  if (isSessionLoading) return null
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
