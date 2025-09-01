import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
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

// Custom Task Node Component
const TaskNode = ({ data }: { data: { task: Task } }) => {
  const { task } = data
  const { toggleDone, toggleImportant, toggleUrgent } = useStore()

  const getStatusColor = () => {
    switch (task.status) {
      case 'Done': return 'bg-green-100 border-green-300 dark:bg-green-900 dark:border-green-600'
      case 'In Progress': return 'bg-blue-100 border-blue-300 dark:bg-blue-900 dark:border-blue-600'
      case 'Backlog': return 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600'
      default: return 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600'
    }
  }

  const getPriorityIndicator = () => {
    if (task.important && task.urgent) return '🔴' // High priority
    if (task.important) return '🟡' // Important
    if (task.urgent) return '🟠' // Urgent
    return ''
  }

  return (
    <div className={`px-4 py-3 shadow-md rounded-md border-2 min-w-[200px] max-w-[300px] ${getStatusColor()}`}>
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleDone(task.id)}
            className={`w-4 h-4 rounded border-2 flex-shrink-0 ${
              task.completedAt ? 'bg-green-500 border-green-500' : 'border-gray-400'
            }`}
          >
            {task.completedAt && (
              <svg viewBox="0 0 24 24" className="w-3 h-3 text-white">
                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            )}
          </button>
          <span className="text-lg">{getPriorityIndicator()}</span>
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={() => toggleImportant(task.id)}
            className={`text-xs px-1 py-0.5 rounded ${
              task.important 
                ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200' 
                : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
            }`}
          >
            !
          </button>
          <button
            onClick={() => toggleUrgent(task.id)}
            className={`text-xs px-1 py-0.5 rounded ${
              task.urgent 
                ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200' 
                : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
            }`}
          >
            ⚡
          </button>
        </div>
      </div>

      <div className="font-medium text-sm mb-1 text-gray-900 dark:text-gray-100">
        {task.title}
      </div>
      
      <div className="text-xs text-gray-600 dark:text-gray-400 flex justify-between">
        <span>{task.list}</span>
        <span>{task.status}</span>
      </div>

      {task.notes && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate">
          {task.notes}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

// Node types
const nodeTypes: NodeTypes = {
  taskNode: TaskNode,
}

export function MindMap() {
  const { tasks, connections, addConnection, removeConnection, updateConnectionType } = useStore()
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
    
    let nodeIndex = 0
    const listCenters: Record<string, { x: number; y: number }> = {}
    
    // Calculate layout based on selected type
    const lists = Object.keys(tasksByList)
    
    if (selectedLayout === 'circular') {
      // Circular layout around lists
      lists.forEach((list, listIndex) => {
        const angle = (listIndex / lists.length) * 2 * Math.PI
        const radius = 300
        const centerX = Math.cos(angle) * radius
        const centerY = Math.sin(angle) * radius
        listCenters[list] = { x: centerX, y: centerY }

        // Add list center node
        nodes.push({
          id: `list-${list}`,
          type: 'default',
          position: { x: centerX - 50, y: centerY - 25 },
          data: { label: list },
          style: {
            background: '#e5e7eb',
            border: '2px solid #9ca3af',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 'bold',
            padding: '10px',
          },
        })

        // Add tasks around the list center
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

          // Connect task to list center
          layoutEdges.push({
            id: `${task.id}-to-${list}`,
            source: `list-${list}`,
            target: task.id,
            style: { stroke: '#9ca3af', strokeWidth: 2 },
            type: 'smoothstep',
          })

          nodeIndex++
        })
      })
    } else if (selectedLayout === 'hierarchical') {
      // Hierarchical layout by status
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

          // Connect tasks in sequence within same status
          if (taskIndex > 0) {
            const prevTask = statusTasks[taskIndex - 1]
            layoutEdges.push({
              id: `${prevTask.id}-to-${task.id}`,
              source: prevTask.id,
              target: task.id,
              style: { stroke: '#9ca3af', strokeWidth: 1 },
              type: 'smoothstep',
            })
          }
        })
      })
    } else {
      // Grid layout
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

    // Add user-created connections
    const connectionEdges: Edge[] = connections.map(connection => {
      const getConnectionStyle = (type: TaskConnection['type']) => {
        switch (type) {
          case 'dependency':
            return { stroke: '#ef4444', strokeWidth: 3, strokeDasharray: '0' }
          case 'blocks':
            return { stroke: '#f59e0b', strokeWidth: 3, strokeDasharray: '10,5' }
          case 'related':
          default:
            return { stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '0' }
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
  useMemo(() => {
    console.log('Updating nodes:', taskNodes.length, 'edges:', taskEdges.length)
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
    <ReactFlowProvider>
      <div className="w-full h-[calc(100vh-120px)] bg-white dark:bg-gray-900 relative" style={{ margin: '-16px', padding: '0' }}>
        {/* Debug info */}
        {tasks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-600 rounded-lg p-4 text-center">
              <h3 className="font-semibold mb-2">No tasks found</h3>
              <p className="text-sm">Go to the Board view to create some tasks first!</p>
            </div>
          </div>
        )}
        
        <div className="absolute top-4 left-4 z-10 flex gap-2">
        <select
          value={selectedLayout}
          onChange={(e) => setSelectedLayout(e.target.value as any)}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
        >
          <option value="circular">Circular Layout</option>
          <option value="hierarchical">Hierarchical Layout</option>
          <option value="grid">Grid Layout</option>
        </select>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm">
          Tasks: {tasks.length} | Connections: {connections.length} | Nodes: {nodes.length}
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-3 text-sm max-w-xs">
        <h3 className="font-semibold mb-2">How to Connect Tasks:</h3>
        <ul className="text-xs space-y-1">
          <li>• Drag from any task's handle to another task</li>
          <li>• Click a connection to delete it</li>
          <li>• <span className="text-blue-500">Blue</span>: Related</li>
          <li>• <span className="text-red-500">Red</span>: Dependency</li>
          <li>• <span className="text-orange-500">Orange</span>: Blocks</li>
        </ul>
      </div>

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
        attributionPosition="bottom-left"
        style={{ width: '100%', height: '100%' }}
        className="bg-gray-50 dark:bg-gray-900"
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background />
        <Controls />
        <MiniMap 
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
          nodeColor={(node) => {
            if (node.type === 'taskNode') {
              const task = node.data.task as Task
              switch (task.status) {
                case 'Done': return '#10b981'
                case 'In Progress': return '#3b82f6'
                case 'Backlog': return '#6b7280'
                default: return '#6b7280'
              }
            }
            return '#e5e7eb'
          }}
        />
      </ReactFlow>
      </div>
    </ReactFlowProvider>
  )
}
