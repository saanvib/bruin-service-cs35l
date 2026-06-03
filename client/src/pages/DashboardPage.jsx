import { useState, useEffect } from 'react'
import { getSessionToken } from '@descope/react-sdk'

const API = 'http://localhost:3001/api/dashboard'

const CATEGORIES = ['Music', 'Tutoring', 'Career', 'Fitness', 'Art', 'Technology', 'Other']

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getSessionToken()}`,
  }
}

const emptyForm = {
  name: '',
  category: '',
  location: '',
  description: '',
  price: '',
  duration: '',
  availableDates: [],
  photos: [],
}

export default function DashboardPage() {
  const [listings, setListings]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  // modal state: null | 'create' | 'edit'
  const [modal, setModal]         = useState(null)
  const [editing, setEditing]     = useState(null)   // listing being edited
  const [form, setForm]           = useState(emptyForm)
  const [saving, setSaving]       = useState(false)
  const [deleteId, setDeleteId]   = useState(null)   // listing pending delete confirmation
  const [bookings, setBookings]         = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [bookingsError, setBookingsError]     = useState(null)
  const [bookingAction, setBookingAction]     = useState(null)

  // ── fetch ──────────────────────────────────────────────────────────────────
  async function fetchListings() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/listings`, { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to load listings')
      setListings(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchListings() }, [])

  async function fetchBookings() {
    setBookingsLoading(true)
    setBookingsError(null)
    try {
      const res = await fetch(`${API}/listings`, { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to load listings')
      const myListings = await res.json()
      const all = await Promise.all(
        myListings.map(l =>
          fetch(`/api/bookings?listingId=${l.id}&includeCancelled=true`, { headers: authHeaders() })
            .then(r => r.json())
            .then(rows => rows.map(b => ({ ...b, listingName: l.name })))
        )
      )
      setBookings(all.flat().sort((a, b) => new Date(a.date) - new Date(b.date)))
    } catch (e) {
      setBookingsError(e.message)
    } finally {
      setBookingsLoading(false)
    }
  }

  useEffect(() => { fetchBookings() }, [])

  // ── modal helpers ──────────────────────────────────────────────────────────
  function openCreate() {
    setForm(emptyForm)
    setEditing(null)
    setModal('create')
  }

  function openEdit(listing) {
    setForm({
      name:        listing.name,
      category:    listing.category,
      location:    listing.location,
      description: listing.description,
      price:       listing.price,
      duration:    listing.duration,
      availableDates: listing.available_dates || [],
      photos: listing.photos || [],
    })
    setEditing(listing)
    setModal('edit')
  }

  function closeModal() {
    setModal(null)
    setEditing(null)
    setForm(emptyForm)
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  // ── create ─────────────────────────────────────────────────────────────────
  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`${API}/listings`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ...form }),
      })
      if (!res.ok) throw new Error('Failed to create listing')
      await fetchListings()
      closeModal()
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── edit ───────────────────────────────────────────────────────────────────
  async function handleEdit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`${API}/listings/${editing.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ ...form }),
      })
      if (!res.ok) throw new Error('Failed to update listing')
      await fetchListings()
      closeModal()
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── delete ─────────────────────────────────────────────────────────────────
  async function handleDelete(id) {
    try {
      const res = await fetch(`${API}/listings/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error('Failed to delete listing')
      setDeleteId(null)
      await fetchListings()
    } catch (e) {
      alert(e.message)
    }
  }

  async function handleProviderCancel(bookingId) {
    if (!window.confirm('Cancel this booking?')) return
    setBookingAction(bookingId)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel-provider`, {
        method: 'PATCH',
        headers: authHeaders(),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to cancel')
      }
      await fetchBookings()
    } catch (e) {
      alert(e.message)
    } finally {
      setBookingAction(null)
    }
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>

      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 400, letterSpacing: '-0.3px' }}>My listings</h1>
        <button onClick={openCreate} style={styles.btnPrimary}>+ New listing</button>
      </div>

      {/* states */}
      {loading && <p style={{ color: '#888' }}>Loading…</p>}
      {error   && <p style={{ color: '#c0392b' }}>{error}</p>}

      {!loading && !error && listings.length === 0 && (
        <div style={styles.empty}>
          <p style={{ margin: 0, color: '#888' }}>You haven't created any listings yet.</p>
          <button onClick={openCreate} style={{ ...styles.btnPrimary, marginTop: '1rem' }}>Create your first listing</button>
        </div>
      )}

      {/* listing cards */}
      {!loading && listings.map(l => (
        <div key={l.id} style={styles.card}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={styles.badge}>{l.category}</span>
              <span style={{ color: '#888', fontSize: '0.8rem' }}>{l.location}</span>
            </div>
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 600, color: '#111' }}>{l.name}</h2>            <p style={{ margin: '0 0 0.5rem', color: '#555', fontSize: '0.9rem' }}>{l.description}</p>
            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#111' }}>${l.price} · {l.duration} min</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem' }}>
            <button onClick={() => openEdit(l)}      style={styles.btnSecondary}>Edit</button>
            <button onClick={() => setDeleteId(l.id)} style={styles.btnDanger}>Delete</button>
          </div>
        </div>
      ))}

      {/* create / edit modal */}
      {modal && (
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>{modal === 'create' ? 'New listing' : 'Edit listing'}</h2>
            <form onSubmit={modal === 'create' ? handleCreate : handleEdit}>

              <label style={styles.label}>Title
                <input name="name" value={form.name} onChange={handleChange}
                  required style={styles.input} placeholder="e.g. Guitar Lessons" />
              </label>

              <label style={styles.label}>Category
                <select name="category" value={form.category} onChange={handleChange}
                  required style={styles.input}>
                  <option value="">Select a category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label style={styles.label}>Location
                <input name="location" value={form.location} onChange={handleChange}
                  required style={styles.input} placeholder="e.g. Powell Library" />
              </label>

              <label style={styles.label}>Description
                <textarea name="description" value={form.description} onChange={handleChange}
                  required rows={3} style={{ ...styles.input, resize: 'vertical' }}
                  placeholder="Describe your service…" />
              </label>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ ...styles.label, flex: 1 }}>Price ($)
                  <input name="price" type="number" min="0" value={form.price} onChange={handleChange}
                    required style={styles.input} placeholder="25" />
                </label>
                <label style={{ ...styles.label, flex: 1 }}>Duration (min)
                  <input name="duration" type="number" min="0" value={form.duration} onChange={handleChange}
                    required style={styles.input} placeholder="60" />
                </label>
              </div>

              <div style={{ ...styles.label, gap: '0.5rem' }}>
                <span>Available Date &amp; Time Slots</span>
                <div style={{
                  border: '1px solid var(--color-hairline)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  background: 'var(--color-canvas)',
                }}>
                  {/* Date + time inputs row */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      id="slotDate"
                      style={{ ...styles.input, flex: 1 }}
                    />
                    <input
                      type="time"
                      id="slotTime"
                      style={{ ...styles.input, flex: '0 0 auto', width: 120 }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const d = document.getElementById('slotDate').value
                        const t = document.getElementById('slotTime').value
                        if (!d || !t) return
                        const slot = `${d}T${t}`
                        setForm(f => ({
                          ...f,
                          availableDates: f.availableDates.includes(slot)
                            ? f.availableDates
                            : [...f.availableDates, slot].sort()
                        }))
                        document.getElementById('slotDate').value = ''
                        document.getElementById('slotTime').value = ''
                      }}
                      style={{ ...styles.btnPrimary, flexShrink: 0 }}
                    >+ Add</button>
                  </div>

                  {/* Slot chips */}
                  {(form.availableDates || []).length === 0 ? (
                    <p style={{
                      margin: 0,
                      fontSize: 13,
                      color: 'var(--color-muted)',
                      fontFamily: 'var(--font-sans)',
                      textAlign: 'center',
                      padding: '8px 0',
                    }}>No slots added yet — pick a date and time above.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(form.availableDates || []).map(slot => {
                        const [date, time] = slot.split('T')
                        const [y, m, d] = date.split('-')
                        const label = `${m}/${d}/${y} · ${time}`
                        return (
                          <span key={slot} style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '5px 10px 5px 12px',
                            background: '#dbeafe',
                            color: '#1d4ed8',
                            borderRadius: 9999,
                            fontSize: 13,
                            fontWeight: 500,
                            fontFamily: 'var(--font-sans)',
                          }}>
                            {label}
                            <button
                              type="button"
                              onClick={() => setForm(f => ({ ...f, availableDates: f.availableDates.filter(x => x !== slot) }))}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 18,
                                height: 18,
                                background: 'rgba(29,78,216,0.15)',
                                border: 'none',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                color: '#1d4ed8',
                                fontWeight: 700,
                                fontSize: 12,
                                lineHeight: 1,
                                padding: 0,
                              }}
                              aria-label="Remove slot"
                            >×</button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <label style={styles.label}>Photos
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault()
                    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
                    files.forEach(file => {
                      const reader = new FileReader()
                      reader.onload = ev => {
                        setForm(f => ({ ...f, photos: [...(f.photos || []), ev.target.result] }))
                      }
                      reader.readAsDataURL(file)
                    })
                  }}
                  style={{
                    border: '2px dashed #d1d5db', borderRadius: 8, padding: '1.5rem',
                    textAlign: 'center', color: '#9ca3af', cursor: 'pointer', background: '#fafafa'
                  }}
                >
                  <p style={{ margin: 0 }}>Drag & drop images here</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>or</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ marginTop: '0.5rem' }}
                    onChange={e => {
                      Array.from(e.target.files).forEach(file => {
                        const reader = new FileReader()
                        reader.onload = ev => {
                          setForm(f => ({ ...f, photos: [...(f.photos || []), ev.target.result] }))
                        }
                        reader.readAsDataURL(file)
                      })
                      e.target.value = ''
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {(form.photos || []).map((src, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={src} alt="" style={{ height: 80, width: 80, objectFit: 'cover', borderRadius: 6 }} />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))}
                        style={{
                          position: 'absolute', top: -6, right: -6,
                          background: '#b91c1c', color: '#fff', border: 'none',
                          borderRadius: '50%', width: 20, height: 20, cursor: 'pointer',
                          fontSize: '0.75rem', fontWeight: 700, lineHeight: '20px', padding: 0
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
              </label>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} style={styles.btnSecondary}>Cancel</button>
                <button type="submit" disabled={saving} style={styles.btnPrimary}>
                  {saving ? 'Saving…' : modal === 'create' ? 'Create listing' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* delete confirmation */}
      {deleteId && (
        <div style={styles.overlay} onClick={() => setDeleteId(null)}>
          <div style={{ ...styles.modal, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Delete listing?</h2>
            <p style={{ color: '#555' }}>This can't be undone.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteId(null)} style={styles.btnSecondary}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)} style={styles.btnDanger}>Delete</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ marginTop: '2.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 400, letterSpacing: '-0.3px', marginBottom: '1.5rem' }}>My bookings</h1>
        {bookingsLoading && <p style={{ color: '#888' }}>Loading bookings…</p>}
        {bookingsError   && <p style={{ color: '#c0392b' }}>{bookingsError}</p>}
        {!bookingsLoading && !bookingsError && bookings.length === 0 && (
          <div style={styles.empty}>
            <p style={{ margin: 0, color: '#888' }}>No bookings yet.</p>
          </div>
        )}
        {!bookingsLoading && bookings.map(b => (
          <div key={b.id} style={{
            ...styles.card,
            borderColor: b.status === 'cancelled' ? '#e5e7eb' : '#e5c84a',
            opacity: b.status === 'cancelled' ? 0.7 : 1,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{
                  ...styles.badge,
                  background: b.status === 'cancelled' ? '#f1f5f9' : '#eff6ff',
                  color: b.status === 'cancelled' ? '#6b7280' : '#1d4ed8',
                }}>{b.status}</span>
                <span style={{ color: '#888', fontSize: '0.8rem' }}>{b.listingName}</span>
              </div>
              <p style={{ margin: '0 0 0.25rem', fontWeight: 600, color: '#111' }}>{b.customerName}</p>
              <p style={{ margin: '0 0 0.25rem', color: '#555', fontSize: '0.9rem' }}>{b.date} at {b.time}</p>
              <p style={{ margin: 0, color: '#888', fontSize: '0.85rem' }}>{b.customerEmail}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem' }}>
              {b.status !== 'cancelled' && (
                <button onClick={() => handleProviderCancel(b.id)} disabled={bookingAction === b.id} style={styles.btnDanger}>
                  {bookingAction === b.id ? 'Cancelling…' : 'Cancel'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

const styles = {
  btnPrimary: {
    background: '#2774AE',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '0.5rem 1.1rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  btnSecondary: {
    background: '#f1f5f9',
    color: '#333',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '0.45rem 1rem',
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  btnDanger: {
    background: '#fee2e2',
    color: '#b91c1c',
    border: '1px solid #fca5a5',
    borderRadius: 8,
    padding: '0.45rem 1rem',
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  card: {
    display: 'flex',
    alignItems: 'flex-start',
    background: '#fff',
    border: '1.5px solid #e5c84a',
    borderRadius: 12,
    padding: '1rem 1.25rem',
    marginBottom: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  badge: {
    background: '#dbeafe',
    color: '#1d4ed8',
    borderRadius: 9999,
    padding: '3px 10px',
    fontSize: 12,
    fontWeight: 500,
  },
  empty: {
    textAlign: 'center',
    padding: '3rem',
    border: '2px dashed #e5c84a',
    borderRadius: 12,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: '#fff',
    borderRadius: 14,
    padding: '1.75rem',
    width: '100%',
    maxWidth: 520,
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    marginBottom: '0.9rem',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: '#374151',
  },
  input: {
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '0.5rem 0.75rem',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
}