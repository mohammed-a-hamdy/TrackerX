import { useMemo, useState } from 'react'
import { useStore } from '../useStore'
import { TaskTimer } from './FocusTimer'
import { Checkbox } from './Checkbox'

export function ListView() {
  const addTask = useStore(s => s.addTask)
  const toggleDone = useStore(s => s.toggleDone)
  const deleteTask = useStore(s => s.deleteTask)
  const tasks = useStore(s => s.tasks)
  const [input, setInput] = useState('')
  const [list, setList] = useState('')

  const onAdd = () => {
    if (!input.trim()) return
    addTask({ title: input.trim(), list: list.trim() || 'General' })
    setInput('')
    setList('')
  }

  const grouped = useMemo(() => {
    const map: Record<string, typeof tasks> = {}
    for (const t of tasks) {
      const key = t.list || 'General'
      if (!map[key]) map[key] = []
      map[key].push(t)
    }
    return map
  }, [tasks])

  const existingLists = Object.keys(grouped)

  return (
    <section className="list">
      <div className="add">
        <input
          placeholder="Quick add..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onAdd()}
        />
        <input list="lists" placeholder="List" value={list} onChange={e => setList(e.target.value)} onKeyDown={e => e.key === 'Enter' && onAdd()} />
        <datalist id="lists">
          {existingLists.map(l => (<option key={l} value={l} />))}
        </datalist>
        <button onClick={onAdd}>Add</button>
      </div>
      {Object.keys(grouped).sort().map(listName => (
        <div key={listName} style={{ marginTop: 12 }}>
          <h3 style={{ margin: '6px 0 8px', color: 'var(--muted)', fontSize: 14 }}>{listName}</h3>
          <ul>
            {grouped[listName].map(t => (
              <li key={t.id}>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 24px 1fr auto', alignItems: 'center', gap: 8 }}>
                  <div>
                    <button title="Delete" onClick={() => { if (confirm('Delete this task?')) deleteTask(t.id) }}>Delete</button>
                  </div>
                  <div>
                    <Checkbox checked={!!t.completedAt} onChange={() => toggleDone(t.id)} label={t.title} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={t.completedAt ? 'done' : ''}>{t.title}</span>
                    <span className="badge">{t.status ?? 'Backlog'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TaskTimer taskId={t.id} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}


