import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../useStore'

function formatMs(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts = [] as string[]
  if (hours) parts.push(`${hours}h`)
  if (minutes || hours) parts.push(`${minutes}m`)
  parts.push(`${seconds}s`)
  return parts.join(' ')
}

export function Reports() {
  const tasks = useStore(s => s.tasks)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const taskTimes = useMemo(() => {
    const arr = tasks.map(t => {
      const base = (t.timerSeconds ?? 0) * 1000
      const extra = (t.timerRunning && t.timerStartedAt) ? Math.max(0, now - Date.parse(t.timerStartedAt)) : 0
      return { id: t.id, title: t.title, list: t.list || 'General', ms: base + extra }
    })
    arr.sort((a, b) => b.ms - a.ms)
    return arr
  }, [tasks, now])

  const totalPerList = useMemo(() => {
    const map: Record<string, number> = {}
    for (const tt of taskTimes) {
      map[tt.list] = (map[tt.list] || 0) + tt.ms
    }
    return map
  }, [taskTimes])

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <div className="panel" style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
        <h3 style={{ margin: '0 0 8px', color: 'var(--muted)', fontSize: 14 }}>By Task</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {taskTimes.map(t => (
            <li key={t.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>
                <span className="badge" style={{ marginRight: 6 }}>{t.list}</span>
                {t.title}
              </span>
              <strong>{formatMs(t.ms)}</strong>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel" style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
        <h3 style={{ margin: '0 0 8px', color: 'var(--muted)', fontSize: 14 }}>By List</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.entries(totalPerList).map(([list, ms]) => (
            <li key={list} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{list}</span>
              <strong>{formatMs(ms)}</strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}


