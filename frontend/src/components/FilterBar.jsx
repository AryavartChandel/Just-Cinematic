import {
  genreColors,
  defaultGenreTheme,
} from '../utils/genreColors'

const TYPE_OPTIONS = [
  {
    label: 'All',
    value: 'all',
  },
  {
    label: '🎬 Movies',
    value: 'movie',
  },
  {
    label: '📺 Series',
    value: 'series',
  },
]

const hoverThemes = {
  Action:
    'hover:bg-orange-500/15 hover:text-orange-200 hover:border-orange-500/30',

  Adventure:
    'hover:bg-emerald-500/15 hover:text-emerald-200 hover:border-emerald-500/30',

  Animation:
    'hover:bg-pink-500/15 hover:text-pink-200 hover:border-pink-500/30',

  Comedy:
    'hover:bg-yellow-500/15 hover:text-yellow-200 hover:border-yellow-500/30',

  Crime:
    'hover:bg-red-500/15 hover:text-red-200 hover:border-red-500/30',

  Drama:
    'hover:bg-blue-500/15 hover:text-blue-200 hover:border-blue-500/30',

  Fantasy:
    'hover:bg-fuchsia-500/15 hover:text-fuchsia-200 hover:border-fuchsia-500/30',

  Horror:
    'hover:bg-red-700/15 hover:text-red-300 hover:border-red-700/30',

  Romance:
    'hover:bg-pink-500/15 hover:text-pink-200 hover:border-pink-500/30',

  'Sci-Fi':
    'hover:bg-cyan-500/15 hover:text-cyan-200 hover:border-cyan-500/30',

  Thriller:
    'hover:bg-amber-500/15 hover:text-amber-200 hover:border-amber-500/30',

  War:
    'hover:bg-stone-500/15 hover:text-stone-200 hover:border-stone-500/30',
}

function FilterBar({
  filters,
  genres,
  onChange,
}) {
  return (
    <section className="space-y-3">
      {/* TYPE FILTER */}
      <div className="flex items-center gap-2">
        <p className="shrink-0 text-[10px] uppercase tracking-[0.4em] text-zinc-600">
          Type
        </p>

        <div className="flex gap-1.5">
          {TYPE_OPTIONS.map(
            ({ label, value }) => (
              <button
                key={value}
                onClick={() =>
                  onChange(
                    (prev) => ({
                      ...prev,
                      type: value,
                    })
                  )
                }
                className={`rounded-lg px-3 py-1 text-[10px] uppercase tracking-[0.15em] transition ${
                  (
                    filters.type ||
                    'all'
                  ) === value
                    ? 'bg-zinc-400 text-black'
                    : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white'
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>

      {/* GENRES */}
      <div className="flex flex-wrap items-center gap-2">
        <p className="shrink-0 text-[10px] uppercase tracking-[0.4em] text-zinc-600">
          Genres
        </p>

        <div className="flex flex-wrap gap-1.5">
          {/* ALL */}
          <button
            onClick={() =>
              onChange((prev) => ({
                ...prev,
                genre: 'all',
              }))
            }
            className={`rounded-lg border px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] transition ${
              filters.genre ===
              'all'
                ? 'border-transparent bg-amber-400 text-black'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white'
            }`}
          >
            All Genres
          </button>

          {/* GENRES */}
          {genres.map((genre) => {
            const theme =
              genreColors[
                genre
              ] ||
              defaultGenreTheme

            const isActive =
              filters.genre ===
              genre

            return (
              <button
                key={genre}
                onClick={() =>
                  onChange(
                    (prev) => ({
                      ...prev,
                      genre: prev.genre === genre ? 'all' : genre,
                    })
                  )
                }
                className={`rounded-lg border px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] transition duration-200 ${
                  isActive
                    ? `${theme.badge} border-transparent`
                    : `border-zinc-800 bg-zinc-900 text-zinc-400 ${
                        hoverThemes[
                          genre
                        ] ||
                        'hover:border-zinc-700 hover:text-white'
                      }`
                }`}
              >
                {genre}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FilterBar  