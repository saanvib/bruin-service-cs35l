import { useSession } from '@descope/react-sdk'
import { Outlet, Navigate } from 'react-router-dom'
import { useRole } from '../hooks/useRole'

export default function RequireRole({ role }) {
  if (import.meta.env.VITE_TEST_MODE === 'true') return <Outlet />
  const { isSessionLoading } = useSession()
  const { roles } = useRole()
  if (isSessionLoading) return null
  return roles.includes(role) ? <Outlet /> : <Navigate to="/" replace />
}
