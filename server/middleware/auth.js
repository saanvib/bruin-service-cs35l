import DescopeClient from '@descope/node-sdk'

const descopeClient = DescopeClient({ projectId: process.env.DESCOPE_PROJECT_ID })

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Missing token' })
  try {
    const authInfo = await descopeClient.validateSession(token)
    req.user = authInfo
    next()
  } catch (err) {
    console.error('requireAuth failed:', err.message)
    res.status(401).json({ error: 'Invalid token' })
  }
}


export function requireRole(role) {
  return (req, res, next) => {
    if (!descopeClient.validateRoles(req.user, [role])) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }
}
