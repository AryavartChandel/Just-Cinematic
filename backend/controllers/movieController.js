const Movie = require('../models/Movie')

const buildMovieQuery = (query) => {
  const filters = {}

  if (query.status === 'watched')
    filters.watched = true

  if (query.status === 'watchlist')
    filters.watchlist = true

  if (query.year)
    filters.year = Number(query.year)

  if (query.genre)
    filters.genre = { $in: [query.genre] }

  if (query.actor)
    filters.actors = { $in: [query.actor] }

  if (query.search) {
    filters.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { actors: { $regex: query.search, $options: 'i' } },
      { genre: { $regex: query.search, $options: 'i' } },
    ]
  }

  return filters
}

const getMovies = async (req, res) => {
  try {
    const sortMap = {
      title: { title: 1 },
      year: { year: -1 },
      imdbRating: { imdbRating: -1 },
      personalRating: { personalRating: -1 },
      watchedAt: { watchedAt: -1 },
      createdAt: { createdAt: -1 },
    }

    const movies = await Movie.find(
      buildMovieQuery(req.query)
    ).sort(
      sortMap[req.query.sort] || sortMap.createdAt
    )

    res.json(movies)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id)
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' })
    }
    res.json(movie)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const createMovie = async (req, res) => {
  try {
    const movie = await Movie.create(req.body)
    res.status(201).json(movie)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

const updateMovie = async (req, res) => {
  try {
    const body = { ...req.body }

    // When toggled to watched with no watchedAt sent, stamp now as fallback
    if (body.watched === true && !body.watchedAt) {
      const existing = await Movie.findById(req.params.id)
      if (existing && !existing.watchedAt) {
        body.watchedAt = new Date()
      }
    }

    // When moved back to watchlist, clear watchedAt
    if (body.watched === false) {
      body.watchedAt = null
    }

    const updatedMovie = await Movie.findByIdAndUpdate(
      req.params.id,
      body,
      { new: true, runValidators: true }
    )

    if (!updatedMovie) {
      return res.status(404).json({ message: 'Movie not found' })
    }

    res.json(updatedMovie)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id)
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' })
    }
    res.json({ message: 'Movie deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
}