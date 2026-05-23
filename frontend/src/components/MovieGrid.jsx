import MovieCard from './MovieCard'

function MovieGrid({ movies, onDelete, onStatusChange, onSelect }) {
  if (!movies.length) {
    return (
      <div className="empty-state border border-dashed border-zinc-800 px-6 py-16 text-center">
        <h2 className="text-lg font-semibold text-white">No titles found</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Try a different filter or add your first movie.
        </p>
      </div>
    )
  }

  return (
    <section className="grid gap-3 grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-4"
>
      {movies.map((movie, index) => (
        <MovieCard
          key={movie._id}
          movie={movie}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onSelect={onSelect}
          animationIndex={index}
        />
      ))}
    </section>
  )
}

export default MovieGrid