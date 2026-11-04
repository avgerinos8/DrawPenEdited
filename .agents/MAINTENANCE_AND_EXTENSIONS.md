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

## 2. Implemented Feature 1: Compact Redesigned Toolbar (Max 50px Height) & Docking

### 2.1 Requirements & Specifications
1. **Unified Sleek Height (50px, strictly <= 60px):**
   - Previous design had a stepped mismatch: mode switcher at 72px/60px and tools container at 44px.
   - Redesigned to a unified 50px profile across all elements (`.toolbar__mode-switcher`, `.toolbar__container`, `.toolbar__slider`).
   - Seamless floating pill aesthetic with soft modern drop-shadow and rounded borders.
   - Slide transitions for subpanels (`brush-slide`, `tool-slide`, `color-slide`, `width-slide`) synchronized to 50px offsets.
   - Matching styling and dimensions applied to `src/renderer/extended_toolbar_page/index.html`.
2. **Docking (Above Start Menu & Bottom-Left):**
   - Dock modes supported: `'above-start-menu'` (default), `'bottom-left'`, and `'none'` (free floating).
   - In Windows 11 with centered taskbar, `'above-start-menu'` centers horizontally (`x = Math.round((workArea.width - toolbarWidth) / 2)`) and anchors 10px above the bottom taskbar boundary (`y = workArea.height - toolbarHeight - 10`).
   - Automatic snapping when dragging near the horizontal center or bottom edges.
   - Quick dock options available directly from Tray context menu and Settings page.

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

