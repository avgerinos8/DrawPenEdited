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

## 2. Implemented Feature 1: Ultra-Compact 220x60 Toolbar (20x30 Icons), Clear All & Taskbar Overlay

### 2.1 Requirements & Specifications
1. **Dimensions (Ultra-Compact 220px width × 60px height):**
   - Left side: 40px width × 60px height main handle (`.toolbar__handle`).
     - Functions as drag handle and toggles Draw / Pointer Mode.
   - Right side: 180px width × 60px height grid (`.toolbar__grid`):
     - 2 rows × 9 columns.
     - **Each icon button is exactly 20px width × 30px height** for minimal footprint.
     - Row 1 (9 items): Pen (P), Brush (B), Fade Pen, Highlighter (H), Arrow (A), Flat Arrow, Rectangle (R), Oval (O), Line.
     - Row 2 (9 items): Text (T), Laser (L), Eraser (E), **Clear All (S)**, Color swatch, Stroke Width, Diamond (D), Whiteboard (E), Collapse.
     - **Clear All Button:** Prominent red button that triggers desk reset (`handleReset()`), equivalent to shortcut `S`.
     - Distinct vivid icon colors for immediate recognition.
2. **True Taskbar Overlay Architecture:**
   - Previously windows used `display.workArea`, which Windows strictly stops at the top edge of the taskbar (e.g. at y = 912).
   - Solution:
     - Windows now bound to `display.bounds` (spanning full height e.g. 0 to 960).
     - Applied `setAlwaysOnTop(true, 'screen-saver')` to both `mainWindow` and `extendedToolbarWindow`.
     - This elevates windows into the system screen-saver Z-band, rendering **directly on top of the Windows taskbar**.
     - Default coordinates: `x = 0`, `y = display.bounds.height - 60` (resting directly on top of the taskbar at bottom-left).
     - Magnetic snapping to `x = 0, y = maxY` on drag-and-drop.

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

---

## 4. Feature 3: Ultra-Compact Top-Right Docked Toolbar (40px Height)

### 4.1 Requirements & Design
1. **Dimensions & Geometry:**
   - Overall toolbar height is exactly **40px**; overall toolbar width is **210px**.
   - Left handle: 30px width × 40px height for dragging and pointer-mode toggling.
   - Grid area: 180px width × 40px height (2 rows × 9 columns).
   - Button footprint: Each button is **20px width × 14px height**, compactly centered in each 19px row.
   - Clear All button: Dedicated red button (`#DC2626`, `Icons.Trash`) executing desk reset immediately (identical to physical key `S`).
2. **Top-Right Docking (Left of Window Controls):**
   - Positioned cleanly at `x = windowWidth - toolbarWidth - 150`, `y = 8` to rest immediately to the left of Windows minimize / maximize / close buttons.
   - Free dragging supported with magnetic snapping back to the top-right anchor.
   - "Bottom-Left" and taskbar dock options completely removed from user settings and tray menu.
3. **Zero OS Window Overhead (OLED Burn-in Protection):**
   - No floating desktop OS window exists when DrawPen is closed (`disable_toolbar_in_pointer_mode = true`).
   - The toolbar is exclusively an HTML DOM component rendered inside `mainWindow` and appears only when `Ctrl+Shift+A` activates the app.

---

## 5. Feature 4: "Start with Windows" (Minimized to Tray Icon)

### 5.1 Requirements & Implementation
1. **Settings Toggle:**
   - Added user option titled **"Start with Windows"** with description **"Launch minimized to system tray icon"**.
2. **System Integration:**
   - Configures Electron login items via `app.setLoginItemSettings({ openAtLogin: true, openAsHidden: true, args: ['--hidden'] })`.
   - Sets `starts_hidden = true` and checks `process.argv.includes('--hidden')` or `safeWasOpenedAtLogin()` during boot.
   - Guarantees silent startup directly to the Windows system tray without popping up windows or stealing focus.

---

## 6. Feature 5: Language-Independent Keyboard Shortcuts

### 6.1 Implementation Details
- Uses physical key codes (`event.code`: `KeyS` -> `'s'`, `KeyX` -> `'x'`, `KeyB` -> `'b'`, etc.) rather than localized characters (`event.key`).
- Ensures shortcuts (`S` to clear, `X` to cycle colors, `B` for brush, etc.) function seamlessly regardless of whether the Windows input layout is Greek, English, or any other layout.

---

## 7. Feature 6: Right-Click Draw Mode Exit & Dedicated Toolbar Mode Button

### 7.1 Right-Click Exit Restoration
- **Root Cause:** In Chromium, calling `event.preventDefault()` on `pointerdown` for mouse button 2 suppresses the native `contextmenu` event. Previously, `DrawDesk.js` executed `event.preventDefault()` on all pointerdown events, completely dropping right-click context menu events.
- **Fix:**
  - Bypassed `event.preventDefault()` when `event.button === 2` in `onPointerDown`.
  - Added direct right-click invocation in `onPointerUp` (`event.button === 2`).
  - Attached `onContextMenu={handleContextMenu}` directly on `<canvas>`.
  - Added window-level `contextmenu` event listener in `Application.js`.
  - Exposed direct `enable_pointer_mode` IPC handler in `src/main/index.js` to immediately hide `mainWindow` and release focus without toggle race conditions.

### 7.2 Dedicated Big Mode Button on Toolbar
- Separated the drag handle (`.toolbar__drag-grip`, 12px width) from the mode switch button.
- Added a dedicated, prominent button (`.toolbar__mode-btn`, 36px width × 40px height) featuring `<Icons.DrawModeEnabled />`.
- Clicking the button directly triggers `handleEnablePointerMode()`, cleanly exiting Draw Mode back to the system tray.



