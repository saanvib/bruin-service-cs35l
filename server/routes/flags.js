import { Router } from 'express'
import { sql } from '../db.js'

const router = Router()

const FLAG_LIMIT = 5

router.post('/:id/flag', async (req, res) => {
  const userId = req.user.token.sub
  try {
    const found = await sql`SELECT id FROM listings WHERE id = ${req.params.id}`
    if (found.length === 0) return res.status(404).json({ error: 'Listing not found' })

    await sql`
      INSERT INTO flags (listing_id, user_id)
      VALUES (${req.params.id}, ${userId})
      ON CONFLICT (listing_id, user_id) DO NOTHING
    `

    const [{ count }] = await sql`
      SELECT count(*)::int AS count FROM flags WHERE listing_id = ${req.params.id}
    `

    let takenDown = false
    if (count >= FLAG_LIMIT) {
      await sql`UPDATE listings SET taken_down = true WHERE id = ${req.params.id}`
      takenDown = true
    }

    res.json({ flagCount: count, takenDown })
  } catch (err) {
    console.error('POST flag failed:', err)
    res.status(500).json({ error: 'Failed to flag listing' })
  }
})

export default router