# Key Workflows and Core Components

## 1. Mode Switching Workflow

DrawPen switches between two operating modes:

```
[ Global Shortcut: Cmd/Ctrl + Shift + A ] OR [ Mode Switcher Button Click ]
                              |
              +---------------+---------------+
              |                               |
       [ DRAW MODE ]                   [ POINTER MODE ]
  - mainWindow is SHOWN           - mainWindow is HIDDEN
  - extendedToolbarWindow HIDDEN  - extendedToolbarWindow SHOWN
  - Fullscreen transparent canvas - Clicks pass to desktop apps
  - User can draw and annotate   - Floating mode button remains accessible
```

### 1.1 Draw Mode Entry (`enableDrawMode`)
1. Exit zoom mode if active.
2. Read saved toolbar coordinates from `extendedToolbarWindow`.
3. Display `mainWindow` over the active monitor.
4. Hide `extendedToolbarWindow`.
5. Set `drawingMode = true`.

### 1.2 Pointer Mode Entry (`enablePointerMode`)
1. Clear active drawings if `clear_drawings_on_hide` is set.
2. Display `extendedToolbarWindow` at stored `(tool_bar_x, tool_bar_y)` coordinates.
3. Hide `mainWindow`.
4. Release OS focus back to previously active application.
5. Set `drawingMode = false`.

## 2. Toolbar Component and Coordinate Synchronization

DrawPen displays two distinct toolbar representations depending on the mode:

### 2.1 In Draw Mode (`src/renderer/app_page/components/components/ToolBar.js`)
- Rendered as an HTML element inside `mainWindow`'s DOM.
- Positioned via absolute CSS coordinates `style={{ left: position.x, top: position.y }}`.
- Supports horizontal and vertical orientations (`toolbar--horizontal`, `toolbar--vertical`).
- Drag handle:
  - Users drag the mode switcher button via `onPointerDown`, `onPointerMove`, and `onPointerUp`.
  - Positions are clamped inside monitor bounds using `clampPosition` in `ToolBar.js`.
  - Sticky snapping applies when the toolbar is within 15px of screen boundaries.
  - Position changes are throttled and persisted to `electron-store` via IPC `commit_toolbar_position`.

### 2.2 In Pointer Mode (`src/renderer/extended_toolbar_page/`)
- A standalone transparent `BrowserWindow` instance (`extendedToolbarWindow`).
- Positioned by the main process:
  `x: displayX + tool_bar_x - EXTENDED_TOOLBAR_WINDOW_MARGIN`
  `y: displayY + tool_bar_y - EXTENDED_TOOLBAR_WINDOW_MARGIN`
- Contains only the mode switcher button to return to Draw Mode or exit.
- When dragged, updates stored coordinates via IPC.

## 3. Input Event Pipeline and Touch Analysis

Input handling occurs in `src/renderer/app_page/components/components/DrawDesk.js`.

### 3.1 Event Listeners
The canvas attaches standard W3C Pointer Events:
- `onPointerDown`
- `onPointerMove`
- `onPointerUp`
- `onPointerCancel`

### 3.2 Pointer Type Inspection
The browser provides `event.pointerType`:
- `'mouse'`: Standard mouse device.
- `'pen'`: Digital active/passive stylus.
- `'touch'`: Finger contact on touchscreen digitizer.

### 3.3 Palm Eraser Mechanism
`DrawDesk.js` contains automatic palm detection:
```javascript
const isTemporaryEraser = (event) => {
  const contactLength = Math.max(event.width, event.height)
  const contactArea = event.width * event.height
  const isPalm = contactLength >= palmMinContactLength && contactArea >= palmMinContactArea

  return (event.pointerType === 'pen' && event.button === 5) ||
         (event.pointerType === 'mouse' && event.button === 1) ||
         (event.pointerType === 'touch' && isPalm)
}
```

### 3.4 Cause of Touchscreen Hand Drawing Failure
- Current thresholds in `constants.js`:
  - `palmMinContactLength = 35` px
  - `palmMinContactArea = 2000` px²
- On Windows high-DPI touchscreens, human finger contact routinely exceeds 35px length and 2000px² contact area.
- Therefore, finger touches evaluate `isPalm = true`.
- The application automatically switches to `eraser` instead of drawing.
- To enable hand drawing on touchscreens, the system requires a dedicated configuration option to allow touch drawing and avoid false palm eraser triggers.


## 4. Keybinding Catalog

| Scope | Shortcut | Action | Details |
| :--- | :--- | :--- | :--- |
| Global | `Ctrl + Shift + A` | Open / Toggle Draw Mode | Toggles between Pointer Mode and Draw Mode from any app |
| In-App | `X` | Cycle Color Palette | Cycles through active colors (Shift+X reverses order) |
| In-App | `S` | Clear Everything | Resets canvas strokes immediately (`handleReset`) |
| In-App | `B` or `1` | Select Brush | Activates brush drawing tool |
| In-App | `P` | Select Pen | Cycles between Pen and Fade Pen |
| In-App | `E` or `6` | Select Eraser | Activates manual eraser |
| In-App | `Ctrl + ,` | Open Settings | Opens preferences modal |
