const express = require('express')
const {
  createMovie,
  deleteMovie,
  getMovieById,
  getMovies,
  updateMovie,
} = require('../controllers/movieController')

const router = express.Router()

router.route('/').get(getMovies).post(createMovie)
router.route('/:id').get(getMovieById).patch(updateMovie).delete(deleteMovie)

module.exports = router
