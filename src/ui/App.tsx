import { useEffect, useState } from 'react'
import { BoardView } from './BoardView'
import { ListView } from './ListView'
import { Reports } from './Reports'
import logo from '../logo.png'

export function App() {
  const [view, setView] = useState<'list' | 'board' | 'reports'>('list')
  const [quote, setQuote] = useState<string>('')

  useEffect(() => {
    async function loadQuote() {
      const pick = (arr: Array<{ q: string; a: string }>) => {
        if (!Array.isArray(arr) || arr.length === 0) return
        const picked = arr[Math.floor(Math.random() * arr.length)]
        if (picked?.q && picked?.a) setQuote(`“${picked.q}” ~ ${picked.a}`)
      }
      try {
        // Try proxied path to avoid CORS in dev
        const res = await fetch('/api/zenquotes/api/quotes/2')
        if (res.ok) {
          const data = await res.json() as Array<{ q: string; a: string }>
          pick(data)
          return
        }
      } catch {}
      try {
        // Fallback: direct fetch (may fail on CORS in dev but work in production hosting)
        const res = await fetch('https://zenquotes.io/api/quotes/2')
        if (res.ok) {
          const data = await res.json() as Array<{ q: string; a: string }>
          pick(data)
        }
      } catch {}
    }
    loadQuote()
  }, [])
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


