<p align="center">
  <img src="src/logo.png" alt="TrackerX logo" width="72" height="72" />
</p>

## TrackerX

Lightweight task tracker with lists and a simple 3‑column board. Each task has its own count‑up timer and a reporting view that aggregates time per task and per list. Runs entirely in the browser with localStorage persistence.

### Features
- **List view with labels**: Add tasks with an optional list label (e.g., Project, Personal). Tasks are grouped by list.
- **Board view (3 columns)**: Backlog, In Progress, Done. Drag and drop cards between columns using mouse interactions.
- **Per‑task timer (count‑up)**: Start/pause/reset a timer on any task. Time accumulates without limits and persists across reloads.
- **Report tab**: See total time spent per task and aggregated per list, live‑updating while timers run.
- **Offline storage**: All data is stored locally in your browser via `localStorage`.
- **Desktop-optimized**: Designed for desktop use with traditional mouse and keyboard interactions.

### Quick start
1. Install Node.js 18+.
2. Install dependencies:
   - Windows PowerShell:
     ```bash
     npm install
     ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open the printed local URL in your browser (e.g., `http://localhost:5173`).

### Usage
- **Add a task**: In List or Board (Backlog column) enter a title. Optionally add a list label to categorize the task.
- **Move tasks**:
  - In Board, drag a card between Backlog, In Progress, and Done using mouse drag and drop.
  - In List, toggle completion via the checkbox to mark Done/Undone.
- **Timers**:
  - Each task shows a mm:ss timer. Click Start/Pause to control it; Reset sets it back to 0.
  - Timers count up while running and accumulate when paused or when a task is marked Done.
- **Reports**:
  - Open the Report tab to see time per task and totals per list. The view live‑updates every second.

### Data model
Task shape (simplified):
```ts
type Task = {
  id: string
  title: string
  list?: string            // label/category
  status?: 'Backlog' | 'In Progress' | 'Done'
  createdAt: string
  completedAt?: string
  timerSeconds?: number    // accumulated elapsed seconds
  timerRunning?: boolean
  timerStartedAt?: string  // ISO time when last started
}
```
Persistence key: `trackerx:v1`

### Build & preview
- Production build:
  ```bash
  npm run build
  ```
- Preview the built app:
  ```bash
  npm run preview
  ```

### Troubleshooting
- **Port already in use**: Stop other dev servers or set a custom port with Vite env/CLI flags.
- **Reset data**: Clear the site’s local storage for the key `trackerx:v1` in your browser devtools.
- **Drag and drop issues**: Some browser extensions can interfere with DnD—try disabling them or testing in a private window.
- **Mobile devices**: This application is optimized for desktop use and may not work optimally on mobile devices.

### Tech stack
- React 18, Zustand (state), Vite (build/dev), TypeScript, CSS.

