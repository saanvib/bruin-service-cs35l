import { Router } from 'express'
const router = Router()
const listings = new Map([
  ["1", {
    id: "1",
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
      { author: "Bob", rating: 4, text: "Great teacher, learned a lot." }
    ]
  }],
  ["2", {
    id: "2",
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
    name: "Resume Review",
    category: "Career",
    location: "Sproul Hall",
    description: "Personalized feedback on your resume and cover letter.",
    price: 15,
    duration: 30,
    photos: [],
    services: [
      { name: "Resume only", price: 15 },
      { name: "Resume + Cover Letter", price: 25 },
    ],
    availableDates: ["2026-05-01", "2026-05-02", "2026-05-03"],
    reviews: []
  }]
])
router.get('/', (req, res) => res.json(Array.from(listings.values())))
router.get('/:id', (req, res) => {
  const listing = listings.get(req.params.id)
  if (!listing) return res.status(404).json({ error: 'Listing not found' })
  res.json(listing)
})
export default router