import { Descope } from '@descope/react-sdk'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
      <Descope
        flowId="sign-up-or-in-magic-link-or-social"
        onSuccess={() => navigate('/dashboard')}
        onError={(e) => console.error('Descope auth error:', e)}
      />
    </div>
  )
}
