import { Router } from 'express'
const router = Router()

const bookings = []
let nextId = 1

router.get('/', (req, res) => res.json({ message: 'TODO' }))

router.get('/:id', (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id)
  if (!booking) return res.status(404).json({ error: 'Booking not found' })
  res.json(booking)
})

router.post('/', (req, res) => {
  const { listingId, date, time, customerName, customerEmail } = req.body
  if (!listingId || !date || !time || !customerName || !customerEmail) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const booking = {
    id: String(nextId++),
    listingId,
    date,
    time,
    customerName,
    customerEmail,
    createdAt: new Date().toISOString()
  }
  bookings.push(booking)
  res.status(201).json(booking)
})

router.delete('/:id', (req, res) => res.json({ message: 'TODO' }))

export default router
