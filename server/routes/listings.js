import { Router } from 'express'
import { sql } from '../db.js'

const router = Router()

const SELECT = `
  SELECT
    id, name, category, location, description, price::float AS price, duration,
    photos, services,
    available_dates AS "availableDates",
    reviews
  FROM listings
`

router.get('/', async (_req, res) => {
  try {
    const rows = await sql.query(`${SELECT} ORDER BY id`)
    res.json(rows)
  } catch (err) {
    console.error('GET /api/listings failed:', err)
    res.status(500).json({ error: 'Failed to load listings' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const rows = await sql.query(`${SELECT} WHERE id = $1`, [req.params.id])
    if (rows.length === 0) return res.status(404).json({ error: 'Listing not found' })
    res.json(rows[0])
  } catch (err) {
    console.error('GET /api/listings/:id failed:', err)
    res.status(500).json({ error: 'Failed to load listing' })
  }
})

export default router
