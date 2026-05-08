import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import CalendarPicker from '../components/CalendarPicker.jsx'

const TIME_SLOTS = ["00:00","01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"]

const UNAVAILABLE_SLOTS_SAMPLE = [
  { listingId: "1", date: "2026-05-01", time: "10:00" },
  { listingId: "1", date: "2026-05-03", time: "14:00" },
]

// Single seam for swapping to a real backend later.
// To switch to a DB: replace this body with `const res = await fetch(...); return res.json()`.
async function loadUnavailableSlots(listingId) {
  return UNAVAILABLE_SLOTS_SAMPLE.filter(s => s.listingId === listingId)
}

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

  const [unavailableSlots, setUnavailableSlots] = useState([])
  const [sessionBookings, setSessionBookings] = useState([])

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

  useEffect(() => {
    loadUnavailableSlots(id).then(setUnavailableSlots)
  }, [id])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  if (loadingListing) return <p>Loading...</p>
  if (listingError) return <p>Error: {listingError}</p>

  if (booking) {
    return (
      <div>
        <h1>Booking Confirmed</h1>
        <p>Booking ID: {booking.id}</p>
        <p>Service: {listing.name}</p>
        <p>Date: {booking.date}</p>
        <p>Time: {booking.time}</p>
        <p>Name: {booking.customerName}</p>
        <p>Email: {booking.customerEmail}</p>
        <p>Price: ${listing.price}</p>
        <a
          href={googleCalendarUrl({ booking, listing })}
          target="_blank"
          rel="noopener noreferrer"
        >
          Add to Google Calendar
        </a>
      </div>
    )
  }

  const duration = listing.duration
  const blocked = [...unavailableSlots, ...sessionBookings]
    .filter(s => s.date === date)
    .map(s => ({ start: toMinutes(s.time), end: toMinutes(s.time) + duration }))

  const visibleSlots = TIME_SLOTS.filter(t => {
    const start = toMinutes(t)
    const end = start + duration
    return !blocked.some(b => overlaps(start, end, b.start, b.end))
  })

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
      <h1>Book Appointment</h1>

      <h2>{listing.name}</h2>
      <p>{listing.description}</p>
      <p>Price: ${listing.price} / {listing.duration} min</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Date</label>
          <CalendarPicker
            selectedDate={date}
            onSelectDate={(d) => handleDateChange({ target: { value: d } })}
          />
        </div>

        <div>
          <label>Time</label>
          <select value={time} onChange={e => setTime(e.target.value)} required>
            <option value="">Select a time</option>
            {visibleSlots.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Your Name</label>
          <input
            type="text"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Your Email</label>
          <input
            type="email"
            value={customerEmail}
            onChange={e => setCustomerEmail(e.target.value)}
            required
          />
        </div>

        {submitError && <p>{submitError}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Booking...' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  )
}