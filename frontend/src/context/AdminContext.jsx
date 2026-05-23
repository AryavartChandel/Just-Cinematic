import { createContext, useContext, useState } from 'react'

const AdminContext = createContext(null)

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'potatotopato'

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const unlock = () => {
    if (input === ADMIN_PASSWORD) {
      setIsAdmin(true)
      setShowPrompt(false)
      setInput('')
      setError(false)
    } else {
      setError(true)
      setInput('')
    }
  }

  const lock = () => setIsAdmin(false)

  return (
    <AdminContext.Provider value={{ isAdmin, lock, openPrompt: () => { setShowPrompt(true); setError(false); setInput('') } }}>
      {children}

      {/* ADMIN PROMPT MODAL */}
      {showPrompt && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowPrompt(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Cinephile</p>
              <h2 className="mt-1 text-xl font-black text-white">Aryavart lvl Access</h2>
            </div>

            <input
              type="password"
              placeholder="Enter password..."
              value={input}
              autoFocus
              onChange={(e) => { setInput(e.target.value); setError(false) }}
              onKeyDown={(e) => e.key === 'Enter' && unlock()}
              className={`h-12 w-full rounded-xl border bg-black px-4 text-white outline-none transition ${
                error ? 'border-red-500' : 'border-zinc-800 focus:border-amber-400'
              }`}
            />

            {error && (
              <p className="text-xs text-red-400">Wrong password. Try again.</p>
            )}

            <button
              onClick={unlock}
              className="w-full rounded-xl bg-amber-400 py-3 text-xs font-black uppercase tracking-wider text-black hover:bg-amber-300 transition"
            >
              Unlock
            </button>
          </div>
        </div>
      )}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => useContext(AdminContext)