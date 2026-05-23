const mongoose = require('mongoose')

const movieSchema = new mongoose.Schema(
  {
    tmdbId: Number,
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['movie', 'series'],
      default: 'movie',
    },
    year: Number,
    genre: [String],
    actors: [String],
    poster: String,
    imdbRating: {
      type: Number,
      min: 0,
      max: 10,
    },
    personalRating: String,
    watched: {
      type: Boolean,
      default: false,
    },
    watchlist: {
      type: Boolean,
      default: true,
    },
    watchedAt: {
      type: Date,
      default: null,
    },
    review: String,
    notes: String,
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model('Movie', movieSchema)