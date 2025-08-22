import { useMemo, useState } from 'react'
import { useStore } from '../useStore'
import { TaskTimer } from './FocusTimer'
import { Checkbox } from './Checkbox'

export function ListView() {
  const addTask = useStore(s => s.addTask)
  const toggleDone = useStore(s => s.toggleDone)
  const deleteTask = useStore(s => s.deleteTask)
  const updateTitle = useStore(s => s.updateTitle)
  const updateList = useStore(s => s.updateList)
  const toggleImportant = useStore(s => s.toggleImportant)
  const toggleUrgent = useStore(s => s.toggleUrgent)
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

  const daysOld = (iso?: string) => {
    if (!iso) return 0
    const created = Date.parse(iso)
    if (Number.isNaN(created)) return 0
    const diff = Date.now() - created
    return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)))
  }

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
                    <button title="Delete" aria-label="Delete" onClick={() => { if (confirm('Delete this task?')) deleteTask(t.id) }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div>
                    <Checkbox checked={!!t.completedAt} onChange={() => toggleDone(t.id)} label={t.title} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                      className={t.completedAt ? 'done' : ''}
                      style={{ background: 'transparent', border: 'none', padding: 0, color: 'inherit', minWidth: 0 }}
                    />
                    <button
                      className="badge"
                      title="Edit list"
                      onClick={() => {
                        const next = prompt('Set list name', t.list || 'General')
                        if (next != null) updateList(t.id, next)
                      }}
                    >{t.list || 'General'}</button>
                    <span className="badge">{t.status ?? 'Backlog'}</span>
                    <span className="badge" title={`Created ${new Date(t.createdAt).toLocaleDateString()}`}>{daysOld(t.createdAt)}d</span>
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


