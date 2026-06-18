import { useEffect, useState } from 'react'
import { createMovie } from '../services/movieService'
import { useAdmin } from '../context/AdminContext'

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
const LOCK_MSG = '🔒 You are not worthy enough Thor..'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 40 }, (_, i) => currentYear - i)

const VERDICTS = [
  { label: 'Masterpiece', active: 'border-amber-400 bg-amber-400/20 text-amber-300', inactive: 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-amber-400/50 hover:text-amber-400' },
  { label: 'Great',       active: 'border-emerald-400 bg-emerald-400/20 text-emerald-300', inactive: 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-emerald-400/50 hover:text-emerald-400' },
  { label: 'Good',        active: 'border-sky-400 bg-sky-400/20 text-sky-300', inactive: 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-sky-400/50 hover:text-sky-400' },
  { label: 'Timepass',    active: 'border-orange-400 bg-orange-400/20 text-orange-300', inactive: 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-orange-400/50 hover:text-orange-400' },
  { label: 'Skip',        active: 'border-red-400 bg-red-400/20 text-red-300', inactive: 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-red-400/50 hover:text-red-400' },
]

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
  const { isAdmin } = useAdmin()
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedItem, setSelectedItem] = useState(false)
  const [watchedMonth, setWatchedMonth] = useState('')
  const [watchedYear, setWatchedYear] = useState('')

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

  const handleTypeToggle = (type) => {
    setForm({ ...initialForm, type })
    setQuery('')
    setResults([])
    setSelectedItem(false)
    setWatchedMonth('')
    setWatchedYear('')
  }

  const handleStatusChange = (status) => {
    setForm((prev) => ({
      ...prev,
      watched: status === 'watched',
      watchlist: status === 'watchlist',
      personalRating: status === 'watchlist' ? '' : prev.personalRating,
    }))
    if (status === 'watchlist') {
      setWatchedMonth('')
      setWatchedYear('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isAdmin) { alert(LOCK_MSG); return }
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

      // Set watchedAt if watched and date provided
      if (form.watched && watchedYear) {
        payload.watchedAt = new Date(
          Number(watchedYear),
          watchedMonth !== '' ? Number(watchedMonth) : 0,
          1
        ).toISOString()
      }

      const createdMovie = await createMovie(payload)
      onMovieAdded(createdMovie)
      setForm(initialForm)
      setQuery('')
      setResults([])
      setSelectedItem(false)
      setWatchedMonth('')
      setWatchedYear('')
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
          className="h-14 rounded-xl border border-zinc-800 bg-black px-5 text-white outline-none transition focus:border-amber-400 md:col-span-2"
        />
      </div>

      {/* POSTER */}
      {form.poster && (
        <img src={form.poster} alt="Poster" className="h-64 rounded-xl object-cover shadow-2xl" />
      )}

      {/* STATUS */}
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

      {/* WATCHED ONLY — verdict + watched on, visible only when watched */}
      {form.watched && (
        <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all">

          {/* VERDICT */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">My Verdict</p>
            <div className="flex flex-wrap gap-2">
              {VERDICTS.map(({ label, active, inactive }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      personalRating: prev.personalRating === label ? '' : label,
                    }))
                  }
                  className={`rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-150 ${
                    form.personalRating === label ? `${active} scale-105` : inactive
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* WATCHED ON */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">Watched On</p>
            <div className="flex gap-2">
              <select
                value={watchedMonth}
                onChange={(e) => setWatchedMonth(e.target.value)}
                className="h-10 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition focus:border-amber-400"
              >
                <option value="">Month (optional)</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
              <select
                value={watchedYear}
                onChange={(e) => setWatchedYear(e.target.value)}
                className="h-10 w-32 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition focus:border-amber-400"
              >
                <option value="">Year</option>
                {YEARS.filter((y) => y >= 2003).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT — blocked for non-admins */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full rounded-xl px-5 py-4 font-black uppercase tracking-wider transition ${
          isAdmin
            ? 'bg-amber-400 text-black hover:bg-amber-300'
            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
        }`}
      >
        {loading
          ? `Adding ${isMovie ? 'Movie' : 'Series'}...`
          : isAdmin
            ? `Add ${isMovie ? 'Movie' : 'Series'}`
            : `🔒 Add ${isMovie ? 'Movie' : 'Series'}`}
      </button>
    </form>
  )
}

export default AddMovieForm