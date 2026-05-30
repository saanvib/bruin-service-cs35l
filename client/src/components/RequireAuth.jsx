import { useSession } from '@descope/react-sdk'
import { Outlet, Navigate } from 'react-router-dom'

export default function RequireAuth() {
  const { isAuthenticated, isSessionLoading } = useSession()
  if (isSessionLoading) return null
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
