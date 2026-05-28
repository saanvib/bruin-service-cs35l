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

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>

      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>My listings</h1>
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
    background: '#eff6ff',
    color: '#1d4ed8',
    borderRadius: 6,
    padding: '0.15rem 0.5rem',
    fontSize: '0.75rem',
    fontWeight: 600,
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