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

router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, rating } = req.query;

    let queryStr = `
      SELECT
        id, name, category, location, description, price::float AS price, duration,
        photos, services, available_dates AS "availableDates",
        reviews
      FROM listings
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    if (category) {
      queryStr += ` AND category ILIKE $${paramIndex++}`; 
      queryParams.push(`%${category}%`); 
    }
    if (minPrice) {
      queryStr += ` AND price >= $${paramIndex++}`;
      queryParams.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      queryStr += ` AND price <= $${paramIndex++}`;
      queryParams.push(parseFloat(maxPrice));
    }

    queryStr += ` ORDER BY id`;

    const rows = await sql.query(queryStr, queryParams);

    let results = rows.map(listing => {
      const reviewsArray = listing.reviews || [];
      const review_count = reviewsArray.length;
      let avg_rating = 0;

      if (review_count > 0) {
        const sum = reviewsArray.reduce((total, rev) => total + rev.rating, 0);
        avg_rating = sum / review_count;
      }

      return {
        ...listing,
        rating: avg_rating,
        review_count: review_count
      };
    });

    if (rating) {
      const minRating = parseFloat(rating);
      results = results.filter(l => l.rating >= minRating);
    }

    res.json(results);

  } catch (err) {
    console.error('GET /api/listings failed:', err);
    res.status(500).json({ error: 'Failed to load listings' });
  }
})

router.get('/categories', async (req, res) => {
  try {
    const rows = await sql`
      SELECT DISTINCT category 
      FROM listings 
      WHERE category IS NOT NULL 
      ORDER BY category
    `;
    
    
    const categories = rows.map(row => row.category);
    res.json(categories);
  } catch (err) {
    console.error('GET /api/listings/categories failed:', err);
    res.status(500).json({ error: 'Failed to load categories' });
  }
})

// // GET /api/listings/:id (Single Listing Details)
// router.get('/:id', async (req, res) => {
//   try {
//     const rows = await sql.query(`
//       SELECT
//         id, name, category, location, description, price::float AS price, duration,
//         photos, services, available_dates AS "availableDates", reviews
//       FROM listings 
//       WHERE id = $1
//     `, [req.params.id]);
    
//     if (rows.length === 0) {
//         return res.status(404).json({ error: 'Listing not found' });
//     }

//     res.json(rows[0]);

//   } catch (err) {
//     console.error('GET /api/listings/:id failed:', err);
//     res.status(500).json({ error: 'Failed to load listing details' });
//   }
// })


router.get('/:id', async (req, res) => {
  try {
    const rows = await sql`
      SELECT
        id, provider_id, name, category, location, description, price::float AS price, duration,
        photos, services, available_dates AS "availableDates", reviews
      FROM listings 
      WHERE id = ${req.params.id}
    `;
    
    if (rows.length === 0) {
        return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error('GET /api/listings/:id failed:', err);
    res.status(500).json({ error: 'Failed to load listing details' });
  }
})

export default router