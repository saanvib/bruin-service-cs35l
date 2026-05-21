import { Router } from 'express'

const listings = new Map([
  ["1", {
    id: "1",
    providerId: "provider-1",
    name: "Guitar Lessons",
    category: "Music",
    location: "De Neve Plaza",
    description: "One-on-one beginner to intermediate guitar lessons.",
    price: 30,
    duration: 60,
    photos: [],
    services: [
      { name: "30-min session", price: 20 },
      { name: "60-min session", price: 30 },
    ],
    availableDates: ["2026-05-01", "2026-05-03", "2026-05-05"],
    reviews: [
      { author: "Alice", rating: 5, text: "Amazing lessons, very patient!" },
      { author: "Bob",   rating: 4, text: "Great teacher, learned a lot." }
    ]
  }],
  ["2", {
    id: "2",
    providerId: "provider-1",
    name: "Math Tutoring",
    category: "Tutoring",
    location: "Powell Library",
    description: "Help with calculus, linear algebra, and statistics.",
    price: 25,
    duration: 90,
    photos: [],
    services: [
      { name: "60-min session", price: 25 },
      { name: "90-min session", price: 35 },
    ],
    availableDates: ["2026-05-02", "2026-05-04", "2026-05-06"],
    reviews: [
      { author: "Carol", rating: 5, text: "Explained everything so clearly." }
    ]
  }],
  ["3", {
    id: "3",
    providerId: "provider-2",
    name: "Resume Review",
    category: "Career",
    location: "Sproul Hall",
    description: "Personalized feedback on your resume and cover letter.",
    price: 15,
    duration: 30,
    photos: [],
    services: [
      { name: "Resume only",              price: 15 },
      { name: "Resume + Cover Letter",    price: 25 },
    ],
    availableDates: ["2026-05-01", "2026-05-02", "2026-05-03"],
    reviews: []
  }]
])

export { listings }

const router = Router()


router.get('/listings', (req, res) => {
  const { providerId } = req.query
  if (!providerId) return res.status(400).json({ error: 'providerId required' })
  const results = Array.from(listings.values()).filter(l => l.providerId === providerId)
  res.json(results)
})

router.post('/listings', (req, res) => {
  const { providerId, name, category, location, description, price, duration, services } = req.body
  if (!providerId || !name || !category || !location || !description || price == null || !duration) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const id = Date.now().toString()
  const listing = {
    id,
    providerId,
    name,
    category,
    location,
    description,
    price: Number(price),
    duration: Number(duration),
    photos: [],
    services: services || [],
    availableDates: [],
    reviews: []
  }
  listings.set(id, listing)
  res.status(201).json(listing)
})

router.put('/listings/:id', (req, res) => {
  const listing = listings.get(req.params.id)
  if (!listing) return res.status(404).json({ error: 'Listing not found' })

  const { providerId } = req.body
  if (listing.providerId !== providerId) return res.status(403).json({ error: 'Forbidden' })

  const updated = { ...listing, ...req.body, id: listing.id, providerId: listing.providerId }
  listings.set(listing.id, updated)
  res.json(updated)
})

router.delete('/listings/:id', (req, res) => {
  const listing = listings.get(req.params.id)
  if (!listing) return res.status(404).json({ error: 'Listing not found' })

  const { providerId } = req.query
  if (listing.providerId !== providerId) return res.status(403).json({ error: 'Forbidden' })

  listings.delete(req.params.id)
  res.json({ success: true })
})

export default router