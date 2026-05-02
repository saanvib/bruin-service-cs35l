import { Router } from 'express'
const router = Router()

const listings = new Map([
  ["1", {
    id: "1",
    name: "Guitar Lessons",
    description: "One-on-one beginner to intermediate guitar lessons.",
    price: 30,
    duration: 60,
    availableDates: ["2026-05-01", "2026-05-03", "2026-05-05"],
    reviews: [
      { author: "Alice", rating: 5, text: "Amazing lessons, very patient!" },
      { author: "Bob", rating: 4, text: "Great teacher, learned a lot." }
    ]
  }],
  ["2", {
    id: "2",
    name: "Math Tutoring",
    description: "Help with calculus, linear algebra, and statistics.",
    price: 25,
    duration: 90,
    availableDates: ["2026-05-02", "2026-05-04", "2026-05-06"],
    reviews: [
      { author: "Carol", rating: 5, text: "Explained everything so clearly." }
    ]
  }],
  ["3", {
    id: "3",
    name: "Resume Review",
    description: "Personalized feedback on your resume and cover letter.",
    price: 15,
    duration: 30,
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
