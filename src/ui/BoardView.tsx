import { useMemo, useState } from 'react'
import { useStore } from '../useStore'

const COLUMNS = ['Backlog', 'In Progress', 'Done'] as const
type Column = typeof COLUMNS[number]

export function BoardView() {
  const tasks = useStore(s => s.tasks)
  const moveTo = useStore(s => s.moveTo)
  const addTask = useStore(s => s.addTask)
  const [title, setTitle] = useState('')
  const [list, setList] = useState('')

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

  return (
    <section className="board">
      {COLUMNS.map(col => (
        <div key={col} className="col" onDragOver={onDragOver} onDrop={e => onDrop(e, col)}>
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
              <li key={t.id} className="card" draggable onDragStart={e => onDragStart(e, t.id)}>
                <div className="title">{t.title}</div>
                <div className="meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge">{t.list || 'General'}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}


