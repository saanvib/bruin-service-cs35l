import { Router } from 'express'
import { sql } from '../db.js'

const router = Router()

const SELECT = `
  SELECT
    id,
    listing_id     AS "listingId",
    user_id        AS "userId",
    to_char(date, 'YYYY-MM-DD') AS date,
    time,
    customer_name  AS "customerName",
    customer_email AS "customerEmail",
    status,
    created_at     AS "createdAt"
  FROM bookings
`

router.get('/', async (req, res) => {
  try {
    const { listingId, includeCancelled } = req.query
    const filters = []
    const params = []
    if (listingId) {
      params.push(listingId)
      filters.push(`listing_id = $${params.length}`)
    }
    if (includeCancelled !== 'true') filters.push(`status <> 'cancelled'`)
    const where = filters.length ? ` WHERE ${filters.join(' AND ')}` : ''
    const order = listingId ? ' ORDER BY date, time' : ' ORDER BY created_at DESC'
    const rows = await sql.query(`${SELECT}${where}${order}`, params)
    res.json(rows)
  } catch (err) {
    console.error('GET /api/bookings failed:', err)
    res.status(500).json({ error: 'Failed to load bookings' })
  }
})

router.get('/mine', async (req, res) => {
  const email = req.user?.token?.email
  if (!email) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const today = new Date().toISOString().split('T')[0]
    const rows = await sql.query(
      `SELECT
         b.id,
         b.listing_id        AS "listingId",
         l.name              AS "listingName",
         to_char(b.date, 'YYYY-MM-DD') AS date,
         b.time,
         b.customer_name     AS "customerName",
         b.customer_email    AS "customerEmail",
         b.status
       FROM bookings b
       LEFT JOIN listings l ON l.id = b.listing_id
       WHERE b.customer_email = $1
         AND b.status <> 'cancelled'
         AND b.date >= $2
       ORDER BY b.date, b.time`,
      [email, today]
    )
    res.json(rows)
  } catch (err) {
    console.error('GET /api/bookings/mine failed:', err)
    res.status(500).json({ error: 'Failed to load bookings' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const rows = await sql.query(`${SELECT} WHERE id = $1`, [req.params.id])
    if (rows.length === 0) return res.status(404).json({ error: 'Booking not found' })
    res.json(rows[0])
  } catch (err) {
    console.error('GET /api/bookings/:id failed:', err)
    res.status(500).json({ error: 'Failed to load booking' })
  }
})

router.post('/', async (req, res) => {
  const { listingId, date, time, customerName, customerEmail } = req.body
  if (!listingId || !date || !time || !customerName || !customerEmail) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  try {
    const rows = await sql.query(
      `INSERT INTO bookings (listing_id, date, time, customer_name, customer_email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING
         id,
         listing_id     AS "listingId",
         user_id        AS "userId",
         to_char(date, 'YYYY-MM-DD') AS date,
         time,
         customer_name  AS "customerName",
         customer_email AS "customerEmail",
         status,
         created_at     AS "createdAt"`,
      [listingId, date, time, customerName, customerEmail]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Listing does not exist' })
    }
    console.error('POST /api/bookings failed:', err)
    res.status(500).json({ error: 'Failed to create booking' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const rows = await sql.query(
      `UPDATE bookings
         SET status = 'cancelled'
       WHERE id = $1 AND status <> 'cancelled'
       RETURNING id, status`,
      [req.params.id]
    )
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or already cancelled' })
    }
    res.status(200).json(rows[0])
  } catch (err) {
    console.error('DELETE /api/bookings/:id failed:', err)
    res.status(500).json({ error: 'Failed to cancel booking' })
  }
})
//Provider cancels a booking on one of their listings
router.patch('/:id/cancel-provider', async (req, res) => {
  const providerId = req.user?.token?.sub
  if (!providerId) return res.status(401).json({ error: 'Unauthorized' })
  try {
const rows = await sql.query(
      `SELECT b.id, b.status, l.provider_id
       FROM bookings b
       JOIN listings l ON l.id = b.listing_id
       WHERE b.id = $1`,
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Booking not found' })
    if (rows[0].provider_id !== providerId) return res.status(403).json({ error: 'Forbidden' })
    if (rows[0].status === 'cancelled') return res.status(400).json({ error: 'Already cancelled' })

    const updated = await sql.query(
      `UPDATE bookings SET status = 'cancelled'
       WHERE id = $1
       RETURNING id, status`,
      [req.params.id]
    )
    res.json(updated[0])
  } catch (err) {
    console.error('PATCH /api/bookings/:id/cancel-provider failed:', err)
    res.status(500).json({ error: 'Failed to cancel booking' })
  }
})
router.patch('/:id/reopen', async (req, res) => {
  const providerId = req.user?.token?.sub
  if (!providerId) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const rows = await sql.query(
      `SELECT b.id, b.status, l.provider_id
       FROM bookings b
       JOIN listings l ON l.id = b.listing_id
       WHERE b.id = $1`,
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Booking not found' })
    if (rows[0].provider_id !== providerId) return res.status(403).json({ error: 'Forbidden' })
    if (rows[0].status !== 'cancelled') return res.status(400).json({ error: 'Booking is not cancelled' })

    const updated = await sql.query(
      `UPDATE bookings SET status = 'pending'
       WHERE id = $1
       RETURNING id, status`,
      [req.params.id]
    )
    res.json(updated[0])
  } catch (err) {
    console.error('PATCH /api/bookings/:id/reopen failed:', err)
    res.status(500).json({ error: 'Failed to reopen booking' })
  }
})
	
export default router