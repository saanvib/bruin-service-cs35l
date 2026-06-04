import { Router } from 'express'
import { sql } from '../db.js'

const router = Router()

// GET /api/listings/:id/reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const rows = await sql`
      SELECT id, rating, comment, created_at AS "createdAt"
      FROM reviews
      WHERE listing_id = ${req.params.id}
      ORDER BY created_at DESC
    `
    res.json(rows)
  } catch (err) {
    console.error('GET reviews failed:', err)
    res.status(500).json({ error: 'Failed to load reviews' })
  }
})

// POST /api/listings/:id/reviews
router.post('/:id/reviews', async (req, res) => {
  const { rating, comment } = req.body
  const userId = req.user?.token?.sub

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' })
  }
  if (!userId) {
    return res.status(401).json({ error: 'Must be logged in to leave a review' })
  }

  try {
    const existing = await sql`
      SELECT id FROM reviews
      WHERE listing_id = ${req.params.id} AND user_id = ${userId}
    `
    if (existing.length > 0) {
      return res.status(409).json({ error: 'You have already reviewed this listing' })
    }

    const [review] = await sql`
      INSERT INTO reviews (listing_id, rating, comment, user_id)
      VALUES (${req.params.id}, ${rating}, ${comment || ''}, ${userId})
      RETURNING id, rating, comment, created_at AS "createdAt"
    `
    res.status(201).json(review)
  } catch (err) {
    console.error('POST review failed:', err)
    res.status(500).json({ error: 'Failed to submit review' })
  }
})

export default router
