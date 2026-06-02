import { Link } from 'react-router-dom'
import { useRole } from '../hooks/useRole'

import { useState, useEffect } from 'react'
import { useUser, getSessionToken } from '@descope/react-sdk'

function getUsernameFromToken(sessionToken) {
  if (!sessionToken) return null
  try {
    const payload = JSON.parse(atob(sessionToken.split('.')[1]))
    const email = payload.email || (payload.loginIds && payload.loginIds[0]) || ''
    return email.split('@')[0] || null
  } catch {
    return null
  }
}

function authHeaders() {
  return { Authorization: `Bearer ${getSessionToken()}` }
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  })
}

export default function HomePage() {
  const { isProvider, isCustomer } = useRole()
  const { user } = useUser()
  const firstName = user?.name?.split(' ')[0]
    || user?.givenName
    || user?.loginIds?.[0]?.split('@')[0]
    || null

  const [bookings, setBookings] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(true)

  useEffect(() => {
    if (!isCustomer) { setLoadingBookings(false); return }
    fetch('/api/bookings/mine', { headers: authHeaders() })
      .then(res => res.ok ? res.json() : [])
      .then(data => { setBookings(data); setLoadingBookings(false) })
      .catch(() => setLoadingBookings(false))
  }, [isCustomer])

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
        {firstName ? `Hi, ${firstName}!` : 'Welcome back!'}
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

      {isCustomer && (
        <div style={{ marginTop: 56 }}>
          <h2 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: 'var(--color-muted)',
            margin: '0 0 16px',
          }}>My Bookings</h2>

          {loadingBookings ? (
            <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Loading...</p>
          ) : bookings.length === 0 ? (
            <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>
              No upcoming bookings.{' '}
              <Link to="/browse" style={{ color: 'var(--color-blue)', textDecoration: 'none', fontWeight: 500 }}>
                Browse services
              </Link>{' '}
              to get started.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bookings.map(b => (
                <div key={b.id} className="card" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 20px',
                }}>
                  <div>
                    <p style={{
                      margin: 0,
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 600,
                      fontSize: 14,
                      color: 'var(--color-heading)',
                    }}>{b.listingName || b.listingId}</p>
                    <p style={{
                      margin: '3px 0 0',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 13,
                      color: 'var(--color-muted)',
                    }}>{formatDate(b.date)} · {b.time}</p>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                    fontWeight: 500,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)',
                    background: b.status === 'confirmed' ? '#d1fae5' : 'var(--color-surface-soft)',
                    color: b.status === 'confirmed' ? 'var(--color-success)' : 'var(--color-muted)',
                  }}>{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}