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
:wq
router.get('/', (req, res) => {
    try {
        const { category, minPrice, maxPrice , rating } = req.query; 
        
        let results = Array.from(listings.values());

        if (category) {
          const categoryLower = category.toLowerCase();
          results = results.filter(l => l.category.toLowerCase() === categoryLower);
        }

        if (minPrice) {
            
            const min = parseFloat(minPrice);
            results = results.filter(l => l.price >= min);
        }

        if (maxPrice) {
            const max = parseFloat(maxPrice);
            results = results.filter(l => l.price <= max);
        }

        if (rating) {
          const minRating = parseFloat(rating);
          results = results.filter(l => l.rating >= minRating);
        }

        return res.status(200).json(results);

    } catch (error) {
        console.error('Error fetching listings:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router
