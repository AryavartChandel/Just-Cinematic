import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, Link } from 'react-router-dom'

import AddMovieForm from '../components/AddMovieForm'
import FilterBar from '../components/FilterBar'
import MovieGrid from '../components/MovieGrid'
import MovieDetails from '../pages/MovieDetails'

import { useMovies } from '../hooks/useMovies'
import { deleteMovie } from '../services/movieService'
import { genreColors, defaultGenreTheme } from '../utils/genreColors'

function CinemaPage({ mode = 'watchlist' }) {
  const navigate = useNavigate()
  const isWatchlist = mode === 'watchlist'
  const upcomingRef = useRef(null)

  const {
    error,
    filteredMovies,
    upcomingMovies,
    filters,
    genres,
    setFilters,
    source,
    stats,
    loading,
    addMovie,
    removeMovie,
    updateMovie,
  } = useMovies(mode)

  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState(null)

  const scrollToUpcoming = () => {
    upcomingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleDeleteUpcoming = async (id) => {
    if (!window.confirm('Remove this upcoming title?')) return
    try {
      await deleteMovie(id)
      removeMovie(id)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <section className="border-b border-zinc-900 pb-6">

        {/* TOP ROW */}
        <div className="flex flex-wrap items-center justify-between gap-3">

          {/* LEFT — logo + stats + tagline */}
          <div className="flex items-center gap-4 min-w-0">
            <Link
              to={isWatchlist ? '/' : '/watched'}
              className="text-3xl sm:text-4xl font-light uppercase tracking-[-0.06em] text-white leading-none hover:opacity-80 transition-opacity shrink-0"
            >
              WATCH
              <span className="text-amber-400">
                {isWatchlist ? 'LIST' : 'ED'}
              </span>
            </Link>

            <div className="h-7 w-px bg-zinc-800 shrink-0" />

            {/* STATS */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-center">
                <p className="text-base sm:text-lg font-light text-amber-400 leading-none">{stats.total}</p>
                <p className="mt-0.5 text-[7px] uppercase tracking-[0.25em] text-zinc-600">Total</p>
              </div>
              <div className="text-center">
                <p className="text-base sm:text-lg font-light text-zinc-300 leading-none">{stats.watched}</p>
                <p className="mt-0.5 text-[7px] uppercase tracking-[0.25em] text-zinc-600">Watched</p>
              </div>
              <div className="text-center">
                <p className="text-base sm:text-lg font-light text-amber-400 leading-none">{stats.watchlist}</p>
                <p className="mt-0.5 text-[7px] uppercase tracking-[0.25em] text-zinc-600">Watchlist</p>
              </div>
            </div>

            {/* TAGLINE — desktop only */}
            <div className="hidden xl:block h-7 w-px bg-zinc-800 shrink-0" />
            <div className="hidden xl:block min-w-0">
              <p className="text-sm font-light italic text-white leading-tight whitespace-nowrap">
                {isWatchlist
                  ? 'Every great film deserves a watchlist.'
                  : 'A life measured in films watched.'}
              </p>
              <p className="mt-0.5 text-[8px] uppercase tracking-[0.35em] text-zinc-600">
                Personal Cinema Archive
              </p>
            </div>
          </div>

          {/* RIGHT — controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search — hidden on very small, shown sm+ */}
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="hidden sm:block h-8 w-28 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-xs tracking-wide text-white outline-none transition focus:border-amber-400 focus:w-40"
            />

            <select
              value={filters.sort}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, sort: e.target.value }))
              }
              className="h-8 rounded-lg border border-zinc-800 bg-zinc-950 px-2 text-[10px] uppercase tracking-[0.1em] text-zinc-300 outline-none transition focus:border-amber-400"
            >
              <option value="title">A → Z</option>
              <option value="year">Year</option>
              <option value="imdbRating">IMDb</option>
              {isWatchlist
                ? <option value="createdAt">Date Added</option>
                : <option value="watchedAt">Watched On</option>
              }
            </select>

            <div className="hidden sm:block h-5 w-px bg-zinc-800" />

            <button
              onClick={() => navigate(isWatchlist ? '/watched' : '/')}
              className="h-8 rounded-lg border border-amber-400/40 bg-amber-400/5 px-3 text-[10px] uppercase tracking-[0.12em] text-amber-300 transition hover:border-amber-400 hover:bg-amber-400/10 hover:text-amber-200 whitespace-nowrap"
            >
              {isWatchlist ? 'See Watched' : 'See Watchlist'}
            </button>

            {isWatchlist && (
              <button
              onClick={() => setShowAddForm(true)}
              disabled={!isWatchlist}
              className={`h-8 rounded-lg bg-amber-400 px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-amber-300 whitespace-nowrap ${
                isWatchlist ? '' : 'invisible'
              }`}
            >
                + Add
              </button>
            )}
          </div>
        </div>

        {/* Search bar — mobile only, full width */}
        <div className="mt-3 sm:hidden">
          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-xs tracking-wide text-white outline-none transition focus:border-amber-400"
          />
        </div>

        {/* SOURCE STATUS */}
        <p className="mt-2 text-[9px] uppercase tracking-[0.3em] text-zinc-700">
          {source === 'api' ? 'Connected to The Movie Db' : error}
        </p>

        {/* FILTER BAR */}
        <div className="mt-5">
          <FilterBar
            filters={filters}
            genres={genres}
            onChange={setFilters}
            isWatchlist={isWatchlist}
            onUpcomingClick={scrollToUpcoming}
            upcomingCount={upcomingMovies?.length || 0}
          />
        </div>
      </section>

      {/* MAIN GRID */}
      {loading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-xl border-x border-b border-zinc-800 bg-zinc-900/50 animate-pulse"
              style={{ animationDelay: `${i * 0.05}s` }}
            />
          ))}
        </div>
      ) : (
        <MovieGrid
          movies={filteredMovies}
          onDelete={removeMovie}
          onStatusChange={updateMovie}
          onSelect={(tmdbId, type) => setSelectedMovie({ tmdbId, type })}
        />
      )}

      {/* UPCOMING SECTION */}
      {isWatchlist && (upcomingMovies?.length > 0) && (
        <section ref={upcomingRef} className="space-y-6 border-t border-zinc-900 pt-10">
          <div className="flex items-baseline gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600">On the horizon</p>
              <h2 className="mt-1 text-3xl font-light uppercase tracking-[-0.04em] text-white">
                Upcoming
                <span className="text-violet-400"> & Not Yet Released</span>
              </h2>
            </div>
            <span className="rounded-lg bg-violet-500/10 px-2.5 py-1 text-xs font-bold text-violet-400 border border-violet-500/20">
              {upcomingMovies.length}
            </span>
          </div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-4">
            {upcomingMovies.map((movie) => (
              <article
                key={movie._id}
                className="group flex flex-col overflow-hidden rounded-xl border-x border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-black"
              >
                <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-violet-700" />
                <div className="flex flex-col flex-1 p-4 gap-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded border border-violet-800/40 bg-violet-500/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                      {movie.type || 'movie'}
                    </span>
                    <span className="text-xs tracking-[0.12em] text-zinc-600">
                      {movie.year || 'TBA'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold uppercase leading-[1] tracking-[-0.04em] text-white">
                    {movie.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 min-h-[2rem] content-start">
                    {(movie.genre || []).slice(0, 3).map((genre) => (
                      <span
                        key={genre}
                        className={`h-fit rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                          (genreColors[genre] || defaultGenreTheme).badge
                        }`}
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                  {movie.director && (
                    <p className="text-xs text-zinc-500">
                      <span className="text-zinc-600 uppercase tracking-wider text-[9px]">Dir. </span>
                      {movie.director}
                    </p>
                  )}
                  {movie.actors?.length > 0 && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">
                      {movie.actors.join(', ')}
                    </p>
                  )}
                  <div className="mt-auto pt-2 flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-[0.25em] text-zinc-600">Expected</span>
                    <span className="text-xs font-semibold text-violet-400">
                      {movie.releaseMonth
                        ? `${movie.releaseMonth} ${movie.year || ''}`
                        : movie.year || 'TBA'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteUpcoming(movie._id)}
                    className="w-full rounded-lg border border-red-500/20 bg-transparent px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-400/60 transition hover:bg-red-500 hover:text-white hover:border-red-500"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* MOVIE DETAILS MODAL */}
      {selectedMovie && (
        <MovieDetails
          tmdbId={selectedMovie.tmdbId}
          type={selectedMovie.type}
          onClose={() => setSelectedMovie(null)}
        />
      )}

      {/* ADD MOVIE MODAL */}
      {showAddForm && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-5 backdrop-blur-sm"
          onClick={() => setShowAddForm(false)}
        >
          <div
            className="relative my-auto w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute right-4 top-3 text-xl text-zinc-500 transition hover:text-white"
            >
              ×
            </button>
            <AddMovieForm
              onMovieAdded={(movie) => {
                addMovie(movie)
                setShowAddForm(false)
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default CinemaPage