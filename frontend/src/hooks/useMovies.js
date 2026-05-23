import { useEffect, useMemo, useState } from 'react'
import { getMovies } from '../services/movieService'

const defaultFilters = {
  search: '',
  genre: 'all',
  type: 'all',
  actor: 'all',
  sortDir: 'desc',
}

const getDefaultSort = (mode) => {
  if (mode === 'watched') return 'watchedAt'
  return 'createdAt'
}

const sortMovies = (movies, sort, sortDir) => {
  const sorted = [...movies]
  const dir = sortDir === 'asc' ? 1 : -1

  if (sort === 'title') return sorted.sort((a, b) => dir * a.title.localeCompare(b.title))
  if (sort === 'year') return sorted.sort((a, b) => dir * ((a.year || 0) - (b.year || 0)))
  if (sort === 'imdbRating') return sorted.sort((a, b) => dir * ((a.imdbRating || 0) - (b.imdbRating || 0)))
  if (sort === 'watchedAt') return sorted.sort((a, b) => dir * (new Date(a.watchedAt || 0) - new Date(b.watchedAt || 0)))
  if (sort === 'personalRating') {
    const order = { Masterpiece: 5, Great: 4, Good: 3, Timepass: 2, Skip: 1, '': 0 }
    return sorted.sort((a, b) => dir * ((order[a.personalRating] || 0) - (order[b.personalRating] || 0)))
  }
  // createdAt
  return sorted.sort((a, b) => dir * (new Date(a.createdAt || 0) - new Date(b.createdAt || 0)))
}

export const useMovies = (initialStatus = 'all') => {
  const [movies, setMovies] = useState([])
  const [source, setSource] = useState('sample')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    ...defaultFilters,
    sort: getDefaultSort(initialStatus),
    status: initialStatus,
  })

  useEffect(() => {
    
    const loadMovies = async () => {
      setLoading(true)
      try {
        const data = await getMovies()
        setMovies(data)
        setSource('api')
        setError('')
      } catch {
        const { sampleMovies } = await import('../data/sampleMovies')
        setMovies(sampleMovies)
        setSource('sample')
        setError('Using sample data until the backend and MongoDB are connected.')
      } finally {
        setLoading(false)
      }
    }
    loadMovies()
  }, [])

  const normalizeGenre = (
  genre
) => {
  const map = {
    'Action & Adventure':
      'Action',

    'Sci-Fi & Fantasy':
      'Fantasy',

    'TV Movie':
      'Drama',
  }

  return map[genre] || genre
}

const genres = useMemo(() => {
  const relevantMovies = movies.filter((m) => {
    if (initialStatus === 'watchlist' && !m.watchlist) return false
    if (initialStatus === 'watched' && !m.watched) return false
    if (filters.type && filters.type !== 'all' && m.type !== filters.type) return false
    return true
  })
  return [
    ...new Set(relevantMovies.flatMap((m) => (m.genre || []).map(normalizeGenre))),
  ].sort()
}, [movies, initialStatus, filters.type])

  const actors = useMemo(
    () => [...new Set(movies.flatMap((m) => m.actors || []))].sort(),
    [movies],
  )

  const filteredMovies = useMemo(() => {
    const search = filters.search.trim().toLowerCase()

    const filtered = movies.filter((movie) => {
      if (initialStatus === 'watchlist' && !movie.watchlist) return false
      if (initialStatus === 'watched' && !movie.watched) return false

      // Type filter
      if (filters.type && filters.type !== 'all') {
        if (movie.type !== filters.type) return false
      }

      const matchesSearch =
        !search ||
        [movie.title, ...(movie.genre || []), ...(movie.actors || [])]
          .join(' ')
          .toLowerCase()
          .includes(search)

      const matchesGenre =
        filters.genre === 'all' || movie.genre?.includes(filters.genre)

      const matchesActor =
        filters.actor === 'all' || movie.actors?.includes(filters.actor)

      return matchesSearch && matchesGenre && matchesActor
    })

    return sortMovies(filtered, filters.sort, filters.sortDir)
  }, [movies, filters, initialStatus])

  const stats = useMemo(
    () => ({
      total: movies.length,
      watched: movies.filter((m) => m.watched).length,
      watchlist: movies.filter((m) => m.watchlist).length,
    }),
    [movies],
  )

  const addMovie = (movie) => setMovies((prev) => [movie, ...prev])
  const removeMovie = (id) => setMovies((prev) => prev.filter((m) => m._id !== id))
  const updateMovie = (id, updates) =>
    setMovies((prev) => prev.map((m) => (m._id === id ? { ...m, ...updates } : m)))

  return {
    actors,
    error,
    filteredMovies,
    filters,
    genres,
    loading,
    setFilters,
    source,
    stats,
    addMovie,
    removeMovie,
    updateMovie,
  }
}