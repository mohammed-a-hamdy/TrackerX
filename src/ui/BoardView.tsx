import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../useStore'

const COLUMNS = ['Backlog', 'In Progress', 'Done'] as const
type Column = typeof COLUMNS[number]

export function BoardView() {
  const tasks = useStore(s => s.tasks)
  const moveTo = useStore(s => s.moveTo)
  const addTask = useStore(s => s.addTask)
  const deleteTask = useStore(s => s.deleteTask)
  const updateTitle = useStore(s => s.updateTitle)
  const updateList = useStore(s => s.updateList)
  const toggleImportant = useStore(s => s.toggleImportant)
  const toggleUrgent = useStore(s => s.toggleUrgent)
  const startTimer = useStore(s => s.startTimer)
  const pauseTimer = useStore(s => s.pauseTimer)
  const [title, setTitle] = useState('')
  const [list, setList] = useState('')
  const [tick, setTick] = useState(0)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<Column | null>(null)

  const grouped = useMemo(() => {
    const map: Record<Column, typeof tasks> = {
      'Backlog': [], 'In Progress': [], 'Done': []
    }
    for (const t of tasks) {
      const col = (t.status ?? 'Backlog') as Column
      if (map[col]) map[col].push(t)
    }
    return map
  }, [tasks])

  const onAdd = () => {
    if (!title.trim()) return
    addTask({ title: title.trim(), list: list.trim() || 'General' })
    setTitle('')
    setList('')
  }

  const onDragStart = (e: React.DragEvent<HTMLLIElement>, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId)
  }
  const onDrop = (e: any, col: Column) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) moveTo(id, col)
  }
  const onDragOver = (e: any) => {
    e.preventDefault()
  }



  const existingLists = Array.from(new Set(tasks.map(t => t.list ?? 'General')))

  // Update the board every second while any timer is running
  useEffect(() => {
    const anyRunning = tasks.some(t => t.timerRunning)
    if (!anyRunning) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [tasks])

  const format = (totalSeconds: number) => {
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
    const s = String(totalSeconds % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  const computeTotalSeconds = (t: { timerSeconds?: number; timerRunning?: boolean; timerStartedAt?: string }) => {
    const base = t.timerSeconds ?? 0
    if (t.timerRunning && t.timerStartedAt) {
      const started = Date.parse(t.timerStartedAt)
      const elapsed = Math.max(0, Math.floor((Date.now() - started) / 1000))
      return Math.max(0, base + elapsed)
    }
    return Math.max(0, base)
  }

  return (
    <section className="board">
      <div className="board-container">
        {COLUMNS.map((col, index) => (
          <div 
            key={col} 
            className={`col ${dragOverColumn === col ? 'drag-over' : ''}`} 
            onDragOver={onDragOver} 
            onDrop={e => onDrop(e, col)}
          >
          <h3>{col}</h3>
          {col === 'Backlog' && (
            <div className="add" style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key==='Enter' && onAdd()} />
              <input list="board-lists" placeholder="List" value={list} onChange={e => setList(e.target.value)} onKeyDown={e => e.key==='Enter' && onAdd()} />
              <datalist id="board-lists">
                {existingLists.map(l => (<option key={l} value={l} />))}
              </datalist>
              <button onClick={onAdd}>Add</button>
            </div>
          )}
          <ul>
            {grouped[col].map(t => (
              <li 
                key={t.id} 
                className={`card status-${col.replace(' ', '').toLowerCase()} ${draggedTaskId === t.id ? 'dragging' : ''}`} 
                draggable 
                onDragStart={e => onDragStart(e, t.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    <button title="Delete" aria-label="Delete" onClick={() => { if (confirm('Delete this task?')) deleteTask(t.id) }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button 
                        title={t.important ? "Remove important" : "Mark important"}
                        onClick={() => toggleImportant(t.id)}
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          padding: 0, 
                          color: t.important ? '#ef4444' : 'var(--muted)',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {t.important ? '!' : '○'}
                      </button>
                      <button 
                        title={t.urgent ? "Remove urgent" : "Mark urgent"}
                        onClick={() => toggleUrgent(t.id)}
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          padding: 0, 
                          color: t.urgent ? '#f97316' : 'var(--muted)',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {t.urgent ? '!!' : '○○'}
                      </button>
                    </div>
                    <input
                      value={t.title}
                      onChange={e => updateTitle(t.id, e.target.value)}
                      onBlur={e => updateTitle(t.id, e.target.value)}
                      className={`title ${t.completedAt ? 'done' : ''}`}
                      style={{ background: 'transparent', border: 'none', padding: 0, color: 'inherit', minWidth: 0, width: '100%' }}
                    />
                  </div>
                  <div className="meta" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      className="badge"
                      title="Edit list"
                      onClick={() => {
                        const next = prompt('Set list name', t.list || 'General')
                        if (next != null) updateList(t.id, next)
                      }}
                    >{t.list || 'General'}</button>
                    <button onClick={() => (t.timerRunning ? pauseTimer(t.id) : startTimer(t.id))}>
                      {t.timerRunning ? format(computeTotalSeconds(t)) : 'Start'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        ))}
      </div>
    </section>
  )
}


