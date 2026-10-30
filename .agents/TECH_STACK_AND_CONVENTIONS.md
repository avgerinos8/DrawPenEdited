# Technology Stack and Code Conventions

## 1. Core Technologies and Versions

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| Runtime | Node.js | `>=22.22 <23` | Engine runtime |
| Desktop Shell | Electron | `44.4.3` | Multi-window desktop platform |
| UI Framework | React | `19.2.8` | Renderer component framework |
| Bundler | Webpack | `5.109.0` | Asset packaging and transpilation |
| Build System | Electron Forge | `7.11.2` | Packager and installer maker |
| Styling | Sass / SCSS | `1.102.0` | Modular styles and CSS custom properties |
| Freehand Curves | `perfect-freehand` | `1.2.3` | Polygonal stroke generation |
| Smoothing | `lazy-brush` | `2.0.2` | Input position stabilization |
| Preferences | `electron-store` | `11.0.2` | JSON configuration storage on disk |

## 2. Directory Structure

```
DrawPenEdited/
├── .agents/                    # LLM and Agent technical documentation
├── .github/                    # Workflows and release actions
├── assets/                     # Icons and installer artwork
├── src/
│   ├── assets/                 # Fonts, static icons, tray icons
│   ├── main/
│   │   └── index.js            # Electron main process (entrypoint)
│   └── renderer/
│       ├── about_page/         # About dialog (HTML/JS)
│       ├── app_page/           # Fullscreen drawing canvas overlay
│       │   ├── components/
│       │   │   ├── components/ # ToolBar, DrawDesk, Whiteboard, CuteCursor, etc.
│       │   │   ├── drawer/     # figures.js (canvas rendering routines)
│       │   │   ├── utils/      # figureDetection.js, general.js
│       │   │   ├── Application.js
│       │   │   ├── Application.scss
│       │   │   └── constants.js
│       │   ├── index.html
│       │   ├── index.js
│       │   └── preload.js
│       ├── extended_toolbar_page/ # Floating pointer-mode switcher widget
│       └── settings_page/      # Preferences UI (React)
└── tools/
    ├── forge/forge.config.js   # Electron Forge window targets and packaging
    └── webpack/                # Webpack main and renderer configs
```

## 3. Configuration Store (`electron-store`)

Stored values persist across restarts in the OS user data directory.
Key schema definitions in `src/main/index.js`:

| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `show_tool_bar` | boolean | `true` | Toolbar visibility |
| `tool_bar_orientation` | string | `'horizontal'` | `'horizontal'` or `'vertical'` |
| `tool_bar_x`, `tool_bar_y` | number | `10, 10` | Toolbar screen coordinate offsets |
| `tool_bar_collapsed` | boolean | `false` | Compact/collapsed toolbar state |
| `tool_bar_active_tool` | string | `'brush'` | Active drawing tool ID |
| `tool_bar_color_palette` | object | 6 colors | Hex palette for tools |
| `pen_smoothing` | boolean | `true` | Apply line point filtering |
| `cute_cursor_mode` | string | `'permanent'` | Cursor style (`permanent`, `fade`, `dot`, `hidden`) |
| `disable_toolbar_in_pointer_mode` | boolean | `false` | Hide extended toolbar in pointer mode |
| `active_monitor_id` | number | - | ID of display last drawn upon |

## 4. Code Conventions for Agents

### 4.1 Semicolon Rule
> [!IMPORTANT]
> **Strict Project Rule:** When writing `.js` files, **never** include optional semicolons at the end of lines.

### 4.2 React Architecture
- Use functional React components with Hooks (`useState`, `useEffect`, `useCallback`, `useRef`).
- Avoid large monolithic state rewrites. State modifications in `Application.js` use functional updater patterns (`prev => ...`).

### 4.3 Styling System
- SCSS styles use CSS variables declared in `:root` (e.g. `--toolbar-thickness`, `--toolbar-border-color`).
- BEM naming conventions for toolbar (`toolbar__mode-switcher`, `toolbar__items`, etc.).

### 4.4 Agent Execution Boundaries
- **DO NOT** execute interactive package scripts (`npm start`, `npm run package_no_sign`, `electron-forge start`) within sandbox sessions.
- Use static analysis, syntax checking, and git inspection tools for verification.

