import { Route, Routes, useLocation } from 'react-router-dom'

import Watchlist from './pages/Watchlist'
import Watched from './pages/Watched'
import MovieDetails from './pages/MovieDetails'
import { AdminProvider, useAdmin } from './context/AdminContext'

function AdminToggle() {
  const { isAdmin, lock, openPrompt } = useAdmin()

  return (
    <button
      onClick={isAdmin ? lock : openPrompt}
      className={`fixed bottom-4 right-4 z-50 rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] transition border ${
        isAdmin
          ? 'border-amber-400/60 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
          : 'border-zinc-800 bg-zinc-900/80 text-zinc-600 hover:text-zinc-400'
      }`}
    >
      {isAdmin ? '🔓 Admin' : '🔒'}
    </button>
  )
}

function AppInner() {
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

      <AdminToggle />
    </div>
  )
}

function App() {
  return (
    <AdminProvider>
      <AppInner />
    </AdminProvider>
  )
}

export default App