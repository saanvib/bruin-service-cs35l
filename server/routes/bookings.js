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

export default router
