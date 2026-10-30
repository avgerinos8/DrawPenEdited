# DrawPen - Agent Documentation Index

## 1. Purpose

This folder contains technical documentation for Large Language Models (LLMs) and automated developer agents.
All documents follow the principles of ASD-STE 100 (Simplified Technical English):
- Use short sentences.
- Use active voice.
- Use clear and unambiguous terms.
- Provide direct and factual procedures.

## 2. Repository Overview

- **Name:** DrawPen (Fork: DrawPenEdited)
- **Upstream Repository:** `https://github.com/DmytroVasin/DrawPen`
- **Application Type:** Desktop screen annotation tool
- **Platform:** Cross-platform (Windows, macOS, Linux)
- **Core Technology:** Electron + React + Webpack

## 3. Reading Order for AI Agents

Read the documentation files in this sequence:

| Step | Document | Purpose |
| :--- | :--- | :--- |
| 1 | [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md) | Understand processes, windows, IPC protocols, and drawing engine |
| 2 | [TECH_STACK_AND_CONVENTIONS.md](./TECH_STACK_AND_CONVENTIONS.md) | Understand dependencies, scripts, store schema, and agent constraints |
| 3 | [KEY_WORKFLOWS_AND_COMPONENTS.md](./KEY_WORKFLOWS_AND_COMPONENTS.md) | Understand pointer vs draw mode, toolbar behavior, and input events |
| 4 | [MAINTENANCE_AND_EXTENSIONS.md](./MAINTENANCE_AND_EXTENSIONS.md) | Understand how to add custom features with minimal upstream merge conflicts |

## 4. Critical Agent Warning

> [!CAUTION]
> As specified in root `AGENTS.md`:
> **Never run interactive or blocking NPM commands (e.g., `npm start`, `npm run package_no_sign`)** in automated agent execution environments. Electron launch will block terminal sessions.

