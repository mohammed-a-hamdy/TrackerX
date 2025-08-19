import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../useStore'

function useInterval(callback: () => void, delay: number | null) {
  const saved = useRef(callback)
  useEffect(() => { saved.current = callback }, [callback])
  useEffect(() => {
    if (delay == null) return
    const id = setInterval(() => saved.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

export function TaskTimer({ taskId }: { taskId: string }) {
  const task = useStore(s => s.tasks.find(t => t.id === taskId))
  const start = useStore(s => s.startTimer)
  const pause = useStore(s => s.pauseTimer)
  const reset = useStore(s => s.resetTimer)

  const [tick, setTick] = useState(0)
  useInterval(() => setTick(t => t + 1), (task?.timerRunning ? 1000 : null))

  const total = useMemo(() => {
    if (!task) return 0
    const base = task.timerSeconds ?? 0
    if (task.timerRunning && task.timerStartedAt) {
      const started = Date.parse(task.timerStartedAt)
      const elapsed = Math.max(0, Math.floor((Date.now() - started) / 1000))
      return Math.max(0, base + elapsed)
    }
    return Math.max(0, base)
  }, [task, tick])

  const minutesPart = String(Math.floor(total / 60)).padStart(2, '0')
  const secondsPart = String(total % 60).padStart(2, '0')

  if (!task) return null

  return (
    <div className="timer" style={{ padding: 8 }}>
      <div className="time" style={{ fontSize: 14 }}>{minutesPart}:{secondsPart}</div>
      <div className="row">
        <button onClick={() => (task.timerRunning ? pause(task.id) : start(task.id))}>{task.timerRunning ? 'Pause' : 'Start'}</button>
        <button onClick={() => reset(task.id)}>Reset</button>
      </div>
    </div>
  )
}


