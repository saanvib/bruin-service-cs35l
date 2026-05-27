import { useSession, getJwtRoles } from '@descope/react-sdk'

export function useRole() {
  const { sessionToken } = useSession()
  const roles = getJwtRoles(sessionToken) ?? []
  return {
    isProvider: roles.includes('provider'),
    isCustomer: roles.includes('customer'),
    roles,
  }
}
