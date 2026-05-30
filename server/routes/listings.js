// import { Router } from 'express'
// import { sql } from '../db.js'

// const router = Router()

// const SELECT = `
//   SELECT
//     id, name, category, location, description, price::float AS price, duration,
//     photos, services,
//     available_dates AS "availableDates",
//     reviews
//   FROM listings
// `

// router.get('/', async (_req, res) => {
//   try {
//     const rows = await sql.query(`${SELECT} ORDER BY id`)
//     res.json(rows)
//   } catch (err) {
//     console.error('GET /api/listings failed:', err)
//     res.status(500).json({ error: 'Failed to load listings' })
//   }
// })

// router.get('/:id', async (req, res) => {
//   try {
//     const rows = await sql.query(`${SELECT} WHERE id = $1`, [req.params.id])
//     if (rows.length === 0) return res.status(404).json({ error: 'Listing not found' })
//     res.json(rows[0])
//   } catch (err) {
//     console.error('GET /api/listings/:id failed:', err)
//     res.status(500).json({ error: 'Failed to load listing' })
//   }
// })

// router.get('/', (req, res) => {
//     try {
//         const { category, minPrice, maxPrice , rating } = req.query; 
        
//         let results = Array.from(listings.values());

//         if (category) {
//           const categoryLower = category.toLowerCase();
//           results = results.filter(l => l.category.toLowerCase() === categoryLower);
//         }

//         if (minPrice) {
            
//             const min = parseFloat(minPrice);
//             results = results.filter(l => l.price >= min);
//         }

//         if (maxPrice) {
//             const max = parseFloat(maxPrice);
//             results = results.filter(l => l.price <= max);
//         }

//         if (rating) {
//           const minRating = parseFloat(rating);
//           results = results.filter(l => l.rating >= minRating);
//         }

//         return res.status(200).json(results);

//     } catch (error) {
//         console.error('Error fetching listings:', error);
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// });

// export default router


import { Router } from 'express'
import { sql } from '../db.js'

const router = Router()

// GET /api/listings (Search & Filter)
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, rating } = req.query;

    // 1. Build the query using a LEFT JOIN to attach reviews
    // We use COALESCE to default the rating to 0 if a listing has no reviews yet.
    let queryStr = `
      SELECT
        l.id, l.name, l.category, l.location, l.description, l.price::float AS price, l.duration,
        l.photos, l.services, l.available_dates AS "availableDates",
        COALESCE(AVG(r.rating), 0)::float AS rating,
        COUNT(r.id)::int AS review_count
      FROM listings l
      LEFT JOIN reviews r ON l.id = r.listing_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    // 2. Standard WHERE filters
    if (category) {
      queryStr += ` AND l.category ILIKE $${paramIndex++}`;
      queryParams.push(`%${category}%`); 
    }
    if (minPrice) {
      queryStr += ` AND l.price >= $${paramIndex++}`;
      queryParams.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      queryStr += ` AND l.price <= $${paramIndex++}`;
      queryParams.push(parseFloat(maxPrice));
    }

    // 3. Group by listing ID so we can calculate the average per listing
    queryStr += ` GROUP BY l.id`;

    // 4. Use HAVING to filter by the aggregated math (Average Rating)
    if (rating) {
      queryStr += ` HAVING COALESCE(AVG(r.rating), 0) >= $${paramIndex++}`;
      queryParams.push(parseFloat(rating));
    }

    queryStr += ` ORDER BY l.id`;

    // 5. Execute the single, highly optimized query
    const rows = await sql.query(queryStr, queryParams);
    res.json(rows);

  } catch (err) {
    console.error('GET /api/listings failed:', err);
    res.status(500).json({ error: 'Failed to load listings' });
  }
})

// GET /api/listings/:id (Single Listing Details)
router.get('/:id', async (req, res) => {
  try {
    // For the detail page, we fetch the listing...
    const listingQuery = `
      SELECT
        id, name, category, location, description, price::float AS price, duration,
        photos, services, available_dates AS "availableDates"
      FROM listings 
      WHERE id = $1
    `;
    const listingRows = await sql.query(listingQuery, [req.params.id]);
    
    if (listingRows.length === 0) {
        return res.status(404).json({ error: 'Listing not found' });
    }

    const listing = listingRows[0];

    // ...and then fetch the actual text reviews to display on the page
    const reviewsQuery = `
      SELECT id, rating, comment, created_at 
      FROM reviews 
      WHERE listing_id = $1 
      ORDER BY created_at DESC
    `;
    const reviewRows = await sql.query(reviewsQuery, [req.params.id]);

    // Attach the fetched reviews directly to the listing object
    listing.reviews = reviewRows;

    res.json(listing);

  } catch (err) {
    console.error('GET /api/listings/:id failed:', err);
    res.status(500).json({ error: 'Failed to load listing details' });
  }
})

export default router