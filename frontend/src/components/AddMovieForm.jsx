import { useEffect, useState } from 'react'
import { createMovie } from '../services/movieService'



import {
  searchMovies,
  getMovieDetails,
  getMovieCredits,
  searchSeries,
  getSeriesDetails,
} from '../services/tmdbService'

import { GENRES } from '../data/genres'
import { genreColors, defaultGenreTheme } from '../utils/genreColors'

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'

const initialForm = {
  tmdbId: '',
  title: '',
  year: '',
  type: 'movie',
  genre: [],
  actors: '',
  poster: '',
  imdbRating: '',
  personalRating: '',
  watched: false,
  watchlist: true,
}

function AddMovieForm({ onMovieAdded }) {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedItem, setSelectedItem] = useState(false)

  const isMovie = form.type === 'movie'

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!query.trim() || selectedItem) {
        setResults([])
        return
      }
      try {
        const items = isMovie
          ? await searchMovies(query)
          : await searchSeries(query)
        setResults(items.slice(0, 6))
      } catch (error) {
        console.error(error)
      }
    }, 400)
    return () => clearTimeout(timeout)
  }, [query, selectedItem, isMovie])

  const selectItem = async (item) => {
    try {
      let genres = []
      let topActors = []
      const tmdbId = item.id
      const title = item.title || item.name
      const year = (item.release_date || item.first_air_date || '').split('-')[0]
      const poster = item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : ''
      const rating = item.vote_average || ''

      if (isMovie) {
        const details = await getMovieDetails(item.id)
        const credits = await getMovieCredits(item.id)
        genres = details.genres?.map((g) => g.name) || []
        topActors = credits.cast?.slice(0, 5).map((a) => a.name) || []
      } else {
        const details = await getSeriesDetails(item.id)
        genres = details.genres?.map((g) => g.name) || []
        topActors = details.credits?.cast?.slice(0, 5).map((a) => a.name) || []
      }

      setForm((prev) => ({
        ...prev,
        tmdbId,
        title,
        year,
        poster,
        imdbRating: rating,
        genre: genres,
        actors: topActors.join(', '),
      }))

      setSelectedItem(true)
      setQuery(title)
      setResults([])
    } catch (error) {
      console.error(error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Switching type clears everything
  const handleTypeToggle = (type) => {
    setForm({ ...initialForm, type })
    setQuery('')
    setResults([])
    setSelectedItem(false)
  }

  // Status is mutually exclusive — watched XOR watchlist
  const handleStatusChange = (status) => {
    setForm((prev) => ({
      ...prev,
      watched: status === 'watched',
      watchlist: status === 'watchlist',
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const payload = {
        ...form,
        year: form.year ? Number(form.year) : null,
        imdbRating: form.imdbRating ? Number(form.imdbRating) : null,
        personalRating: form.personalRating || '',
        genre: form.genre,
        actors: form.actors.split(',').map((a) => a.trim()).filter(Boolean),
      }
      const createdMovie = await createMovie(payload)
      onMovieAdded(createdMovie)
      setForm(initialForm)
      setQuery('')
      setResults([])
      setSelectedItem(false)
    } catch (error) {
      console.error(error.response?.data || error)
      alert('Failed to add title')
    } finally {
      setLoading(false)
    }
  }

  const statusOption = form.watched ? 'watched' : 'watchlist'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* HEADER */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">
          Add New Title
        </p>
        <h2 className="mt-2 text-3xl font-black text-white">Search TMDB</h2>
      </div>

      {/* TYPE TOGGLE */}
      <div className="flex gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
        <button
          type="button"
          onClick={() => handleTypeToggle('movie')}
          className={`flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-[0.18em] transition ${
            isMovie ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          🎬 Movie
        </button>
        <button
          type="button"
          onClick={() => handleTypeToggle('series')}
          className={`flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-[0.18em] transition ${
            !isMovie ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          📺 Series
        </button>
      </div>

      {/* TMDB SEARCH */}
      <div className="relative">
        <input
          type="text"
          placeholder={isMovie ? 'Search movie title...' : 'Search series title...'}
          value={query}
          onChange={(e) => {
            setSelectedItem(false)
            setQuery(e.target.value)
          }}
          className="h-14 w-full rounded-xl border border-zinc-800 bg-black px-5 text-white outline-none transition focus:border-amber-400"
        />

        {results.length > 0 && (
          <div className="absolute z-50 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            {results.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => selectItem(item)}
                className="flex w-full items-center gap-4 border-b border-zinc-900 p-4 text-left transition hover:bg-zinc-900"
              >
                {item.poster_path ? (
                  <img
                    src={`${IMAGE_BASE_URL}${item.poster_path}`}
                    alt={item.title || item.name}
                    className="h-20 w-14 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-14 items-center justify-center rounded bg-zinc-800 text-xs text-zinc-500">
                    No Image
                  </div>
                )}
                <div>
                  <p className="font-bold text-white">{item.title || item.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {(item.release_date || item.first_air_date || '').split('-')[0] || 'Unknown Year'}
                  </p>
                  <p className="mt-1 text-xs text-amber-400">
                    TMDB Rating: {item.vote_average}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FORM FIELDS */}
      <div className="grid gap-5 md:grid-cols-2">
        <input
          type="text"
          name="title"
          placeholder={isMovie ? 'Movie title' : 'Series title'}
          value={form.title}
          onChange={handleChange}
          required
          className="h-14 rounded-xl border border-zinc-800 bg-black px-5 text-white outline-none transition focus:border-amber-400"
        />

        <input
          type="number"
          name="year"
          placeholder="Release year"
          value={form.year}
          onChange={handleChange}
          className="h-14 rounded-xl border border-zinc-800 bg-black px-5 text-white outline-none transition focus:border-amber-400"
        />

        {/* GENRES */}
        <div className="space-y-3 md:col-span-2">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">Genres</p>
          <div className="flex flex-wrap gap-3">
            {GENRES.map((genre) => {
              const active = form.genre.includes(genre)
              const theme = genreColors[genre] || defaultGenreTheme
              return (
                <button
                  type="button"
                  key={genre}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      genre: active
                        ? prev.genre.filter((g) => g !== genre)
                        : [...prev.genre, genre],
                    }))
                  }
                  className={`rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-150 ${
                    active
                      ? `${theme.badge} ${theme.border} scale-105`
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  {genre}
                </button>
              )
            })}
          </div>
        </div>

        <input
          type="text"
          name="actors"
          placeholder="Actors (comma separated)"
          value={form.actors}
          onChange={handleChange}
          className="h-14 rounded-xl border border-zinc-800 bg-black px-5 text-white outline-none transition focus:border-amber-400 md:col-span-2"
        />

        <input
          type="number"
          step="0.1"
          name="imdbRating"
          placeholder="IMDb Rating"
          value={form.imdbRating}
          onChange={handleChange}
          className="h-14 rounded-xl border border-zinc-800 bg-black px-5 text-white outline-none transition focus:border-amber-400"
        />

        <select
          name="personalRating"
          value={form.personalRating}
          onChange={handleChange}
          disabled={!form.watched}
  className="h-14 rounded-xl border border-zinc-800 bg-black px-5 text-white outline-none transition-all duration-300 focus:border-amber-400 disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <option value="">Select Your Verdict</option>
          <option value="Masterpiece">Masterpiece</option>
          <option value="Great">Great</option>
          <option value="Good">Good</option>
          <option value="Timepass">Timepass</option>
          <option value="Skip">Skip</option>
        </select>
      </div>

      {/* POSTER */}
      {form.poster && (
        <img src={form.poster} alt="Poster" className="h-64 rounded-xl object-cover shadow-2xl" />
      )}

      {/* STATUS — mutually exclusive radio-style buttons */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">Status</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleStatusChange('watchlist')}
            className={`flex-1 rounded-xl border py-3 text-xs font-bold uppercase tracking-[0.15em] transition-all duration-200 ${
              statusOption === 'watchlist'
                ? 'border-sky-500 bg-sky-500/15 text-sky-300 scale-[1.02]'
                : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
            }`}
          >
            📋 Watchlist
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange('watched')}
            className={`flex-1 rounded-xl border py-3 text-xs font-bold uppercase tracking-[0.15em] transition-all duration-200 ${
              statusOption === 'watched'
                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 scale-[1.02]'
                : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
            }`}
          >
            ✅ Watched
          </button>
        </div>
      </div>

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-amber-400 px-5 py-4 font-black uppercase tracking-wider text-black transition hover:bg-amber-300"
      >
        {loading
          ? `Adding ${isMovie ? 'Movie' : 'Series'}...`
          : `Add ${isMovie ? 'Movie' : 'Series'}`}
      </button>
    </form>
  )
}

export default AddMovieForm