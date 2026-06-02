import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUser, getSessionToken } from '@descope/react-sdk'
import { useRole } from '../hooks/useRole'

function authHeaders() {
  return { Authorization: `Bearer ${getSessionToken()}` }
}
function jsonHeaders() {
  return { ...authHeaders(), 'Content-Type': 'application/json' }
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
  const firstName = user?.name?.split(' ')[0] || user?.givenName || user?.loginIds?.[0]?.split('@')[0] || null

  // shared bookings state
  const [bookings, setBookings] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(true)

  // provider-only bio state
  const [bio, setBio] = useState('')
  const [editingBio, setEditingBio] = useState(false)
  const [bioInput, setBioInput] = useState('')
  const [savingBio, setSavingBio] = useState(false)

  useEffect(() => {
    if (!isCustomer && !isProvider) return
    const url = isProvider ? '/api/dashboard/bookings' : '/api/bookings/mine'
    fetch(url, { headers: authHeaders() })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        // dashboard/bookings returns { upcoming, past } or flat array depending on implementation
        const list = Array.isArray(data) ? data : (data.upcoming ?? [])
        setBookings(list.filter(b => b.status !== 'cancelled'))
        setLoadingBookings(false)
      })
      .catch(() => setLoadingBookings(false))
  }, [isCustomer, isProvider])

  useEffect(() => {
    if (!isProvider) return
    fetch('/api/dashboard/profile', { headers: authHeaders() })
      .then(res => res.ok ? res.json() : { bio: '' })
      .then(data => { setBio(data.bio); setBioInput(data.bio) })
      .catch(() => {})
  }, [isProvider])

  async function saveBio() {
    setSavingBio(true)
    try {
      const res = await fetch('/api/dashboard/profile', {
        method: 'PUT',
        headers: jsonHeaders(),
        body: JSON.stringify({ bio: bioInput }),
      })
      
      if (res.ok) { 
        const d = await res.json()
        setBio(d.bio)
        setBioInput(d.bio)
        setEditingBio(false)
      } else {
        const errData = await res.json().catch(() => ({}))
        alert(`Failed to save bio: ${errData.error || res.statusText}`)
      }
    } catch (error) {
      console.error(error)
      alert('Network error while saving bio.')
    } finally {
      setSavingBio(false)
    }
  }

  // shared header 
  const header = (
    <>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
        letterSpacing: 2, textTransform: 'uppercase', color: 'var(--color-muted)', margin: '0 0 16px' }}>
        UCLA Student Services
      </p>
      <h1 className="section-heading" style={{ fontSize: 48, marginBottom: 16 }}>
        {firstName ? `Hi, ${firstName}!` : 'Welcome back!'}
      </h1>
    </>
  )

  // bookings 
  const bookingList = loadingBookings ? (
    <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Loading...</p>
  ) : bookings.length === 0 ? (
    <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>No upcoming bookings.</p>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {bookings.map(b => (
        <div key={b.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' }}>
          <div>
            <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--color-heading)' }}>
              {b.listingName || b.listingId || b.listing_id}
            </p>
            <p style={{ margin: '3px 0 0', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-muted)' }}>
              {formatDate(b.date)} · {b.time}
            </p>
          </div>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, padding: '3px 10px',
            borderRadius: 'var(--radius-pill)',
            background: b.status === 'confirmed' ? '#d1fae5' : 'var(--color-surface-soft)',
            color: b.status === 'confirmed' ? 'var(--color-success)' : 'var(--color-muted)' }}>
            {b.status}
          </span>
        </div>
      ))}
    </div>
  )

  // heading 
  const sectionLabel = (text) => (
    <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
      letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--color-muted)', margin: '0 0 16px' }}>
      {text}
    </h2>
  )

  // provider view 
  if (isProvider) {
    return (
      <div style={{ paddingTop: 80, paddingBottom: 80, maxWidth: 640 }}>
        {header}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 56 }}>
          <Link to="/dashboard" className="btn-secondary" style={{ height: 44, padding: '0 28px', fontSize: 15 }}>
            Go to Dashboard
          </Link>
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 48 }}>
          {sectionLabel('My Bio')}
          {editingBio ? (
            <>
              <textarea
                value={bioInput}
                onChange={e => setBioInput(e.target.value)}
                rows={4}
                className="form-input"
                style={{ width: '100%', resize: 'vertical', fontFamily: 'var(--font-sans)', fontSize: 14 }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button onClick={saveBio} disabled={savingBio} className="btn-primary" style={{ height: 36, padding: '0 20px', fontSize: 14 }}>
                  {savingBio ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => { setEditingBio(false); setBioInput(bio) }} className="btn-secondary" style={{ height: 36, padding: '0 20px', fontSize: 14 }}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 15, color: bio ? 'var(--color-ink)' : 'var(--color-muted)', lineHeight: 1.65, flex: 1 }}>
                {bio || 'No bio yet.'}
              </p>
              <button onClick={() => setEditingBio(true)} className="btn-secondary" style={{ height: 32, padding: '0 14px', fontSize: 13, flexShrink: 0 }}>
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Upcoming bookings */}
        <div>
          {sectionLabel('Upcoming Bookings')}
          {bookingList}
        </div>
      </div>
    )
  }

  // customer view
  return (
    <div style={{ paddingTop: 80, paddingBottom: 80, maxWidth: 640 }}>
      {header}
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, color: 'var(--color-muted)',
        lineHeight: 1.65, maxWidth: 520, margin: '0 0 36px' }}>
        Book tutoring, music lessons, fitness coaching, and more — from providers right on campus.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/browse" className="btn-primary" style={{ height: 44, padding: '0 28px', fontSize: 15 }}>
          Browse Services
        </Link>
      </div>
      <div style={{ marginTop: 56 }}>
        {sectionLabel('My Bookings')}
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
        ) : bookingList}
      </div>
    </div>
  )
}