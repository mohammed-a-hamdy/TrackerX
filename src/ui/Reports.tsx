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

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatWeekStart(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
  return `Week of ${date.toLocaleDateString('en-US', options)}`
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

  const weeklyData = useMemo(() => {
    const weekMap: Record<string, { tasks: typeof taskTimes, totalMs: number, weekStart: Date }> = {}
    
    for (const task of tasks) {
      const createdAt = new Date(task.createdAt)
      const weekStart = getWeekStart(createdAt)
      const weekKey = weekStart.toISOString()
      
      if (!weekMap[weekKey]) {
        weekMap[weekKey] = {
          tasks: [],
          totalMs: 0,
          weekStart
        }
      }
      
      const taskTime = taskTimes.find(tt => tt.id === task.id)
      if (taskTime) {
        weekMap[weekKey].tasks.push(taskTime)
        weekMap[weekKey].totalMs += taskTime.ms
      }
    }
    
    // Convert to array and sort by week start date (most recent first)
    return Object.values(weekMap).sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime())
  }, [tasks, taskTimes])

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

      <div className="panel" style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
        <h3 style={{ margin: '0 0 8px', color: 'var(--muted)', fontSize: 14 }}>By Week Created</h3>
        {weeklyData.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--muted)', fontStyle: 'italic' }}>No tasks found</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {weeklyData.map((week, index) => (
              <div key={week.weekStart.toISOString()} style={{ 
                borderBottom: index < weeklyData.length - 1 ? '1px solid var(--border)' : 'none',
                paddingBottom: index < weeklyData.length - 1 ? 12 : 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                    {formatWeekStart(week.weekStart)}
                  </h4>
                  <strong style={{ color: 'var(--accent)' }}>{formatMs(week.totalMs)}</strong>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {week.tasks.map(task => (
                    <li key={task.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      fontSize: 13,
                      color: 'var(--muted)'
                    }}>
                      <span>
                        <span className="badge" style={{ marginRight: 6, fontSize: 11 }}>{task.list}</span>
                        {task.title}
                      </span>
                      <span>{formatMs(task.ms)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}


