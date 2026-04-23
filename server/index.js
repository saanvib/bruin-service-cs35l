import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import authRoutes          from './routes/auth.js'
import listingsRoutes      from './routes/listings.js'
import providersRoutes     from './routes/providers.js'
import dashboardRoutes     from './routes/dashboard.js'
import bookingsRoutes      from './routes/bookings.js'
import chatRoutes          from './routes/chat.js'
import notificationsRoutes from './routes/notifications.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/auth',          authRoutes)
app.use('/api/listings',      listingsRoutes)
app.use('/api/providers',     providersRoutes)
app.use('/api/dashboard',     dashboardRoutes)
app.use('/api/bookings',      bookingsRoutes)
app.use('/api/chat',          chatRoutes)
app.use('/api/notifications', notificationsRoutes)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
