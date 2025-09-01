import { useState, useEffect, useRef } from 'react'
import { useStore } from '../useStore'

export function Notepad() {
  const { notes, updateNotes } = useStore()
  const [content, setContent] = useState(notes || '')
  const editorRef = useRef<HTMLTextAreaElement>(null)
  
  // Auto-save notes after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      updateNotes(content)
    }, 500)
    return () => clearTimeout(timer)
  }, [content, updateNotes])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
  }

  return (
    <div className="notepad-container">
      <div className="notepad-header">
        <h2>📝 Notepad</h2>
      </div>
      
      <div className="notebook">
        <div className="notebook-margin"></div>
        <div className="notebook-content">
          <textarea
            ref={editorRef}
            className="notebook-editor"
            value={content}
            onChange={handleInputChange}
            placeholder="Start writing your notes here..."
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  )
}
