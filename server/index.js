import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import authRoutes          from './routes/auth.js'
import listingsRoutes      from './routes/listings.js'
import providersRoutes     from './routes/providers.js'
import dashboardRoutes     from './routes/dashboard.js'
import bookingsRoutes      from './routes/bookings.js'
import chatRoutes          from './routes/chat.js'
//import notificationsRoutes from './routes/notifications.js'
import { requireAuth, requireRole } from './middleware/auth.js'
import reviewsRoutes from './routes/reviews.js'
import flagsRoutes from './routes/flags.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.use('/api/auth',          authRoutes)
app.use('/api/listings',      requireAuth,listingsRoutes)
app.use('/api/providers',     requireAuth, providersRoutes)
app.use('/api/dashboard',     requireAuth, requireRole('provider'), dashboardRoutes)
app.use('/api/bookings',      requireAuth, bookingsRoutes)
app.use('/api/chat',          chatRoutes)
//app.use('/api/notifications', notificationsRoutes)
app.use('/api/listings',      requireAuth, reviewsRoutes)
app.use('/api/listings',      requireAuth, flagsRoutes)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})