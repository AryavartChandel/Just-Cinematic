const cors = require('cors')
const express = require('express')
require('dotenv').config()

const connectDB = require('./config/db')
const movieRoutes = require('./routes/movieRoutes')
const tmdbRoutes = require('./routes/tmdbRoutes')

connectDB()

const app = express()

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://justcinematic.netlify.app',
    ],
  })
)
app.use(express.json())

app.get('/', (req, res) => {
  res.send('My Cinema API running')
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'my-cinema-api' })
})

app.use('/api/movies', movieRoutes)
app.use('/api/tmdb', tmdbRoutes)

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

server.on('error', (error) => {
  console.error('Server failed:', error.message)
  process.exit(1)
})