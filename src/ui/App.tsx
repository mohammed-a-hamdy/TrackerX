import { useState } from 'react'
import { BoardView } from './BoardView'
import { ListView } from './ListView'
import { Reports } from './Reports'
import logo from '../logo.png'

export function App() {
  const [view, setView] = useState<'list' | 'board' | 'reports'>('list')
  return (
    <div className="app">
      <header className="topbar">
        <h1 className="brand">
          <img src={logo} alt="TrackerX logo" className="logo" />
          <span>TracKer</span>
        </h1>
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


