import { sql } from '../db.js'

const listings = [
  {
    id: '1',
    name: 'Guitar Lessons',
    category: 'Music',
    location: 'De Neve Plaza',
    description: 'One-on-one beginner to intermediate guitar lessons.',
    price: 30,
    duration: 60,
    photos: [],
    services: [
      { name: '30-min session', price: 20 },
      { name: '60-min session', price: 30 },
    ],
    availableDates: ['2026-05-01', '2026-05-03', '2026-05-05'],
    reviews: [
      { author: 'Alice', rating: 5, text: 'Amazing lessons, very patient!' },
      { author: 'Bob',   rating: 4, text: 'Great teacher, learned a lot.' },
    ],
  },
  {
    id: '2',
    name: 'Math Tutoring',
    category: 'Tutoring',
    location: 'Powell Library',
    description: 'Help with calculus, linear algebra, and statistics.',
    price: 25,
    duration: 90,
    photos: [],
    services: [
      { name: '60-min session', price: 25 },
      { name: '90-min session', price: 35 },
    ],
    availableDates: ['2026-05-02', '2026-05-04', '2026-05-06'],
    reviews: [
      { author: 'Carol', rating: 5, text: 'Explained everything so clearly.' },
    ],
  },
  {
    id: '3',
    name: 'Resume Review',
    category: 'Career',
    location: 'Sproul Hall',
    description: 'Personalized feedback on your resume and cover letter.',
    price: 15,
    duration: 30,
    photos: [],
    services: [
      { name: 'Resume only',            price: 15 },
      { name: 'Resume + Cover Letter',  price: 25 },
    ],
    availableDates: ['2026-05-01', '2026-05-02', '2026-05-03'],
    reviews: [],
  },
]

for (const l of listings) {
  await sql`
    INSERT INTO listings (
      id, name, category, location, description, price, duration,
      photos, services, available_dates, reviews
    ) VALUES (
      ${l.id}, ${l.name}, ${l.category}, ${l.location}, ${l.description},
      ${l.price}, ${l.duration},
      ${JSON.stringify(l.photos)}::jsonb,
      ${JSON.stringify(l.services)}::jsonb,
      ${JSON.stringify(l.availableDates)}::jsonb,
      ${JSON.stringify(l.reviews)}::jsonb
    )
    ON CONFLICT (id) DO NOTHING
  `
  console.log(`  upserted listing ${l.id} (${l.name})`)
}

const [{ count }] = await sql`SELECT count(*)::int AS count FROM listings`
console.log(`Done. listings table now has ${count} rows.`)
