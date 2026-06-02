import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getSessionToken } from '@descope/react-sdk'
import CalendarPicker from '../components/CalendarPicker.jsx'

function authHeaders() {
  return { 'Authorization': `Bearer ${getSessionToken()}` }
}

const TIME_SLOTS = ["00:00","01:00","02:00","03:00","04:00","05:00","06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00"]



function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd
}

function googleCalendarUrl({ booking, listing }) {
  const start = new Date(`${booking.date}T${booking.time}:00`)
  const end = new Date(start.getTime() + listing.duration * 60_000)
  const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: listing.name,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Booking #${booking.id} for ${booking.customerName}`,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

const receiptStyles = `
  .booking-receipt { max-width: 520px; }
  .booking-receipt__header {
    display: flex; align-items: center; gap: 14px;
    padding: 24px 28px;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }
  .booking-receipt__header--confirmed { background: #d1fae5; }
  .booking-receipt__header--cancelled { background: #fee2e2; }
  .booking-receipt__icon {
    width: 38px; height: 38px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 700; flex-shrink: 0;
  }
  .booking-receipt__header--confirmed .booking-receipt__icon { background: #059669; color: white; }
  .booking-receipt__header--cancelled .booking-receipt__icon { background: var(--color-error); color: white; }
  .booking-receipt__title {
    font-family: var(--font-serif); font-size: 26px; font-weight: 400;
    letter-spacing: -0.3px; margin: 0; color: var(--color-heading);
  }
  .booking-receipt__details {
    border: 1px solid var(--color-hairline);
    border-top: none;
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    padding: 4px 28px;
  }
  .booking-receipt__row {
    display: flex; justify-content: space-between; align-items: baseline;
    padding: 13px 0; border-bottom: 1px solid var(--color-hairline);
    font-size: 15px;
  }
  .booking-receipt__row:last-child { border-bottom: none; }
  .booking-receipt__label { color: var(--color-muted); font-size: 13px; font-weight: 500; }
  .booking-receipt__value { font-weight: 500; color: var(--color-heading); }
  .booking-receipt__actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }

  .booking-page { max-width: 560px; }
  .booking-info-card { margin-bottom: 24px; }
  .booking-info-card__meta { color: var(--color-muted); font-size: 14px; margin: 6px 0 10px; line-height: 1.5; }
  .booking-info-card__price { font-weight: 600; color: var(--color-heading); font-size: 15px; }
  .booking-form { display: flex; flex-direction: column; }
  .booking-form__heading {
    font-family: var(--font-sans); font-size: 16px; font-weight: 600;
    margin: 0 0 20px; color: var(--color-heading);
  }
`

export default function BookingPage() {
  const { id } = useParams()

  const [listing, setListing] = useState(null)
  const [loadingListing, setLoadingListing] = useState(true)
  const [listingError, setListingError] = useState(null)

  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [booking, setBooking] = useState(null)

  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState(null)

  const [unavailableSlots, setUnavailableSlots] = useState([])
  const [sessionBookings, setSessionBookings] = useState([])
  const [calendarError, setCalendarError] = useState(null)

  useEffect(() => {
    setLoadingListing(true)
    setListingError(null)
    fetch(`/api/listings/${id}`)
      .then(res => {
        if (!res.ok) throw new Error(`Listing not found (${res.status})`)
        return res.json()
      })
      .then(data => { setListing(data); setLoadingListing(false) })
      .catch(err => { setListingError(err.message); setLoadingListing(false) })
  }, [id])

  function fetchSlots() {
    setCalendarError(null)
    setDate('')
    setTime('')
    fetch(`/api/bookings?listingId=${id}`, { headers: authHeaders() })
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load bookings (${res.status})`)
        return res.json()
      })
      .then(setUnavailableSlots)
      .catch(() => setCalendarError('Calendar failed to load. Please try again.'))
  }

  useEffect(() => { fetchSlots() }, [id])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: id, date, time, customerName, customerEmail })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Booking failed')
      }
      const data = await res.json()
      setBooking(data)
      setSessionBookings(prev => [...prev, { date: data.date, time: data.time }])
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel() {
    if (!window.confirm('Cancel this booking?')) return
    setCancelling(true)
    setCancelError(null)
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, { method: 'DELETE', headers: authHeaders() })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Cancel failed')
      }
      const data = await res.json()
      setBooking({ ...booking, status: data.status })
      setSessionBookings(prev => prev.filter(s => !(s.date === booking.date && s.time === booking.time)))
    } catch (err) {
      setCancelError(err.message)
    } finally {
      setCancelling(false)
    }
  }

  if (loadingListing) return <p style={{ color: 'var(--color-muted)' }}>Loading...</p>
  if (listingError) return <p className="form-error">Error: {listingError}</p>

  if (booking) {
    const isCancelled = booking.status === 'cancelled'
    const rows = [
      ['Booking ID', booking.id],
      ['Service',    listing.name],
      ['Date',       booking.date],
      ['Time',       booking.time],
      ['Name',       booking.customerName],
      ['Email',      booking.customerEmail],
      ['Price',      `$${listing.price}`],
      isCancelled ? ['Status', 'Cancelled'] : null,
    ].filter(Boolean)

    return (
      <div>
        <style>{receiptStyles}</style>
        <div className="booking-receipt">
          <div className={`booking-receipt__header booking-receipt__header--${isCancelled ? 'cancelled' : 'confirmed'}`}>
            <div className="booking-receipt__icon">{isCancelled ? '✕' : '✓'}</div>
            <h1 className="booking-receipt__title">
              {isCancelled ? 'Booking Cancelled' : 'Booking Confirmed!'}
            </h1>
          </div>
          <div className="booking-receipt__details">
            {rows.map(([label, value]) => (
              <div key={label} className="booking-receipt__row">
                <span className="booking-receipt__label">{label}</span>
                <span className="booking-receipt__value">{value}</span>
              </div>
            ))}
          </div>
          {!isCancelled && (
            <div className="booking-receipt__actions">
              <a
                href={googleCalendarUrl({ booking, listing })}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >Add to Google Calendar</a>
              {cancelError && <p className="form-error" style={{ width: '100%' }}>{cancelError}</p>}
              <button type="button" onClick={handleCancel} disabled={cancelling} className="btn-danger">
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const duration = listing.duration
  const blocked = [...unavailableSlots, ...sessionBookings]
    .filter(s => s.date === date)
    .map(s => ({ start: toMinutes(s.time), end: toMinutes(s.time) + duration }))

  const providerSlotsByDate = (listing.availableDates || []).reduce((acc, slot) => {
    if (slot.includes('T')) {
      const [d, t] = slot.split('T')
      if (!acc[d]) acc[d] = []
      acc[d].push(t)
    } else {
      if (!acc[slot]) acc[slot] = []
    }
    return acc
  }, {})

  const offeredTimesForDate = date
    ? (providerSlotsByDate[date] && providerSlotsByDate[date].length > 0
        ? providerSlotsByDate[date]
        : TIME_SLOTS)
    : []

  const visibleSlots = offeredTimesForDate.filter(t => {
    const start = toMinutes(t)
    const end = start + duration
    return !blocked.some(b => overlaps(start, end, b.start, b.end))
  })

  function getSlotsForDate(d) {
    const blockedForDate = [...unavailableSlots, ...sessionBookings]
      .filter(s => s.date === d)
      .map(s => ({ start: toMinutes(s.time), end: toMinutes(s.time) + duration }))
    return TIME_SLOTS.filter(t => {
      const start = toMinutes(t)
      const end = start + duration
      return !blockedForDate.some(b => overlaps(start, end, b.start, b.end))
    })
  }

  const allBlockedDates = [...new Set([...unavailableSlots, ...sessionBookings].map(s => s.date))]
  const fullyBookedDates = allBlockedDates.filter(d => getSlotsForDate(d).length === 0)

  const unavailableDates = (() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const oneMonthOut = new Date(today)
    oneMonthOut.setMonth(oneMonthOut.getMonth() + 1)
    const dates = []
    const cursor = new Date(today)
    while (cursor <= oneMonthOut) {
      const yyyy = cursor.getFullYear()
      const mm = String(cursor.getMonth() + 1).padStart(2, '0')
      const dd = String(cursor.getDate()).padStart(2, '0')
      const key = `${yyyy}-${mm}-${dd}`
      if (!providerSlotsByDate[key]) dates.push(key)
      cursor.setDate(cursor.getDate() + 1)
    }
    return dates
  })()

  function handleDateChange(e) {
    const newDate = e.target.value
    setDate(newDate)
    const blockedForNewDate = [...unavailableSlots, ...sessionBookings]
      .filter(s => s.date === newDate)
      .map(s => ({ start: toMinutes(s.time), end: toMinutes(s.time) + duration }))
    if (time) {
      const start = toMinutes(time)
      const end = start + duration
      const stillValid = !blockedForNewDate.some(b => overlaps(start, end, b.start, b.end))
      if (!stillValid) setTime('')
    }
  }

  return (
    <div>
      <style>{receiptStyles}</style>
      <div className="booking-page">
        {/* Listing info card */}
        <div className="card booking-info-card">
          <h2 className="page-title" style={{ marginBottom: 6 }}>{listing.name}</h2>
          <p className="booking-info-card__meta">{listing.description}</p>
          <span className="booking-info-card__price">${listing.price} · {listing.duration} min</span>
        </div>

        {/* Booking form */}
        <form onSubmit={handleSubmit} className="booking-form">
          <p className="booking-form__heading">Select a date &amp; time</p>

          {calendarError ? (
            <div>
              <p className="form-error">{calendarError}</p>
              <button type="button" className="btn-secondary" onClick={fetchSlots}>
                Retry
              </button>
            </div>
          ) : (
            <label className="form-label">Date
              <CalendarPicker
                selectedDate={date}
                onSelectDate={d => handleDateChange({ target: { value: d } })}
                fullyBookedDates={fullyBookedDates}
                unavailableDates={unavailableDates}
              />
            </label>
          )}

          {date && (
            <label className="form-label" style={{ marginTop: 8 }}>Time
              <select
                value={time}
                onChange={e => setTime(e.target.value)}
                required
                className="form-input"
                style={{ height: 'auto', padding: '10px 14px' }}
              >
                <option value="">Select a time</option>
                {visibleSlots.map(t => {
                  const endMinutes = toMinutes(t) + duration
                  const endHH = String(Math.floor(endMinutes / 60)).padStart(2, '0')
                  const endMM = String(endMinutes % 60).padStart(2, '0')
                  return (
                    <option key={t} value={t}>{t} – {endHH}:{endMM}</option>
                  )
                })}
              </select>
            </label>
          )}

          <label className="form-label" style={{ marginTop: 8 }}>Your Name
            <input
              type="text"
              className="form-input"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              required
              placeholder="Jane Doe"
            />
          </label>

          <label className="form-label">Your Email
            <input
              type="email"
              className="form-input"
              value={customerEmail}
              onChange={e => setCustomerEmail(e.target.value)}
              required
              placeholder="jane@example.com"
            />
          </label>

          {submitError && <p className="form-error">{submitError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary btn-full"
            style={{ marginTop: 8 }}
          >
            {submitting ? 'Booking...' : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  )
}