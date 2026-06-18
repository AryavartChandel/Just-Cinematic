import { deleteMovie, toggleWatchStatus } from '../services/movieService'
import { genreColors, defaultGenreTheme } from '../utils/genreColors'
import { useAdmin } from '../context/AdminContext'

const genreHex = {
  Action:             '#ef4444',
  Adventure:          '#10b981',
  Animation:          '#e879f9',
  Comedy:             '#facc15',
  Crime:              '#64748b',
  Documentary:        '#38bdf8',
  Drama:              '#f1b347',
  Family:             '#bafc88',
  Fantasy:            '#8b5cf6',
  History:            '#dba27b',
  Horror:             '#991b1b',
  Music:              '#fb7185',
  Mystery:            '#7c3aed',
  Romance:            '#ec4899',
  'Science Fiction':  '#22d3ee',
  'Sci-Fi':           '#22d3ee',
  Thriller:           '#ea580c',
  'TV Movie':         '#14b8a6',
  War:                '#4d7c0f',
  Western:            '#92400e',
}

const defaultHex = '#52525b'

const getAccentStyle = (genres) => {
  if (!genres || genres.length === 0) {
    return { background: `linear-gradient(to right, ${defaultHex}, #27272a)` }
  }
  const colors = genres.slice(0, 3).map((g) => genreHex[g] || defaultHex)
  if (colors.length === 1) return { background: `linear-gradient(to right, ${colors[0]}, ${colors[0]}99)` }
  if (colors.length === 2) return { background: `linear-gradient(to right, ${colors[0]}, ${colors[1]})` }
  return { background: `linear-gradient(to right, ${colors[0]}, ${colors[1]}, ${colors[2]})` }
}

const LOCK_MSG = "🔒 Only Crazy Level Cinephile could do this..."

function MovieCard({ movie, onDelete, onStatusChange, onSelect, animationIndex = 0 }) {
  const { isAdmin } = useAdmin()

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!isAdmin) { alert(LOCK_MSG); return }
    const confirmed = window.confirm(`Delete "${movie.title}"?`)
    if (!confirmed) return
    try {
      await deleteMovie(movie._id)
      onDelete(movie._id)
    } catch (error) {
      console.error(error)
      alert('Failed to delete movie')
    }
  }

  const handleStatusToggle = async (e) => {
    e.stopPropagation()
    if (!isAdmin) { alert(LOCK_MSG); return }
    try {
      const updates = movie.watched
        ? { watched: false, watchlist: true }
        : { watched: true, watchlist: false }
      await toggleWatchStatus(movie._id, updates)
      onStatusChange?.(movie._id, updates)
    } catch (error) {
      console.error(error)
      alert('Failed to update status')
    }
  }

  const delay = `${(animationIndex % 16) * 0.05}s`

  return (
    <article
      onClick={() => movie.tmdbId && onSelect?.(movie.tmdbId, movie.type || 'movie')}
      className="card-animate group flex flex-col cursor-pointer overflow-hidden rounded-xl border-x border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-black transition-all duration-300 hover:-translate-y-2 hover:border-zinc-600 hover:shadow-card-glow"
      style={{ animationDelay: delay }}
    >
      <div className="h-1 w-full" style={getAccentStyle(movie.genre)} />

      <div className="flex flex-col flex-1 p-4">

        {/* TYPE + YEAR */}
        <div className="flex items-center justify-between mb-3">
          <span className="rounded border border-zinc-800 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {movie.type || 'movie'}
          </span>
          <span className="text-xs tracking-[0.12em] text-zinc-600">
            {movie.year || 'TBA'}
          </span>
        </div>

        {/* TITLE */}
        <h2 className="line-clamp-2 text-base sm:text-xl font-bold uppercase leading-[1] tracking-[-0.04em] text-white transition-colors duration-200 group-hover:text-amber-300 mb-3">
          {movie.title}
        </h2>

        {/* GENRES */}
        <div className="flex flex-wrap gap-2 min-h-[3.5rem] mb-3 content-start">
          {(movie.genre || []).slice(0, 3).map((genre, i) => (
            <span
              key={genre}
              className={`genre-badge-animate h-fit rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                (genreColors[genre] || defaultGenreTheme).badge
              }`}
              style={{ animationDelay: `${parseFloat(delay) + i * 0.06}s` }}
            >
              {genre}
            </span>
          ))}
        </div>

        {/* RATINGS */}
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded bg-amber-400 px-2 py-[3px] text-[10px] font-black uppercase tracking-wide text-black">
            IMDb
          </span>
          <span className="text-sm sm:text-base font-semibold text-white">
            {movie.imdbRating ? Number(movie.imdbRating).toFixed(1): '-'}
          </span>
          <span className="text-xs text-zinc-600">/10</span>
        </div>

        {/* VERDICT — only on watched */}
        {movie.watched && (
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.08em] sm:tracking-[0.14em] text-zinc-500 mb-3">
            My Verdict:{' '}
            <span className="font-semibold text-zinc-300">
              {movie.personalRating || 'None'}
            </span>
          </div>
        )}

        {/* ACTORS */}
        <p className="line-clamp-2 min-h-[2.5rem] text-[10px] sm:text-xs leading-relaxed tracking-[0.02em] sm:tracking-[0.04em] text-zinc-500 mb-3">
          {(movie.actors || []).join(', ') || 'No actors added'}
        </p>

        {/* ACTIONS — always visible, locked for non-admins */}
        <div className="mt-auto space-y-2">
          <button
            onClick={handleStatusToggle}
            className={`w-full rounded-lg border px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.10em] sm:tracking-[0.14em] transition-all duration-200 active:scale-[0.97] ${
              isAdmin
                ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300'
                : 'border-zinc-800/50 bg-zinc-900/50 text-zinc-600 cursor-not-allowed'
            }`}
          >
            {movie.watched ? 'Rewatch' : 'Mark as Watched'}
          </button>

          <button
            onClick={handleDelete}
            className={`w-full rounded-lg border px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.10em] sm:tracking-[0.14em] transition-all duration-200 active:scale-[0.97] ${
              isAdmin
                ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300'
                : 'border-zinc-800/50 bg-zinc-900/50 text-zinc-600 cursor-not-allowed'
            }`}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  )
}

export default MovieCard