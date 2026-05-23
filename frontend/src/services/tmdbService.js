import axios from 'axios'

// All TMDB calls go through our backend proxy — never directly to TMDB
// This avoids carrier-level blocks (common in India) and keeps the API key server-side
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

// ── MOVIES ──────────────────────────────────────────

export const searchMovies = async (query) => {
  if (!query.trim()) return []
  const response = await api.get('/tmdb/search/movie', { params: { query } })
  return response.data.results
}

export const getMovieDetails = async (tmdbId) => {
  const response = await api.get(`/tmdb/movie/${tmdbId}`)
  return response.data
}

export const getMovieCredits = async (movieId) => {
  const response = await api.get(`/tmdb/movie/${movieId}/credits`)
  return response.data
}

// ── TV SERIES ────────────────────────────────────────

export const searchSeries = async (query) => {
  if (!query.trim()) return []
  const response = await api.get('/tmdb/search/tv', { params: { query } })

  return response.data.results.map((show) => ({
    ...show,
    title: show.name,
    release_date: show.first_air_date,
  }))
}

export const getSeriesDetails = async (tmdbId) => {
  const response = await api.get(`/tmdb/tv/${tmdbId}`)
  const data = response.data

  return {
    ...data,
    title: data.name,
    release_date: data.first_air_date,
    runtime: data.episode_run_time?.[0] || null,
    genres: data.genres,
  }
}

export const getSeriesCredits = async (seriesId) => {
  const response = await api.get(`/tmdb/tv/${seriesId}/credits`)
  return response.data
}

// ── UNIVERSAL DETAILS (used by MovieDetails modal) ───

export const getDetails = async (tmdbId, type = 'movie') => {
  if (type === 'series') return getSeriesDetails(tmdbId)

  // For type 'movie', try movie endpoint first, fall back to TV
  try {
    const data = await getMovieDetails(tmdbId)
    if (data && (data.title || data.name)) return data
    return getSeriesDetails(tmdbId)
  } catch {
    return getSeriesDetails(tmdbId)
  }
}