import { Router } from 'express'
import { sql } from '../db.js'

const router = Router()

// GET /api/dashboard/listings?providerId=xxx
router.get('/listings', async (req, res) => {
  const { providerId } = req.query
  if (!providerId) return res.status(400).json({ error: 'providerId required' })
  try {
    const rows = await sql`
      SELECT * FROM listings
      WHERE provider_id = ${providerId}
      ORDER BY created_at DESC
    `
    res.json(rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch listings' })
  }
})

// POST /api/dashboard/listings
router.post('/listings', async (req, res) => {
  const { providerId, name, category, location, description, price, duration, services } = req.body
  if (!providerId || !name || !category || !location || !description || price == null || !duration) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  try {
    const id = Date.now().toString()
    const [listing] = await sql`
      INSERT INTO listings (id, provider_id, name, category, location, description, price, duration, services)
      VALUES (
        ${id},
        ${providerId},
        ${name},
        ${category},
        ${location},
        ${description},
        ${Number(price)},
        ${Number(duration)},
        ${JSON.stringify(services || [])}::jsonb
      )
      RETURNING *
    `
    res.status(201).json(listing)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to create listing' })
  }
})

// PUT /api/dashboard/listings/:id
router.put('/listings/:id', async (req, res) => {
  const { providerId, name, category, location, description, price, duration, services } = req.body
  if (!providerId) return res.status(400).json({ error: 'providerId required' })
  try {
    const [existing] = await sql`SELECT * FROM listings WHERE id = ${req.params.id}`
    if (!existing) return res.status(404).json({ error: 'Listing not found' })
    if (existing.provider_id !== providerId) return res.status(403).json({ error: 'Forbidden' })

    const [updated] = await sql`
      UPDATE listings SET
        name        = ${name},
        category    = ${category},
        location    = ${location},
        description = ${description},
        price       = ${Number(price)},
        duration    = ${Number(duration)},
        services    = ${JSON.stringify(services || [])}::jsonb
      WHERE id = ${req.params.id}
      RETURNING *
    `
    res.json(updated)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to update listing' })
  }
})

// DELETE /api/dashboard/listings/:id
router.delete('/listings/:id', async (req, res) => {
  const { providerId } = req.query
  if (!providerId) return res.status(400).json({ error: 'providerId required' })
  try {
    const [existing] = await sql`SELECT * FROM listings WHERE id = ${req.params.id}`
    if (!existing) return res.status(404).json({ error: 'Listing not found' })
    if (existing.provider_id !== providerId) return res.status(403).json({ error: 'Forbidden' })

    await sql`DELETE FROM listings WHERE id = ${req.params.id}`
    res.json({ success: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to delete listing' })
  }
})

export default router