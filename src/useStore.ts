import { create } from 'zustand'

export type Task = {
  id: string
  title: string
  notes?: string
  status?: 'Backlog' | 'In Progress' | 'Done'
  list?: string
  important?: boolean
  urgent?: boolean
  createdAt: string
  completedAt?: string
  // Accumulated elapsed seconds for the task timer
  timerSeconds?: number
  timerRunning?: boolean
  timerStartedAt?: string
}

export type TaskConnection = {
  id: string
  sourceId: string
  targetId: string
  label?: string
  type?: 'dependency' | 'related' | 'blocks'
}

export type NodePosition = {
  id: string
  x: number
  y: number
}

type Store = {
  tasks: Task[]
  connections: TaskConnection[]
  nodePositions: NodePosition[]
  notes: string
  addTask: (input: { title: string; list?: string }) => void
  toggleDone: (id: string) => void
  moveTo: (id: string, status: NonNullable<Task['status']>) => void
  deleteTask: (id: string) => void
  updateTitle: (id: string, title: string) => void
  updateList: (id: string, list: string) => void
  toggleImportant: (id: string) => void
  toggleUrgent: (id: string) => void
  startTimer: (id: string) => void
  pauseTimer: (id: string) => void
  resetTimer: (id: string, seconds?: number) => void
  addConnection: (sourceId: string, targetId: string, type?: TaskConnection['type']) => void
  removeConnection: (connectionId: string) => void
  updateConnectionType: (connectionId: string, type: TaskConnection['type']) => void
  updateNodePosition: (nodeId: string, x: number, y: number) => void
  clearNodePositions: () => void
  updateNotes: (notes: string) => void
}

const STORAGE_KEY = 'trackerx:v1'
const CONNECTIONS_KEY = 'trackerx:connections:v1'
const POSITIONS_KEY = 'trackerx:positions:v1'
const NOTES_KEY = 'trackerx:notes:v1'

function load(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) as any[] : []
    // migrate older tasks to have required fields
    return parsed.map((t: any) => {
      const s = t?.status as string | undefined
      const normalizedStatus: NonNullable<Task['status']> = (s === 'Backlog' || s === 'In Progress' || s === 'Done') ? s : 'Backlog'
              return {
          id: t?.id ?? crypto.randomUUID(),
          title: String(t?.title ?? ''),
          notes: t?.notes,
          status: normalizedStatus,
          list: t?.list ?? 'General',
          important: t?.important ?? false,
          urgent: t?.urgent ?? false,
          createdAt: t?.createdAt ?? new Date().toISOString(),
          completedAt: t?.completedAt,
          // For older versions that used countdown, default to 0 accumulated seconds
          timerSeconds: typeof t?.timerSeconds === 'number' ? Math.max(0, t.timerSeconds) : 0,
          timerRunning: t?.timerRunning ?? false,
          timerStartedAt: t?.timerStartedAt,
        } as Task
    })
  } catch {
    return []
  }
}

function loadConnections(): TaskConnection[] {
  try {
    const raw = localStorage.getItem(CONNECTIONS_KEY)
    const parsed = raw ? JSON.parse(raw) as any[] : []
    return parsed.map((c: any) => ({
      id: c?.id ?? crypto.randomUUID(),
      sourceId: String(c?.sourceId ?? ''),
      targetId: String(c?.targetId ?? ''),
      label: c?.label,
      type: c?.type ?? 'related'
    }))
  } catch {
    return []
  }
}

function loadNodePositions(): NodePosition[] {
  try {
    const raw = localStorage.getItem(POSITIONS_KEY)
    const parsed = raw ? JSON.parse(raw) as any[] : []
    return parsed.map((p: any) => ({
      id: String(p?.id ?? ''),
      x: typeof p?.x === 'number' ? p.x : 0,
      y: typeof p?.y === 'number' ? p.y : 0
    }))
  } catch {
    return []
  }
}

function save(tasks: Task[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)) } catch {}
}

function saveConnections(connections: TaskConnection[]) {
  try { localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections)) } catch {}
}

function saveNodePositions(positions: NodePosition[]) {
  try { localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions)) } catch {}
}

function loadNotes(): string {
  try {
    return localStorage.getItem(NOTES_KEY) || ''
  } catch {
    return ''
  }
}

function saveNotes(notes: string) {
  try { localStorage.setItem(NOTES_KEY, notes) } catch {}
}

export const useStore = create<Store>((set, get) => ({
  tasks: load(),
  connections: loadConnections(),
  nodePositions: loadNodePositions(),
  notes: loadNotes(),
  addTask: ({ title, list }) => set(state => {
    const task: Task = {
      id: crypto.randomUUID(),
      title,
      createdAt: new Date().toISOString(),
      status: 'Backlog',
      list: (list && list.trim()) ? list.trim() : 'General',
      important: false,
      urgent: false,
      timerSeconds: 0,
      timerRunning: false,
      timerStartedAt: undefined
    }
    const tasks = [task, ...state.tasks]
    save(tasks)
    return { tasks }
  }),
  toggleDone: (id) => set(state => {
    const now = Date.now()
    const tasks = state.tasks.map(t => {
      if (t.id !== id) return t
      let added = 0
      if (t.timerRunning && t.timerStartedAt) {
        const started = Date.parse(t.timerStartedAt)
        added = Math.max(0, Math.floor((now - started) / 1000))
      }
      const newCompletedAt = t.completedAt ? undefined : new Date().toISOString()
      const newStatus = t.completedAt ? t.status : 'Done'
      return {
        ...t,
        completedAt: newCompletedAt,
        status: newStatus,
        timerSeconds: Math.max(0, (t.timerSeconds ?? 0) + added),
        timerRunning: false,
        timerStartedAt: undefined
      }
    })
    save(tasks)
    return { tasks }
  }),
  moveTo: (id, status) => set(state => {
    const now = Date.now()
    const tasks = state.tasks.map(t => {
      if (t.id !== id) return t
      if (status === 'Done') {
        let added = 0
        if (t.timerRunning && t.timerStartedAt) {
          const started = Date.parse(t.timerStartedAt)
          added = Math.max(0, Math.floor((now - started) / 1000))
        }
        return {
          ...t,
          status,
          completedAt: t.completedAt ?? new Date().toISOString(),
          timerSeconds: Math.max(0, (t.timerSeconds ?? 0) + added),
          timerRunning: false,
          timerStartedAt: undefined
        }
      } else {
        return { ...t, status, completedAt: undefined }
      }
    })
    save(tasks)
    return { tasks }
  }),
  deleteTask: (id) => set(state => {
    const tasks = state.tasks.filter(t => t.id !== id)
    save(tasks)
    return { tasks }
  }),
  updateTitle: (id, title) => set(state => {
    const trimmed = title.trim()
    if (!trimmed) return { tasks: state.tasks }
    const tasks = state.tasks.map(t => t.id === id ? { ...t, title: trimmed } : t)
    save(tasks)
    return { tasks }
  }),
  updateList: (id, list) => set(state => {
    const trimmed = list.trim() || 'General'
    const tasks = state.tasks.map(t => t.id === id ? { ...t, list: trimmed } : t)
    save(tasks)
    return { tasks }
  }),
  toggleImportant: (id) => set(state => {
    const tasks = state.tasks.map(t => t.id === id ? { ...t, important: !t.important } : t)
    save(tasks)
    return { tasks }
  }),
  toggleUrgent: (id) => set(state => {
    const tasks = state.tasks.map(t => t.id === id ? { ...t, urgent: !t.urgent } : t)
    save(tasks)
    return { tasks }
  }),
  startTimer: (id) => set(state => {
    const nowIso = new Date().toISOString()
    const tasks = state.tasks.map(t => t.id === id && !t.timerRunning
      ? { ...t, timerRunning: true, timerStartedAt: nowIso }
      : t)
    save(tasks)
    return { tasks }
  }),
  pauseTimer: (id) => set(state => {
    const now = Date.now()
    const tasks = state.tasks.map(t => {
      if (t.id !== id) return t
      if (!t.timerRunning || !t.timerStartedAt) return { ...t, timerRunning: false, timerStartedAt: undefined }
      const started = Date.parse(t.timerStartedAt)
      const elapsed = Math.max(0, Math.floor((now - started) / 1000))
      const total = Math.max(0, (t.timerSeconds ?? 0) + elapsed)
      return { ...t, timerSeconds: total, timerRunning: false, timerStartedAt: undefined }
    })
    save(tasks)
    return { tasks }
  }),
  resetTimer: (id, seconds = 0) => set(state => {
    const tasks = state.tasks.map(t => t.id === id ? { ...t, timerSeconds: seconds, timerRunning: false, timerStartedAt: undefined } : t)
    save(tasks)
    return { tasks }
  }),
  addConnection: (sourceId, targetId, type = 'related') => set(state => {
    // Prevent duplicate connections
    const exists = state.connections.some(c => 
      (c.sourceId === sourceId && c.targetId === targetId) || 
      (c.sourceId === targetId && c.targetId === sourceId)
    )
    if (exists || sourceId === targetId) return state

    const connection: TaskConnection = {
      id: crypto.randomUUID(),
      sourceId,
      targetId,
      type
    }
    const connections = [...state.connections, connection]
    saveConnections(connections)
    return { connections }
  }),
  removeConnection: (connectionId) => set(state => {
    const connections = state.connections.filter(c => c.id !== connectionId)
    saveConnections(connections)
    return { connections }
  }),
  updateConnectionType: (connectionId, type) => set(state => {
    const connections = state.connections.map(c => 
      c.id === connectionId ? { ...c, type } : c
    )
    saveConnections(connections)
    return { connections }
  }),
  updateNodePosition: (nodeId, x, y) => set(state => {
    const existing = state.nodePositions.find(p => p.id === nodeId)
    let nodePositions: NodePosition[]
    
    if (existing) {
      nodePositions = state.nodePositions.map(p => 
        p.id === nodeId ? { ...p, x, y } : p
      )
    } else {
      nodePositions = [...state.nodePositions, { id: nodeId, x, y }]
    }
    
    saveNodePositions(nodePositions)
    return { nodePositions }
  }),
  clearNodePositions: () => set(state => {
    const nodePositions: NodePosition[] = []
    saveNodePositions(nodePositions)
    return { nodePositions }
  }),
  updateNotes: (notes) => set(state => {
    saveNotes(notes)
    return { notes }
  })
}))


