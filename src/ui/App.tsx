import { useEffect, useState } from 'react'
import { BoardView } from './BoardView'
import { ListView } from './ListView'
import { Reports } from './Reports'
import logo from '../logo.png'
import quotes from './quotes.json'

export function App() {
  const [view, setView] = useState<'list' | 'board' | 'reports'>('list')
  const [quote, setQuote] = useState<string>('')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('trackerx:theme')
    return stored === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    const local = quotes as Array<{ q: string; a: string }>
    if (!Array.isArray(local) || local.length === 0) return
    const picked = local[Math.floor(Math.random() * local.length)]
    if (picked?.q && picked?.a) setQuote(`“${picked.q}” ~ ${picked.a}`)
  }, [])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('trackerx:theme', theme) } catch {}
  }, [theme])

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="brand">
          <img src={logo} alt="TrackerX logo" className="logo" />
          <span>TracKer</span>
        </h1>
        {quote && <div className="quote" title={quote}>{quote}</div>}
        <nav>
          <button className={view==='list'? 'active':''} onClick={() => setView('list')}>List</button>
          <button className={view==='board'? 'active':''} onClick={() => setView('board')}>Board</button>
          <button className={view==='reports'? 'active':''} onClick={() => setView('reports')}>Report</button>
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} title="Toggle theme" aria-label="Toggle theme">
            {theme === 'dark' ? (
              // Show full moon icon when in dark theme
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
              </svg>
            ) : (
              // Show crescent moon icon when in light theme
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </nav>
      </header>
      <main>
        {view === 'list' && <ListView />}
        {view === 'board' && <BoardView />}
        {view === 'reports' && <Reports />}
      </main>
    </div>
  )
}


