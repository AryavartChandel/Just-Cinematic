/**
 * import_watched.js
 *
 * Reads your watched Excel (with notes), fetches TMDB data,
 * and inserts into MongoDB as watched: true, watchlist: false.
 *
 * SETUP:
 *   1. Place this file in your backend folder (same level as .env)
 *   2. Place watchlist_with_notes.xlsx in the same folder
 *   3. npm install xlsx mongoose axios dotenv  (if not already done)
 *   4. node import_watched.js
 */

require('dotenv').config()
const mongoose = require('mongoose')
const axios = require('axios')
const XLSX = require('xlsx')
const path = require('path')

// ── Config ───────────────────────────────────────────────────────
const EXCEL_PATH = path.join(__dirname, 'watchlist_with_notes.xlsx')
const TMDB_KEY = process.env.TMDB_API_KEY
const MONGO_URI = process.env.MONGO_URI
const DELAY_MS = 300

// ── Mongoose Model ───────────────────────────────────────────────
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
  console.log('🔌 Connecting to MongoDB...')
  await mongoose.connect(MONGO_URI)
  console.log('✅ Connected\n')

  const wb = XLSX.readFile(EXCEL_PATH)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws)
  console.log(`📋 Found ${rows.length} titles in Excel\n`)

  const results = { success: 0, updated: 0, skipped: 0, failed: [] }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const title = row['Title']?.trim()
    const type = (row['Type'] || 'Movie').toLowerCase()
    const year = row['Release Year'] ? Number(row['Release Year']) : null
    const excelGenres = normaliseGenres(row['Genre'])
    const notes = row['Notes']?.trim() || ''

    if (!title) continue

    process.stdout.write(`[${i + 1}/${rows.length}] ${title} — `)

    // If already exists (from previous watchlist import), update it
    const existing = await Movie.findOne({ title: { $regex: `^${title}$`, $options: 'i' } })
    if (existing) {
      await Movie.findByIdAndUpdate(existing._id, {
        watched: true,
        watchlist: false,
        notes: notes || existing.notes,
      })
      console.log('🔄 already exists — marked as watched + notes saved')
      results.updated++
      continue
    }

    // New entry — fetch TMDB
    let tmdb = null
    if (type === 'series') {
      tmdb = await fetchSeriesTMDB(title, year)
    } else {
      tmdb = await fetchMovieTMDB(title, year)
    }

    const doc = {
      title,
      type: type === 'documentary' ? 'movie' : type,
      year,
      genre: tmdb?.genre?.length ? tmdb.genre : excelGenres,
      actors: tmdb?.actors || [],
      poster: tmdb?.poster || '',
      tmdbId: tmdb?.tmdbId || null,
      imdbRating: tmdb?.imdbRating ?? null,
      personalRating: '',
      watched: true,
      watchlist: false,
      notes,
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

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Imported:  ${results.success}`)
  console.log(`🔄 Updated:   ${results.updated}  (existing → watched + notes)`)
  console.log(`❌ Failed:    ${results.failed.length}`)
  if (results.failed.length) console.log('   Failed:', results.failed.join(', '))
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  await mongoose.disconnect()
  console.log('Done!')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})