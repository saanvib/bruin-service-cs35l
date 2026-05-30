import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

const TIME_SLOTS = ["00:00","01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"]

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
      </div>
    )
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
          <select value={date} onChange={e => setDate(e.target.value)} required>
            <option value="">Select a date</option>
            {listing.availableDates.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Time</label>
          <select value={time} onChange={e => setTime(e.target.value)} required>
            <option value="">Select a time</option>
            {TIME_SLOTS.map(t => (
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
