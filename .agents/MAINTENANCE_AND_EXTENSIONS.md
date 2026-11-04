# Maintenance and Extension Architecture

## 1. Upstream Fork Management Strategy

This repository is a fork of upstream `DmytroVasin/DrawPen`.
To pull upstream updates without merge conflicts, adhere to the following principles:

1. **Keep Core Modifications Minimal:**
   - Do not perform wide reformatting or linting on upstream files (`Application.js`, `index.js`, etc.).
   - Do not rename existing variables or change existing method signatures.

2. **Use Modular Isolation:**
   - Place new functionality in separate files (e.g. in a dedicated `extensions/` directory).
   - In upstream files, insert only minimal one-line hooks or configuration delegates.

3. **Git Remote Setup:**
   Maintain two git remotes:
   ```bash
   git remote add upstream https://github.com/DmytroVasin/DrawPen.git
   git fetch upstream
   ```
   When pulling updates:
   ```bash
   git rebase upstream/main
   # or
   git merge upstream/main
   ```

---

## 2. Implemented Feature 1: Compact 300x60 2-Row Toolbar & Bottom-Left Docking

### 2.1 Requirements & Specifications
1. **Dimensions (Strictly 300px width × 60px height):**
   - Left side: 40px width × 60px height main handle icon (`.toolbar__handle`).
     - Functions as the drag-and-drop handle for the entire toolbar.
     - Clicking toggles pointer mode / expands the toolbar when collapsed.
   - Right side: 260px width × 60px height 2-row tool grid (`.toolbar__grid`).
     - Row 1 (30px height): Pen, Brush, Fade Pen, Highlighter, Arrow, Rectangle, Oval, Line.
     - Row 2 (30px height): Text, Laser, Eraser, Active Color picker/cycler, Stroke Width picker/cycler, Diamond, Clear Desk (Trash), Collapse.
   - All 16 tools immediately accessible with 1 click; no awkward slide animations or hidden menus.
   - Icons are small (15px) with vibrant distinct colors for rapid recognition.
2. **Bottom-Left Docking (Resolution-Independent):**
   - Automatically anchors at bottom-left corner across all screen resolutions:
     - `x = 10`
     - `y = workArea.height - 60 - 10`
   - Magnetic snap when dragging within 30px of bottom-left.
   - Full drag-and-drop movement anywhere across the display.
3. **Pointer Mode Window (`extendedToolbarWindow`):**
   - Displays identical 40px × 60px handle at bottom-left during pointer mode.
   - Clicking expands smoothly into full 300x60px toolbar in drawing mode.

### 2.2 Modular Architecture
- Implementation isolated in `src/renderer/extensions/dockManager.js`.
- Functions: `getAboveStartMenuPosition()`, `getBottomLeftPosition()`, `isNearAboveStartMenu()`, `isNearBottomLeft()`.
- IPC handler `set_toolbar_dock` and `commit_toolbar_position` in `src/main/index.js` dynamically manage active monitor coordinates.

---

## 3. Target Feature 2: Touch Screen Hand Drawing Option

### 3.1 Requirements
1. Allow users to draw on touchscreens using their fingers ("draw with hand").
2. Prevent finger touches from being misidentified as palm eraser contacts.
3. Keep stylus palm rejection available when finger drawing is toggled off.

### 3.2 Root Cause in Existing Code
In `src/renderer/app_page/components/components/DrawDesk.js`:
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
Because `palmMinContactLength = 35` and `palmMinContactArea = 2000`, normal finger contact satisfies `isPalm`. The app switches to the eraser tool immediately and stops stroke drawing.

### 3.3 Low-Conflict Implementation Plan
1. **Isolated Input Filter Module:**
   - Create `src/renderer/app_page/components/utils/touchManager.js`.
   - Export an evaluator function:
     ```javascript
     export const shouldTreatAsEraser = (event, drawWithTouchEnabled) => {
       if (event.pointerType === 'pen' && event.button === 5) return true
       if (event.pointerType === 'mouse' && event.button === 1) return true
       if (event.pointerType === 'touch') {
         if (drawWithTouchEnabled) {
           // Finger drawing is ON: only massive palm contact triggers eraser (e.g. > 100px or > 8000 area)
           return Math.max(event.width, event.height) > 100 && (event.width * event.height) > 8000
         }
         // Finger drawing is OFF: palm rejection active
         return Math.max(event.width, event.height) >= 35 && (event.width * event.height) >= 2000
       }
       return false
     }
     ```
2. **Configuration Key:**
   - Add `draw_with_touch: { type: 'boolean', default: true }` in `src/main/index.js` schema.
   - Expose the toggle in Settings dialog (`Settings.js`) and/or tray menu.
3. **Core File Hook:**
   - In `DrawDesk.js`, replace the inline `isTemporaryEraser` evaluation with `shouldTreatAsEraser(event, drawWithTouchEnabled)`.
   - Modifies only 1-2 lines in `DrawDesk.js`, ensuring zero upstream merge conflicts.

