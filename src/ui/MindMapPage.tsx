import { useCallback, useMemo, useState, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  NodeTypes,
  Handle,
  Position,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useStore, Task, TaskConnection } from '../useStore'

// Inline styles to avoid CSS conflicts
const pageStyles = {
  container: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: '#f8f9fa',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    zIndex: 1000,
  },
  header: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '60px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e9ecef',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    zIndex: 10,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    color: '#212529',
  },
  backButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
  flowContainer: {
    position: 'absolute' as const,
    top: '60px',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: 'calc(100vh - 60px)',
  },
  controls: {
    position: 'absolute' as const,
    top: '80px',
    left: '20px',
    zIndex: 10,
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  controlPanel: {
    backgroundColor: 'white',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  select: {
    padding: '6px 10px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    backgroundColor: 'white',
    fontSize: '14px',
    cursor: 'pointer',
  },
  helpPanel: {
    position: 'absolute' as const,
    top: '80px',
    right: '20px',
    zIndex: 10,
    backgroundColor: 'white',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    padding: '16px',
    fontSize: '14px',
    maxWidth: '300px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  helpTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#212529',
  },
  helpList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  helpItem: {
    marginBottom: '6px',
    fontSize: '13px',
    color: '#495057',
  },
  emptyState: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center' as const,
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '8px',
    padding: '24px',
    zIndex: 20,
  },
}

// Custom Task Node Component with inline styles
const TaskNode = ({ data }: { data: { task: Task } }) => {
  const { task } = data
  const { toggleDone, toggleImportant, toggleUrgent } = useStore()

  const getStatusColor = () => {
    switch (task.status) {
      case 'Done': return { bg: '#d1e7dd', border: '#badbcc' }
      case 'In Progress': return { bg: '#cff4fc', border: '#b8daff' }
      case 'Backlog': return { bg: '#f8f9fa', border: '#dee2e6' }
      default: return { bg: '#f8f9fa', border: '#dee2e6' }
    }
  }

  const getPriorityIndicator = () => {
    if (task.important && task.urgent) return '🔴'
    if (task.important) return '🟡'
    if (task.urgent) return '🟠'
    return ''
  }

  const colors = getStatusColor()
  
  const nodeStyle = {
    padding: '12px',
    backgroundColor: colors.bg,
    border: `2px solid ${colors.border}`,
    borderRadius: '8px',
    minWidth: '200px',
    maxWidth: '300px',
    fontSize: '14px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  }

  const headerStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '8px',
  }

  const checkboxStyle = {
    width: '16px',
    height: '16px',
    borderRadius: '3px',
    border: '2px solid #6c757d',
    backgroundColor: task.completedAt ? '#28a745' : 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }

  const buttonStyle = {
    fontSize: '11px',
    padding: '2px 6px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    margin: '0 2px',
  }

  return (
    <div style={nodeStyle}>
      <Handle type="target" position={Position.Top} />
      
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            onClick={() => toggleDone(task.id)}
            style={checkboxStyle}
          >
            {task.completedAt && (
              <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
            )}
          </div>
          <span style={{ fontSize: '18px' }}>{getPriorityIndicator()}</span>
        </div>
        
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => toggleImportant(task.id)}
            style={{
              ...buttonStyle,
              backgroundColor: task.important ? '#ffc107' : '#e9ecef',
              color: task.important ? '#000' : '#6c757d',
            }}
          >
            !
          </button>
          <button
            onClick={() => toggleUrgent(task.id)}
            style={{
              ...buttonStyle,
              backgroundColor: task.urgent ? '#dc3545' : '#e9ecef',
              color: task.urgent ? '#fff' : '#6c757d',
            }}
          >
            ⚡
          </button>
        </div>
      </div>

      <div style={{ fontWeight: 600, marginBottom: '4px', color: '#212529' }}>
        {task.title}
      </div>
      
      <div style={{ 
        fontSize: '12px', 
        color: '#6c757d', 
        display: 'flex', 
        justifyContent: 'space-between' 
      }}>
        <span>{task.list}</span>
        <span>{task.status}</span>
      </div>

      {task.notes && (
        <div style={{ 
          fontSize: '12px', 
          color: '#6c757d', 
          marginTop: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {task.notes}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

const nodeTypes: NodeTypes = {
  taskNode: TaskNode,
}

interface MindMapPageProps {
  onBack: () => void
}

export function MindMapPage({ onBack }: MindMapPageProps) {
  const { tasks, connections, addConnection, removeConnection } = useStore()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedLayout, setSelectedLayout] = useState<'circular' | 'hierarchical' | 'grid'>('circular')

  // Generate nodes and edges from tasks
  const { taskNodes, taskEdges } = useMemo(() => {
    const tasksByList = tasks.reduce((acc, task) => {
      const list = task.list || 'General'
      if (!acc[list]) acc[list] = []
      acc[list].push(task)
      return acc
    }, {} as Record<string, Task[]>)

    const nodes: Node[] = []
    const layoutEdges: Edge[] = []
    
    const lists = Object.keys(tasksByList)
    
    if (selectedLayout === 'circular') {
      lists.forEach((list, listIndex) => {
        const angle = (listIndex / lists.length) * 2 * Math.PI
        const radius = 300
        const centerX = Math.cos(angle) * radius
        const centerY = Math.sin(angle) * radius

        // Add list center node
        nodes.push({
          id: `list-${list}`,
          type: 'default',
          position: { x: centerX - 50, y: centerY - 25 },
          data: { label: list },
          style: {
            background: '#e9ecef',
            border: '2px solid #6c757d',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            padding: '10px',
          },
        })

        tasksByList[list].forEach((task, taskIndex) => {
          const taskAngle = (taskIndex / tasksByList[list].length) * 2 * Math.PI
          const taskRadius = 150
          const x = centerX + Math.cos(taskAngle) * taskRadius
          const y = centerY + Math.sin(taskAngle) * taskRadius

          nodes.push({
            id: task.id,
            type: 'taskNode',
            position: { x: x - 100, y: y - 50 },
            data: { task },
          })

          layoutEdges.push({
            id: `${task.id}-to-${list}`,
            source: `list-${list}`,
            target: task.id,
            style: { stroke: '#6c757d', strokeWidth: 2 },
            type: 'smoothstep',
          })
        })
      })
    } else if (selectedLayout === 'hierarchical') {
      const statusOrder = ['Backlog', 'In Progress', 'Done']
      const tasksByStatus = tasks.reduce((acc, task) => {
        const status = task.status || 'Backlog'
        if (!acc[status]) acc[status] = []
        acc[status].push(task)
        return acc
      }, {} as Record<string, Task[]>)

      statusOrder.forEach((status, statusIndex) => {
        const statusTasks = tasksByStatus[status] || []
        const y = statusIndex * 300

        statusTasks.forEach((task, taskIndex) => {
          const x = taskIndex * 250
          nodes.push({
            id: task.id,
            type: 'taskNode',
            position: { x, y },
            data: { task },
          })

          if (taskIndex > 0) {
            const prevTask = statusTasks[taskIndex - 1]
            layoutEdges.push({
              id: `${prevTask.id}-to-${task.id}`,
              source: prevTask.id,
              target: task.id,
              style: { stroke: '#6c757d', strokeWidth: 1 },
              type: 'smoothstep',
            })
          }
        })
      })
    } else {
      const columns = Math.ceil(Math.sqrt(tasks.length))
      tasks.forEach((task, index) => {
        const row = Math.floor(index / columns)
        const col = index % columns
        nodes.push({
          id: task.id,
          type: 'taskNode',
          position: { x: col * 250, y: row * 200 },
          data: { task },
        })
      })
    }

    // Add user connections
    const connectionEdges: Edge[] = connections.map(connection => {
      const getConnectionStyle = (type: TaskConnection['type']) => {
        switch (type) {
          case 'dependency':
            return { stroke: '#dc3545', strokeWidth: 3, strokeDasharray: '0' }
          case 'blocks':
            return { stroke: '#fd7e14', strokeWidth: 3, strokeDasharray: '10,5' }
          case 'related':
          default:
            return { stroke: '#0d6efd', strokeWidth: 2, strokeDasharray: '0' }
        }
      }

      return {
        id: connection.id,
        source: connection.sourceId,
        target: connection.targetId,
        style: getConnectionStyle(connection.type),
        type: 'smoothstep',
        data: { connection, type: 'user-connection' },
        label: connection.type,
        labelStyle: { fontSize: '12px', fontWeight: 'bold' },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.8 },
      }
    })

    const allEdges = [...layoutEdges, ...connectionEdges]
    return { taskNodes: nodes, taskEdges: allEdges }
  }, [tasks, connections, selectedLayout])

  // Update nodes and edges when tasks change
  useEffect(() => {
    setNodes(taskNodes)
    setEdges(taskEdges)
  }, [taskNodes, taskEdges, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target && params.source !== params.target) {
        addConnection(params.source, params.target, 'related')
      }
    },
    [addConnection]
  )

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault()
      if (edge.data?.type === 'user-connection') {
        if (confirm('Delete this connection?')) {
          removeConnection(edge.id)
        }
      }
    },
    [removeConnection]
  )

  return (
    <div style={pageStyles.container}>
      <header style={pageStyles.header}>
        <h1 style={pageStyles.title}>Mind Map - Task Connections</h1>
        <button 
          style={pageStyles.backButton}
          onClick={onBack}
        >
          ← Back to App
        </button>
      </header>

      {tasks.length === 0 && (
        <div style={pageStyles.emptyState}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>No tasks found</h3>
          <p style={{ margin: 0, fontSize: '14px' }}>Go back to the app and create some tasks first!</p>
        </div>
      )}

      <div style={pageStyles.controls}>
        <div style={pageStyles.controlPanel}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
            Layout:
          </label>
          <select
            value={selectedLayout}
            onChange={(e) => setSelectedLayout(e.target.value as any)}
            style={pageStyles.select}
          >
            <option value="circular">Circular Layout</option>
            <option value="hierarchical">Hierarchical Layout</option>
            <option value="grid">Grid Layout</option>
          </select>
        </div>
        
        <div style={pageStyles.controlPanel}>
          <div>Tasks: {tasks.length}</div>
          <div>Connections: {connections.length}</div>
          <div>Nodes: {nodes.length}</div>
        </div>
      </div>

      <div style={pageStyles.helpPanel}>
        <h3 style={pageStyles.helpTitle}>How to Connect Tasks:</h3>
        <ul style={pageStyles.helpList}>
          <li style={pageStyles.helpItem}>• Drag from task handle to another task</li>
          <li style={pageStyles.helpItem}>• Click connection to delete it</li>
          <li style={pageStyles.helpItem}>• <span style={{color: '#0d6efd'}}>Blue</span>: Related tasks</li>
          <li style={pageStyles.helpItem}>• <span style={{color: '#dc3545'}}>Red</span>: Dependencies</li>
          <li style={pageStyles.helpItem}>• <span style={{color: '#fd7e14'}}>Orange</span>: Blocking tasks</li>
        </ul>
      </div>

      <div style={pageStyles.flowContainer}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            style={{ width: '100%', height: '100%' }}
            minZoom={0.1}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          >
            <Background />
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                if (node.type === 'taskNode') {
                  const task = node.data.task as Task
                  switch (task.status) {
                    case 'Done': return '#28a745'
                    case 'In Progress': return '#007bff'
                    case 'Backlog': return '#6c757d'
                    default: return '#6c757d'
                  }
                }
                return '#e9ecef'
              }}
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  )
}
