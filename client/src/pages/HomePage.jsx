import { Link } from 'react-router-dom'
import { useRole } from '../hooks/useRole'

export default function HomePage() {
  const { isProvider, isCustomer } = useRole()

  return (
    <div style={{ paddingTop: 80, paddingBottom: 80, maxWidth: 640 }}>
      <p style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: 'var(--color-muted)',
        margin: '0 0 16px',
      }}>UCLA Student Services</p>

      <h1 className="section-heading" style={{ fontSize: 48, marginBottom: 16 }}>
        Find the right Bruin for the job.
      </h1>

      <p style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 16,
        color: 'var(--color-muted)',
        lineHeight: 1.65,
        maxWidth: 520,
        margin: '0 0 36px',
      }}>
        Book tutoring, music lessons, fitness coaching, and more — from providers right on campus.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {isCustomer && (
          <Link to="/browse" className="btn-primary" style={{ height: 44, padding: '0 28px', fontSize: 15 }}>
            Browse Services
          </Link>
        )}
        {isProvider && (
          <Link to="/dashboard" className="btn-secondary" style={{ height: 44, padding: '0 28px', fontSize: 15 }}>
            Go to Dashboard
          </Link>
        )}
      </div>
    </div>
  )
}
