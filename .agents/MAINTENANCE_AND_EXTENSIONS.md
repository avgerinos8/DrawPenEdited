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

## 2. Target Feature 1: Compact Docked Toolbar

### 2.1 Requirements
1. **Reduce Toolbar Height (Thickness):**
   - Current standard thickness: `44px`.
   - Current mode switcher height: `72px` (50px SVG icon + 10px vertical padding).
   - In compact mode, align mode switcher height with the toolbar strip (e.g. `32px` to `36px`).
2. **Bottom-Left Docking:**
   - Position the toolbar at the bottom-left corner of the display `workArea`.
   - In Windows 11 with centered taskbar, space exists on the bottom-left above the taskbar boundary.
   - When docked, automatically calculate coordinates:
     - `x = toolbarViewportMargin`
     - `y = window.innerHeight - toolbarHeight - toolbarViewportMargin`

### 2.2 Low-Conflict Implementation Plan
1. **Styling Module:**
   - Create a dedicated stylesheet (e.g. `src/renderer/app_page/components/components/ToolBarCompact.scss`).
   - Define a CSS modifier `.toolbar--compact`:
     - Reduce `--toolbar-thickness` from `44px` to `34px`.
     - Reduce button sizes from `26px` to `22px`.
     - Reduce mode switcher SVG size from `50px` to `24px`.
     - Reduce mode switcher vertical padding from `10px` to `4px`.
2. **Docking Helper:**
   - Create an isolated helper function `calculateDockPosition(dockPreset, windowSize, toolbarSize)`.
   - Presets: `'none'`, `'bottom-left'`.
3. **Core File Hook:**
   - In `ToolBar.js`, add `toolbar--compact` class based on user configuration.
   - In `src/main/index.js`, add corresponding schema key `tool_bar_compact: { type: 'boolean', default: false }`.

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

