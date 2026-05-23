const express = require('express')

const {
  createMovie,
  deleteMovie,
  getMovieById,
  getMovies,
  updateMovie,
  searchMovies,
  getMovieDetails,
} = require('../controllers/movieController')

const router = express.Router()

router.route('/').get(getMovies).post(createMovie)

// TMDB
router.get('/search', searchMovies)
router.get('/tmdb/:id', getMovieDetails)

// CRUD
router
  .route('/:id')
  .get(getMovieById)
  .patch(updateMovie)
  .delete(deleteMovie)

module.exports = router