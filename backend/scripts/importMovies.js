/**
 * import_movies.js
 * 
 * Reads your Excel watchlist, fetches TMDB data for each title,
 * and bulk inserts everything into MongoDB Atlas.
 * 
 * SETUP:
 *   1. Place this file in your backend folder (same level as .env)
 *   2. npm install xlsx mongoose axios dotenv
 *   3. node import_movies.js
 */

require('dotenv').config()
const mongoose = require('mongoose')
const axios = require('axios')
const XLSX = require('xlsx')
const path = require('path')

// ── Config ──────────────────────────────────────────────────────
const EXCEL_PATH = path.join(__dirname, 'movie_database_clean.xlsx')
const TMDB_KEY = process.env.TMDB_API_KEY
const MONGO_URI = process.env.MONGO_URI
const DELAY_MS = 300 // delay between TMDB requests to avoid rate limiting

// ── Mongoose Model (mirrors your Movie.js) ───────────────────────
const movieSchema = new mongoose.Schema(
  {
    tmdbId: Number,
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['movie', 'series', 'documentary'], default: 'movie' },
    year: Number,
    genre: [String],
    actors: [String],
    poster: String,
    imdbRating: { type: Number, min: 0, max: 10 },
    personalRating: String,
    watched: { type: Boolean, default: false },
    watchlist: { type: Boolean, default: true },
    review: String,
    notes: String,
  },
  { timestamps: true }
)
const Movie = mongoose.model('Movie', movieSchema)

// ── Helpers ──────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

// Normalise genre names from Excel to match TMDB/your app
const GENRE_MAP = {
  'Sci-Fi': 'Science Fiction',
  'Historical': 'History',
  'Psychological': 'Thriller',
  'Biography': 'Drama',
  'Sport': 'Drama',
  'True Crime': 'Documentary',
}

const normaliseGenres = (genreStr) => {
  if (!genreStr) return []
  return genreStr.split(',').map((g) => {
    const trimmed = g.trim()
    return GENRE_MAP[trimmed] || trimmed
  })
}

// Fetch TMDB data for a movie
const fetchMovieTMDB = async (title, year) => {
  try {
    const search = await axios.get('https://api.themoviedb.org/3/search/movie', {
      params: { api_key: TMDB_KEY, query: title, year: year || undefined },
    })
    const result = search.data.results[0]
    if (!result) return null

    const details = await axios.get(`https://api.themoviedb.org/3/movie/${result.id}`, {
      params: { api_key: TMDB_KEY, append_to_response: 'credits' },
    })
    const d = details.data
    return {
      tmdbId: d.id,
      poster: d.poster_path ? `${IMAGE_BASE}${d.poster_path}` : '',
      actors: d.credits?.cast?.slice(0, 5).map((a) => a.name) || [],
      genre: d.genres?.map((g) => g.name) || [],
      imdbRating: d.vote_average || null,
    }
  } catch {
    return null
  }
}

// Fetch TMDB data for a series
const fetchSeriesTMDB = async (title, year) => {
  try {
    const search = await axios.get('https://api.themoviedb.org/3/search/tv', {
      params: { api_key: TMDB_KEY, query: title, first_air_date_year: year || undefined },
    })
    const result = search.data.results[0]
    if (!result) return null

    const details = await axios.get(`https://api.themoviedb.org/3/tv/${result.id}`, {
      params: { api_key: TMDB_KEY, append_to_response: 'credits' },
    })
    const d = details.data
    return {
      tmdbId: d.id,
      poster: d.poster_path ? `${IMAGE_BASE}${d.poster_path}` : '',
      actors: d.credits?.cast?.slice(0, 5).map((a) => a.name) || [],
      genre: d.genres?.map((g) => g.name) || [],
      imdbRating: d.vote_average || null,
    }
  } catch {
    return null
  }
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  // 1. Connect to MongoDB
  console.log('🔌 Connecting to MongoDB...')
  await mongoose.connect(MONGO_URI)
  console.log('✅ Connected\n')

  // 2. Read Excel
  const wb = XLSX.readFile(EXCEL_PATH)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws)
  console.log(`📋 Found ${rows.length} titles in Excel\n`)

  const results = { success: 0, skipped: 0, failed: [] }

  // 3. Process each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const title = row['Title']?.trim()
    const type = (row['Type'] || 'Movie').toLowerCase() // movie | series | documentary
    const year = row['Year'] ? Number(row['Year']) : null
    const excelRating = row['Rating'] ? Number(row['Rating']) : null
    const excelGenres = normaliseGenres(row['Genre'])

    if (!title) continue

    process.stdout.write(`[${i + 1}/${rows.length}] ${title} (${year || '?'}) — `)

    // Check if already exists
    const exists = await Movie.findOne({ title: { $regex: `^${title}$`, $options: 'i' } })
    if (exists) {
      console.log('⏭  already exists, skipping')
      results.skipped++
      continue
    }

    // Fetch TMDB
    let tmdb = null
    if (type === 'movie') {
      tmdb = await fetchMovieTMDB(title, year)
    } else if (type === 'series') {
      tmdb = await fetchSeriesTMDB(title, year)
    }
    // documentaries: try movie search
    else if (type === 'documentary') {
      tmdb = await fetchMovieTMDB(title, year)
    }

    // Build document — TMDB data wins, Excel fills gaps
    const doc = {
      title,
      type: type === 'documentary' ? 'movie' : type,
      year,
      genre: tmdb?.genre?.length ? tmdb.genre : excelGenres,
      actors: tmdb?.actors || [],
      poster: tmdb?.poster || '',
      tmdbId: tmdb?.tmdbId || null,
      imdbRating: tmdb?.imdbRating ?? excelRating,
      personalRating: '',
      watched: false,
      watchlist: true,
    }

    try {
      await Movie.create(doc)
      console.log(tmdb ? '✅ imported with TMDB data' : '⚠️  imported (no TMDB match)')
      results.success++
    } catch (err) {
      console.log(`❌ failed: ${err.message}`)
      results.failed.push(title)
    }

    await sleep(DELAY_MS)
  }

  // 4. Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Imported:  ${results.success}`)
  console.log(`⏭  Skipped:   ${results.skipped}`)
  console.log(`❌ Failed:    ${results.failed.length}`)
  if (results.failed.length) console.log('   Failed titles:', results.failed.join(', '))
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  await mongoose.disconnect()
  console.log('Done!')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})