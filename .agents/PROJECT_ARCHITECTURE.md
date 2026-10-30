# Project Architecture Specification

## 1. System Summary

DrawPen is an open-source desktop application for on-screen drawing and screen annotation.
The application operates as a transparent overlay on top of all other desktop windows.
Users draw over presentations, browser windows, desktop tools, and applications.

## 2. Multi-Process Model

DrawPen uses the Electron multi-process model:

```
[ Electron Main Process ] (src/main/index.js)
  |-- Native Tray, Global Shortcuts, OS Displays, Electron Store
  |
  |-- (IPC) --> [ Main Window (app_page) ]
  |               Transparent fullscreen canvas overlay
  |               React 19 + HTML5 2D Canvas + ToolBar component
  |
  |-- (IPC) --> [ Extended Toolbar Window (extended_toolbar_page) ]
  |               Small draggable floating widget in Pointer Mode
  |               Vanilla JS + HTML
  |
  |-- (IPC) --> [ Settings Window (settings_page) ]
  |               Preferences dialog (hotkeys, colors, monitors, behaviors)
  |               React 19
  |
  `-- (IPC) --> [ About Window (about_page) ]
                  Product information and version display
                  Vanilla JS + HTML
```

## 3. Window Catalog

The application manages four distinct `BrowserWindow` instances:

### 3.1 Main Window (`mainWindow`)
- **Source:** `src/renderer/app_page/`
- **Role:** Primary drawing canvas and active-mode user interface.
- **Properties:**
  - `transparent: true`
  - `frame: false`
  - `alwaysOnTop: true`
  - `skipTaskbar: true`
  - Bounds match the active display `workArea` (except in development mode: 500x500).
- **Visibility:** Visible only during **Draw Mode**. Hidden during **Pointer Mode**.

### 3.2 Extended Toolbar Window (`extendedToolbarWindow`)
- **Source:** `src/renderer/extended_toolbar_page/`
- **Role:** Floating switcher widget visible when DrawPen is in **Pointer Mode**.
- **Properties:**
  - `transparent: true`
  - `frame: false`
  - `alwaysOnTop: true`
  - `resizable: false`
  - Synchronizes its screen coordinates with `mainWindow` toolbar position.
- **Visibility:** Visible only during **Pointer Mode** (if `show_tool_bar` is true and `disable_toolbar_in_pointer_mode` is false).

### 3.3 Settings Window (`settingsWindow`)
- **Source:** `src/renderer/settings_page/`
- **Role:** Modal dialog for user configuration.
- **Properties:** Fixed-size window (750x640), centered on screen.
- **Visibility:** Opens on shortcut (`CmdOrCtrl+,`) or context menu click.

### 3.4 About Window (`aboutWindow`)
- **Source:** `src/renderer/about_page/`
- **Role:** Displays app version and project links.
- **Properties:** Small fixed-size dialog (250x220).

## 4. Inter-Process Communication (IPC)

Each renderer accesses main process capabilities through isolated preload scripts using Electron `contextBridge`.

### 4.1 Primary Channels (Renderer -> Main)
- `toggle_draw_or_pointer_window`: Switch between Draw Mode and Pointer Mode.
- `get_settings` / `set_settings`: Read and update configuration keys in `electron-store`.
- `commit_toolbar_position`: Persist toolbar `(x, y)` coordinates to store.
- `make_screenshot`: Capture full-resolution screen or active region.
- `request_zoom_start` / `capture_zoom_image` / `exit_zoom`: Control screen magnifier mode.
- `open_settings`: Launch the settings window.
- `close_app`: Hide or exit the application.

### 4.2 Primary Channels (Main -> Renderer)
- `reset_screen`: Clear current canvas strokes.
- `toggle_toolbar`: Show or hide toolbar component.
- `toggle_whiteboard`: Toggle whiteboard background layer.
- `refresh_settings`: Broadcast updated settings to open windows.
- `update_toolbar_position`: Push updated toolbar coordinates to `mainWindow`.

## 5. Drawing Engine Structure

The drawing subsystem is located in `src/renderer/app_page/components/`:

1. **`Application.js`**:
   - Master controller for canvas state.
   - Holds stroke arrays: `allFigures`, `allFadeFigures`, `allLaserFigures`, `allEraserFigures`.
   - Manages undo/redo stacks.
   - Coordinates toolbars (`ToolBar.js`, `FigureToolbar.js`), whiteboard (`Whiteboard.js`), zoom (`ZoomLayer.js`), and cursors (`CuteCursor.js`).

2. **`components/DrawDesk.js`**:
   - Manages two canvas elements:
     - Visible HTML5 Canvas (`#canvas`).
     - Offscreen Canvas (`offscreenCanvasRef`) for gradient and rainbow blend effects.
   - Captures user input via W3C `PointerEvents` (`onPointerDown`, `onPointerMove`, `onPointerUp`).

3. **`drawer/figures.js`**:
   - Pure drawing routines for each figure type:
     - `brush` / `pen`: Smooth curves rendered using `perfect-freehand` and `lazy-brush`.
     - `fadepen`: Temporary curves that fade out automatically.
     - `highlighter`: Semi-transparent thick strokes.
     - `shapes`: Arrows, flat arrows, rectangles, diamonds, ovals, straight lines.
     - `laser`: Fading point trails.
     - `eraser`: Intersection-based stroke deletion.
     - `text`: Editable canvas typography.

## 6. Multi-Monitor Management

In `src/main/index.js`, monitor management handles multi-head environments:
- Monitors are resolved via `getLockedMonitor() || getActiveMonitor() || getUnderCursorMonitor()`.
- Users can lock drawing to a specific screen display ID in settings (`drawing_monitor`).
- When display topology changes, `screen.on('display-metrics-changed')` triggers window boundary updates.

