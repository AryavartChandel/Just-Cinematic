import { Route, Routes, useLocation } from 'react-router-dom'

import Watchlist from './pages/Watchlist'
import Watched from './pages/Watched'
import MovieDetails from './pages/MovieDetails'

function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <main className="mx-auto max-w-[1700px] px-8 py-8">
        <div key={location.pathname} className="page-transition">
          <Routes location={location}>
            <Route path="/"              element={<Watchlist    key="watchlist" />} />
            <Route path="/watched"       element={<Watched      key="watched"   />} />
            <Route path="/movie/:tmdbId" element={<MovieDetails               />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App