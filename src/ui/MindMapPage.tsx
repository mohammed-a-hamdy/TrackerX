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
  filterPanel: {
    backgroundColor: 'white',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    minWidth: '200px',
  },
  statusFilters: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
    marginTop: '8px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  clearButton: {
    padding: '6px 12px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#495057',
  },
  contextMenu: {
    position: 'absolute' as const,
    zIndex: 1000,
    backgroundColor: 'white',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    padding: '4px 0',
    minWidth: '160px',
  },
  contextMenuItem: {
    width: '100%',
    padding: '8px 12px',
    border: 'none',
    backgroundColor: 'transparent',
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  contextMenuHeader: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#6c757d',
    borderBottom: '1px solid #e9ecef',
    marginBottom: '4px',
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
  const { tasks, connections, nodePositions, addConnection, removeConnection, updateConnectionType, updateNodePosition, clearNodePositions } = useStore()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedLayout, setSelectedLayout] = useState<'circular' | 'hierarchical' | 'grid'>('circular')
  const [selectedListFilter, setSelectedListFilter] = useState<string>('all')
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<Set<string>>(new Set(['Backlog', 'In Progress', 'Done']))
  const [connectionContextMenu, setConnectionContextMenu] = useState<{
    connectionId: string
    x: number
    y: number
  } | null>(null)

  // Get available lists for filter dropdown
  const availableLists = useMemo(() => {
    const lists = [...new Set(tasks.map(task => task.list || 'General'))]
    return lists.sort()
  }, [tasks])

  // Handle status filter toggle
  const toggleStatusFilter = useCallback((status: string) => {
    setSelectedStatusFilters(prev => {
      const newSet = new Set(prev)
      if (newSet.has(status)) {
        newSet.delete(status)
      } else {
        newSet.add(status)
      }
      return newSet
    })
  }, [])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSelectedListFilter('all')
    setSelectedStatusFilters(new Set(['Backlog', 'In Progress', 'Done']))
  }, [])

  // Helper function to get node position
  const getNodePosition = useCallback((nodeId: string, defaultX: number, defaultY: number) => {
    const savedPosition = nodePositions.find(p => p.id === nodeId)
    return savedPosition ? { x: savedPosition.x, y: savedPosition.y } : { x: defaultX, y: defaultY }
  }, [nodePositions])

  // Generate nodes and edges from tasks
  const { taskNodes, taskEdges } = useMemo(() => {
    // Filter tasks by selected list and status
    let filteredTasks = tasks

    // Filter by list
    if (selectedListFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => (task.list || 'General') === selectedListFilter)
    }

    // Filter by status
    filteredTasks = filteredTasks.filter(task => 
      selectedStatusFilters.has(task.status || 'Backlog')
    )

    const tasksByList = filteredTasks.reduce((acc, task) => {
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
          position: getNodePosition(`list-${list}`, centerX - 50, centerY - 25),
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
            position: getNodePosition(task.id, x - 100, y - 50),
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
      const tasksByStatus = filteredTasks.reduce((acc, task) => {
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
            position: getNodePosition(task.id, x, y),
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
      const columns = Math.ceil(Math.sqrt(filteredTasks.length))
      filteredTasks.forEach((task, index) => {
        const row = Math.floor(index / columns)
        const col = index % columns
        nodes.push({
          id: task.id,
          type: 'taskNode',
          position: getNodePosition(task.id, col * 250, row * 200),
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
  }, [tasks, connections, selectedLayout, selectedListFilter, selectedStatusFilters, getNodePosition])

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
        if (confirm('Delete this connection? (Double-click to change type)')) {
          removeConnection(edge.id)
        }
      }
    },
    [removeConnection]
  )

  const onEdgeDoubleClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault()
      if (edge.data?.type === 'user-connection') {
        setConnectionContextMenu({
          connectionId: edge.id,
          x: event.clientX,
          y: event.clientY
        })
      }
    },
    []
  )

  const handleConnectionTypeChange = useCallback((connectionId: string, newType: TaskConnection['type']) => {
    updateConnectionType(connectionId, newType)
    setConnectionContextMenu(null)
  }, [updateConnectionType])

  const handleContextMenuClose = useCallback(() => {
    setConnectionContextMenu(null)
  }, [])

  // Close context menu when clicking elsewhere
  const handleContainerClick = useCallback(() => {
    if (connectionContextMenu) {
      setConnectionContextMenu(null)
    }
  }, [connectionContextMenu])

  // Handle node position changes (when dragged)
  const handleNodesChange = useCallback(
    (changes: any[]) => {
      onNodesChange(changes)
      
      // Save position changes
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && change.dragging === false) {
          updateNodePosition(change.id, change.position.x, change.position.y)
        }
      })
    },
    [onNodesChange, updateNodePosition]
  )

  return (
    <div style={pageStyles.container} onClick={handleContainerClick}>
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

        <div style={pageStyles.filterPanel}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
            Filter by List:
          </label>
          <select
            value={selectedListFilter}
            onChange={(e) => setSelectedListFilter(e.target.value)}
            style={pageStyles.select}
          >
            <option value="all">All Lists</option>
            {availableLists.map(list => (
              <option key={list} value={list}>{list}</option>
            ))}
          </select>
        </div>

        <div style={pageStyles.filterPanel}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
            Filter by Status:
          </label>
          <div style={pageStyles.statusFilters}>
            {['Backlog', 'In Progress', 'Done'].map(status => (
              <label key={status} style={pageStyles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedStatusFilters.has(status)}
                  onChange={() => toggleStatusFilter(status)}
                  style={{ margin: 0 }}
                />
                <span>{status}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={pageStyles.controlPanel}>
          <button
            onClick={clearAllFilters}
            style={pageStyles.clearButton}
          >
            Clear Filters
          </button>
        </div>

        <div style={pageStyles.controlPanel}>
          <button
            onClick={clearNodePositions}
            style={{
              ...pageStyles.clearButton,
              backgroundColor: '#fff3cd',
              borderColor: '#ffeaa7',
              color: '#856404'
            }}
          >
            Reset Positions
          </button>
        </div>
        
        <div style={pageStyles.controlPanel}>
          <div>Tasks: {tasks.length}</div>
          <div>Filtered: {taskNodes.filter(n => n.type === 'taskNode').length}</div>
          <div>Connections: {connections.length}</div>
        </div>
      </div>

      <div style={pageStyles.helpPanel}>
        <h3 style={pageStyles.helpTitle}>Mind Map Controls:</h3>
        <ul style={pageStyles.helpList}>
          <li style={pageStyles.helpItem}>• Drag nodes to reposition (saved automatically)</li>
          <li style={pageStyles.helpItem}>• Drag from task handles to create connections</li>
          <li style={pageStyles.helpItem}>• Click connection to delete it</li>
          <li style={pageStyles.helpItem}>• Double-click connection to change type</li>
          <li style={pageStyles.helpItem}>• <span style={{color: '#0d6efd'}}>Blue</span>: Related tasks</li>
          <li style={pageStyles.helpItem}>• <span style={{color: '#dc3545'}}>Red</span>: Dependencies</li>
          <li style={pageStyles.helpItem}>• <span style={{color: '#fd7e14'}}>Orange</span>: Blocking tasks</li>
        </ul>
      </div>

      {/* Connection Type Context Menu */}
      {connectionContextMenu && (
        <div
          style={{
            ...pageStyles.contextMenu,
            left: connectionContextMenu.x,
            top: connectionContextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={pageStyles.contextMenuHeader}>
            Change Connection Type
          </div>
          {['related', 'dependency', 'blocks'].map((type) => (
            <button
              key={type}
              onClick={() => handleConnectionTypeChange(connectionContextMenu.connectionId, type as TaskConnection['type'])}
              style={pageStyles.contextMenuItem}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span 
                style={{
                  width: '12px',
                  height: '2px',
                  borderRadius: '1px',
                  backgroundColor: 
                    type === 'dependency' ? '#dc3545' :
                    type === 'blocks' ? '#fd7e14' : '#0d6efd'
                }}
              />
              <span style={{ textTransform: 'capitalize' }}>{type}</span>
            </button>
          ))}
          <div style={{ borderTop: '1px solid #e9ecef', marginTop: '4px' }}>
            <button
              onClick={handleContextMenuClose}
              style={{
                ...pageStyles.contextMenuItem,
                color: '#6c757d'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={pageStyles.flowContainer}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            onEdgeDoubleClick={onEdgeDoubleClick}
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
