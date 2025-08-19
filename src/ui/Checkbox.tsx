import { KeyboardEvent } from 'react'

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      onChange()
    }
  }
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      className={`checkbox${checked ? ' is-checked' : ''}`}
      onClick={onChange}
      onKeyDown={onKeyDown}
      aria-label={label}
    >
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
        <polyline points="4,11 8,15 16,5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}


