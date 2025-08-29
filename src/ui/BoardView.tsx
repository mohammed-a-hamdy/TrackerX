import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useStore } from '../useStore'

// Custom hook for auto-resizing textareas
const useAutoResize = (value: string) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [])
  
  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])
  
  return { textareaRef, adjustHeight }
}

// Auto-resizing textarea component for task titles
const TaskTitleTextarea = ({ value, onChange, onBlur, className, style }: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void
  className: string
  style: React.CSSProperties
}) => {
  const { textareaRef, adjustHeight } = useAutoResize(value)
  
  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={e => {
        onChange(e)
        adjustHeight()
      }}
      onBlur={onBlur}
      className={className}
      rows={1}
      style={style}
    />
  )
}

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
  const resetTimer = useStore(s => s.resetTimer)
  const [title, setTitle] = useState('')
  const [list, setList] = useState('')
  const [tick, setTick] = useState(0)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  
  // Auto-resize hook for the title textarea
  const { textareaRef: titleTextareaRef, adjustHeight: adjustTitleHeight } = useAutoResize(title)

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

  // Keep focus in sync with timers: if focused task stops, clear focus
  useEffect(() => {
    if (!focusedId) return
    const f = tasks.find(t => t.id === focusedId)
    if (!f || !f.timerRunning) setFocusedId(null)
  }, [tasks, focusedId])

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

  const daysOld = (iso?: string) => {
    if (!iso) return 0
    const created = Date.parse(iso)
    if (Number.isNaN(created)) return 0
    const diff = Date.now() - created
    return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)))
  }

  // GIFs to show at the bottom of the board
  const gifs: string[] = useMemo(() => ([
    'https://gifdb.com/images/high/rick-and-morty-run-the-jewels-41vqa88b3f85wpa3.webp',
    'https://imgs.search.brave.com/_NfXXlux4IqexVWERGrItlLWlsTM-nHl_Fuiv3mOaXs/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9naWZk/Yi5jb20vaW1hZ2Vz/L2hpZ2gvcmljay1h/bmQtbW9ydHktZG9u/LXQtaGF0ZS1wbGF5/ZXItdDdxMWZkZzV3/OHc0bjByZS5naWY.gif',
    'https://gifdb.com/images/high/rick-and-morty-i-always-slay-kxx4kbbefsgy03x6.webp',
    'https://gifdb.com/images/high/rick-and-morty-riggity-wrecked-son-5oyxyrmavk26f4v3.webp',
    'https://imgs.search.brave.com/PcGEMWl04rSPJI8jhfMjR5PIg1erfAzrtmurxMQCJk4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRpYTAuZ2lwaHkuY29tL21lZGlhL3YxLlkybGtQVGM1TUdJM05qRXhjM0oyT1hKMGFYZzFNbk0zT1RGMmNqbHhjRGx3TUc5clpYRnNNWFYyTkRVM09EaHdZWFZ3T1NabGNEMTJNVjluYVdaelgzTmxZWEpqYUNaamREMW4vUVlSanc2SnowanlyMUFuUFc5L2dpcGh5LmdpZg.gif'
  ]), [])

  const pickedGif = useMemo(() => {
    if (!gifs.length) return ''
    const index = Math.floor(Math.random() * gifs.length)
    return gifs[index]
  }, [gifs])

  return (
    <>
      <section className="board">
        {COLUMNS.map(col => (
          <div key={col} className="col" onDragOver={onDragOver} onDrop={e => onDrop(e, col)}>
            <h3>{col}</h3>
            {col === 'Backlog' && (
              <div className="add" style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                <textarea 
                  ref={titleTextareaRef}
                  placeholder="Task title" 
                  value={title} 
                  onChange={e => {
                    setTitle(e.target.value);
                    adjustTitleHeight();
                  }} 
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onAdd();
                    }
                  }}
                  style={{ flex: '2 1 auto', minWidth: '120px', maxHeight: '80px' }}
                  rows={1}
                />
                <input 
                  list="board-lists" 
                  placeholder="List" 
                  value={list} 
                  onChange={e => setList(e.target.value)} 
                  onKeyDown={e => e.key==='Enter' && onAdd()}
                  style={{ flex: '1 1 auto', minWidth: '80px' }}
                />
                <datalist id="board-lists">
                  {existingLists.map(l => (<option key={l} value={l} />))}
                </datalist>
                <button onClick={onAdd}>Add</button>
              </div>
            )}
            <ul>
              {grouped[col].map(t => (
                <li key={t.id} className={`card status-${col.replace(' ', '').toLowerCase()} ${focusedId ? (focusedId === t.id ? 'is-focused' : 'is-dimmed') : ''}`} draggable onDragStart={e => onDragStart(e, t.id)}>
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
                      <TaskTitleTextarea
                        value={t.title}
                        onChange={e => updateTitle(t.id, e.target.value)}
                        onBlur={e => updateTitle(t.id, e.target.value)}
                        className={`title ${t.completedAt ? 'done' : ''}`}
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          padding: 0, 
                          color: 'inherit', 
                          minWidth: 0, 
                          width: '100%',
                          flex: '1 1 auto',
                          overflow: 'hidden',
                          resize: 'none',
                          minHeight: 'auto',
                          maxHeight: '60px',
                          fontFamily: 'inherit',
                          fontSize: 'inherit',
                          lineHeight: '1.4'
                        }}
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
                      <span className="badge" title={`Created ${new Date(t.createdAt).toLocaleDateString()}`}>{daysOld(t.createdAt)}d</span>
                      <button onClick={() => {
                        if (t.timerRunning) {
                          pauseTimer(t.id)
                          setFocusedId(null)
                        } else {
                          startTimer(t.id)
                          setFocusedId(t.id)
                        }
                      }}>
                        {t.timerRunning ? format(computeTotalSeconds(t)) : 'Start'}
                      </button>
                      <button title="Reset timer" onClick={() => { resetTimer(t.id); if (focusedId === t.id) setFocusedId(null) }}>Reset</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      {focusedId && (
        <div className="focus-overlay" aria-hidden="true" />
      )}
      {pickedGif && (
        <div className="gif-section">
          <img src={pickedGif} alt="Board fun gif" loading="lazy" />
        </div>
      )}
    </>
  )
}


