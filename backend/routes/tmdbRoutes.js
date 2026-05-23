const express = require('express')
const router = express.Router()

const TMDB_BASE = 'https://api.themoviedb.org/3'
const API_KEY = process.env.TMDB_API_KEY

// Helper — fetch from TMDB and forward response
const tmdbFetch = async (path, params = {}) => {
  const url = new URL(`${TMDB_BASE}${path}`)
  url.searchParams.set('api_key', API_KEY)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`)
  return res.json()
}

// Search movies
router.get('/search/movie', async (req, res) => {
  try {
    const data = await tmdbFetch('/search/movie', { query: req.query.query })
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Search TV series
router.get('/search/tv', async (req, res) => {
  try {
    const data = await tmdbFetch('/search/tv', { query: req.query.query })
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Movie details
router.get('/movie/:id', async (req, res) => {
  try {
    const data = await tmdbFetch(`/movie/${req.params.id}`, {
      append_to_response: 'credits,videos',
    })
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Movie credits
router.get('/movie/:id/credits', async (req, res) => {
  try {
    const data = await tmdbFetch(`/movie/${req.params.id}/credits`)
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// TV series details
router.get('/tv/:id', async (req, res) => {
  try {
    const data = await tmdbFetch(`/tv/${req.params.id}`, {
      append_to_response: 'credits,videos',
    })
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// TV series credits
router.get('/tv/:id/credits', async (req, res) => {
  try {
    const data = await tmdbFetch(`/tv/${req.params.id}/credits`)
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router