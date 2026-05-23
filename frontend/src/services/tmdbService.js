import axios from 'axios'

const API_KEY = import.meta.env.VITE_TMDB_API_KEY

const tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
})

// ── MOVIES ──────────────────────────────────────────

export const searchMovies = async (query) => {
  if (!query.trim()) return []

  const response = await tmdb.get('/search/movie', {
    params: { api_key: API_KEY, query },
  })

  return response.data.results
}

export const getMovieDetails = async (tmdbId) => {
  const response = await tmdb.get(`/movie/${tmdbId}`, {
    params: {
      api_key: API_KEY,
      append_to_response: 'credits,videos',
    },
  })

  return response.data
}

export const getMovieCredits = async (movieId) => {
  const response = await tmdb.get(`/movie/${movieId}/credits`, {
    params: { api_key: API_KEY },
  })

  return response.data
}

// ── TV SERIES ────────────────────────────────────────

export const searchSeries = async (query) => {
  if (!query.trim()) return []

  const response = await tmdb.get('/search/tv', {
    params: { api_key: API_KEY, query },
  })

  // Normalise TV results to match movie result shape
  return response.data.results.map((show) => ({
    ...show,
    title: show.name,
    release_date: show.first_air_date,
  }))
}

export const getSeriesDetails = async (tmdbId) => {
  const response = await tmdb.get(`/tv/${tmdbId}`, {
    params: {
      api_key: API_KEY,
      append_to_response: 'credits,videos',
    },
  })

  const data = response.data

  // Normalise to match movie details shape so MovieDetails works for both
  return {
    ...data,
    title: data.name,
    release_date: data.first_air_date,
    runtime: data.episode_run_time?.[0] || null,
    genres: data.genres,
  }
}

export const getSeriesCredits = async (seriesId) => {
  const response = await tmdb.get(`/tv/${seriesId}/credits`, {
    params: { api_key: API_KEY },
  })

  return response.data
}

// ── UNIVERSAL DETAILS (used by MovieDetails modal) ───

export const getDetails = async (tmdbId, type = 'movie') => {
  if (type === 'series') return getSeriesDetails(tmdbId)

  // For type 'movie', try movie endpoint first, fall back to TV
  try {
    const data = await getMovieDetails(tmdbId)
    // TMDB returns success even for wrong type sometimes — check for a title
    if (data && (data.title || data.name)) return data
    return getSeriesDetails(tmdbId)
  } catch {
    // Movie endpoint failed — try TV
    return getSeriesDetails(tmdbId)
  }
}