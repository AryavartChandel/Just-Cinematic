import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getDetails } from '../services/tmdbService'
import { getMovies, updateMovie } from '../services/movieService'

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original'
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500'

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

function MovieDetails({ tmdbId, type = 'movie', onClose }) {
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dbMovie, setDbMovie] = useState(null)
  const [review, setReview] = useState('')
  const [notes, setNotes] = useState('')
  const [personalRating, setPersonalRating] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [watchedMonth, setWatchedMonth] = useState('')
  const [watchedYear, setWatchedYear] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getDetails(tmdbId, type)
        setMovie(data)

        const results = await getMovies({ search: '' })
        const match = results.find(
          (m) => String(m.tmdbId) === String(tmdbId)
        )
        if (match) {
          setDbMovie(match)
          setReview(match.review || '')
          setNotes(match.notes || '')
          setPersonalRating(match.personalRating || '')

          if (match.watchedAt) {
            const d = new Date(match.watchedAt)
            setWatchedMonth(String(d.getMonth()))
            setWatchedYear(String(d.getFullYear()))
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tmdbId, type])

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleSave = async () => {
    if (!dbMovie) return
    try {
      setSaving(true)

      const payload = { review, notes, personalRating }

      if (watchedYear !== '' && watchedMonth !== '') {
        payload.watchedAt = new Date(Number(watchedYear), Number(watchedMonth), 1).toISOString()
      } else if (watchedYear !== '') {
        payload.watchedAt = new Date(Number(watchedYear), 0, 1).toISOString()
      }

      await updateMovie(dbMovie._id, payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error(error)
      alert('Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  const trailer = movie?.videos?.results?.find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer'
  )
  const director = movie?.credits?.crew?.find((p) => p.job === 'Director')

  const formatWatchedAt = () => {
    if (watchedYear === '') return null
    if (watchedMonth === '') return watchedYear
    return `${MONTHS[Number(watchedMonth)]} ${watchedYear}`
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div className="my-auto w-full max-w-4xl py-8">
        <div
          className="relative w-full rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* CLOSE */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
          >
            ×
          </button>

          {loading && (
            <div className="py-20 text-center text-zinc-500">Loading...</div>
          )}

          {!loading && !movie && (
            <div className="py-20 text-center text-red-400">Not found</div>
          )}

          {!loading && movie && (
            <div className="space-y-8">
              {/* BACKDROP */}
              <div className="relative overflow-hidden rounded-t-3xl">
                <img
                  src={`${BACKDROP_BASE}${movie.backdrop_path}`}
                  alt={movie.title}
                  className="h-64 w-full object-cover lg:h-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                <div className="absolute bottom-0 left-0 flex w-full items-end gap-6 p-6">
                  <img
                    src={`${POSTER_BASE}${movie.poster_path}`}
                    alt={movie.title}
                    className="hidden w-32 rounded-xl shadow-2xl lg:block"
                  />
                  <div className="space-y-2">
                    <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
                      {movie.release_date?.split('-')[0]}
                    </p>
                    <h1 className="text-3xl font-black text-white lg:text-5xl">
                      {movie.title}
                    </h1>
                  </div>
                </div>
              </div>

              {/* BODY */}
              <div className="space-y-6 px-6 pb-8">
                {/* GENRES */}
                <div className="flex flex-wrap gap-2">
                  {movie.genres?.map((genre) => (
                    <span key={genre.id} className="rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-bold text-zinc-300">
                      {genre.name}
                    </span>
                  ))}
                </div>

                {/* META */}
                <div className="flex flex-wrap gap-6 text-sm text-zinc-400">
                  <p>⭐ TMDB: <span className="font-bold text-white">{movie.vote_average}</span></p>
                  {movie.runtime && (
                    <p>🎬 Runtime: <span className="font-bold text-white">{movie.runtime} min</span></p>
                  )}
                  {director && (
                    <p>🎥 Director: <span className="font-bold text-white">{director.name}</span></p>
                  )}
                  {personalRating && (
                    <p>🏆 My Verdict: <span className={`font-bold ${
                      personalRating === 'Masterpiece' ? 'text-amber-400' :
                      personalRating === 'Great'       ? 'text-emerald-400' :
                      personalRating === 'Good'        ? 'text-sky-400' :
                      personalRating === 'Timepass'    ? 'text-orange-400' :
                      personalRating === 'Skip'        ? 'text-red-400' : 'text-zinc-300'
                    }`}>{personalRating}</span></p>
                  )}
                  {formatWatchedAt() && (
                    <p>📅 Watched: <span className="font-bold text-emerald-400">{formatWatchedAt()}</span></p>
                  )}
                </div>

                {/* OVERVIEW */}
                <p className="leading-relaxed text-zinc-300">{movie.overview}</p>

                {/* PERSONAL NOTES */}
                {dbMovie && dbMovie.watched ? (
                  <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">My Notes</p>

                    {/* VERDICT + WATCHED ON — side by side */}
                    <div className="flex items-start justify-between gap-4">

                      {/* VERDICT LEFT */}
                      <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-[0.2em] text-zinc-600">My Verdict</label>
                        <div className="flex flex-wrap gap-2">
                          {VERDICTS.map(({ label, active, inactive }) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => setPersonalRating(personalRating === label ? '' : label)}
                              className={`rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-150 ${
                                personalRating === label
                                  ? `${active} scale-105`
                                  : inactive
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* WATCHED ON RIGHT */}
                      <div className="space-y-1.5 shrink-0">
                        <label className="text-xs uppercase tracking-[0.2em] text-zinc-600">Watched On</label>
                        <div className="flex gap-1.5">
                          <select
                            value={watchedMonth}
                            onChange={(e) => setWatchedMonth(e.target.value)}
                            className="h-8 rounded-lg border border-zinc-800 bg-zinc-950 px-2 text-xs text-white outline-none transition focus:border-amber-400"
                          >
                            <option value="">Month</option>
                            {MONTHS.map((m, i) => (
                              <option key={m} value={i}>{m}</option>
                            ))}
                          </select>
                          <select
                            value={watchedYear}
                            onChange={(e) => setWatchedYear(e.target.value)}
                            className="h-8 w-24 rounded-lg border border-zinc-800 bg-zinc-950 px-2 text-xs text-white outline-none transition focus:border-amber-400"
                          >
                            <option value="">Year</option>
                            {YEARS.filter((y) => y >= 2003).map((y) => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                    </div>

                    {/* REVIEW */}
                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-[0.2em] text-zinc-600">Review</label>
                      <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="What did you think? Write your review..."
                        rows={4}
                        className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm leading-relaxed text-white outline-none transition placeholder:text-zinc-700 focus:border-amber-400"
                      />
                    </div>

                    {/* QUICK NOTES */}
                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-[0.2em] text-zinc-600">Quick Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Quotes, observations, things to remember..."
                        rows={2}
                        className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm leading-relaxed text-white outline-none transition placeholder:text-zinc-700 focus:border-amber-400"
                      />
                    </div>

                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={`rounded-xl px-6 py-2.5 text-xs font-bold uppercase tracking-[0.2em] transition ${
                        saved
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-400 text-black hover:bg-amber-300'
                      }`}
                    >
                      {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Notes'}
                    </button>
                  </div>
                ) : null}

                {/* CAST */}
                <div className="space-y-3">
                  <h2 className="text-xl font-black text-white">Cast</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {movie.credits?.cast?.slice(0, 8).map((actor) => (
                      <div key={actor.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                        <p className="font-bold text-white">{actor.name}</p>
                        <p className="mt-1 text-sm text-zinc-500">{actor.character}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TRAILER */}
                {trailer && (
                  <div className="space-y-3">
                    <h2 className="text-xl font-black text-white">Trailer</h2>
                    <div className="overflow-hidden rounded-2xl border border-zinc-800">
                      <iframe
                        width="100%"
                        height="400"
                        src={`https://www.youtube.com/embed/${trailer.key}`}
                        title="Trailer"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default MovieDetails