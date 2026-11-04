import React, { useEffect, useState, useCallback, useRef } from "react"
import "./ToolBar.scss"
import { widthList } from "../constants.js"

const TOOLBAR_WIDTH = 210
const TOOLBAR_HEIGHT = 40
const HANDLE_WIDTH = 30
const WINDOW_CONTROLS_OFFSET = 150
const TOOLBAR_MARGIN_TOP = 8
const SNAP_THRESHOLD = 30

const ToolBar = ({
  position,
  setPosition,
  isCollapsed,
  setIsCollapsed,
  activeTool,
  activeColorIndex,
  activeWidthIndex,
  handleChangeColor,
  handleChangeWidth,
  handleChangeTool,
  handleClearDesk,
  handleEnablePointerMode,
  handlePositionCommit,
  handleToggleWhiteboard,
  Icons,
  colorList,
}) => {
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const toolbarRef = useRef(null)
  const dragStartPosRef = useRef({ x: 0, y: 0 })
  const dragDistanceRef = useRef(0)

  const activeColor = colorList[activeColorIndex] || colorList[0] || { color: "#529BE0", title: "Blue" }

  const toolsRow1 = [
    { id: "pen", title: "Pen (P)", color: "#2563EB", icon: <Icons.Pen /> },
    { id: "brush", title: "Brush (B)", color: "#0D9488", icon: <Icons.Brush /> },
    { id: "fadepen", title: "Fade Pen", color: "#7C3AED", icon: <Icons.MagicPen /> },
    { id: "highlighter", title: "Highlighter (H)", color: "#D97706", icon: <Icons.Highlighter /> },
    { id: "arrow", title: "Arrow (A)", color: "#EA580C", icon: <Icons.Arrow /> },
    { id: "flat_arrow", title: "Flat Arrow", color: "#C2410C", icon: <Icons.FlatArrow /> },
    { id: "rectangle", title: "Rectangle (R)", color: "#16A34A", icon: <Icons.Rectangle /> },
    { id: "oval", title: "Oval (O)", color: "#DB2777", icon: <Icons.Oval /> },
    { id: "line", title: "Line", color: "#4F46E5", icon: <Icons.Line /> },
  ]

  const toolsRow2 = [
    { id: "text", title: "Text (T)", color: "#0891B2", icon: <Icons.Text /> },
    { id: "laser", title: "Laser (L)", color: "#EF4444", icon: <Icons.Laser /> },
    { id: "eraser", title: "Eraser (E)", color: "#E11D48", icon: <Icons.Eraser /> },
    {
      id: "clearAll",
      title: "Clear All (S) - Clear drawings",
      color: "#DC2626",
      icon: <Icons.Trash />,
      action: handleClearDesk,
    },
    {
      id: "color",
      title: `Color (X): ${activeColor.title || ""} - click to change`,
      customRender: () => (
        <div
          className={`toolbar__color-dot ${activeColor.isRainbow ? "color-rainbow" : ""}`}
          style={{ backgroundColor: activeColor.color }}
        />
      ),
      action: () => handleChangeColor((activeColorIndex + 1) % colorList.length),
    },
    {
      id: "brushSize",
      title: `Size: ${widthList[activeWidthIndex]?.title || ""} - click to change`,
      customRender: () => (
        <div className={`toolbar__size-indicator size-${activeWidthIndex}`}>
          <div className="size-bar" style={{ height: Math.max(2, (activeWidthIndex + 1) * 2) }} />
        </div>
      ),
      action: () => handleChangeWidth((activeWidthIndex + 1) % widthList.length),
    },
    { id: "diamond", title: "Diamond (D)", color: "#059669", icon: <Icons.Diamond /> },
    {
      id: "whiteboard",
      title: "Whiteboard (E)",
      color: "#0284C7",
      icon: <Icons.DrawModeEnabled />,
      action: handleToggleWhiteboard,
    },
    {
      id: "collapse",
      title: "Collapse Toolbar",
      color: "#64748B",
      icon: <Icons.AngleLeft />,
      action: () => setIsCollapsed(prev => !prev),
    },
  ]

  const handlePointerDown = (e) => {
    if (e.button !== 0) return
    dragStartPosRef.current = { x: e.clientX, y: e.clientY }
    dragDistanceRef.current = 0
    setDragging(true)
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handlePointerMove = useCallback((e) => {
    if (!dragging) return

    const dx = Math.abs(e.clientX - dragStartPosRef.current.x)
    const dy = Math.abs(e.clientY - dragStartPosRef.current.y)
    dragDistanceRef.current = Math.max(dragDistanceRef.current, dx + dy)

    const newX = e.clientX - offset.x
    const newY = e.clientY - offset.y

    const currentWidth = isCollapsed ? HANDLE_WIDTH : TOOLBAR_WIDTH
    const minX = 10
    const minY = TOOLBAR_MARGIN_TOP
    const maxX = Math.max(minX, window.innerWidth - currentWidth - 10)
    const maxY = Math.max(minY, window.innerHeight - TOOLBAR_HEIGHT - 10)

    let clampedX = Math.min(Math.max(newX, minX), maxX)
    let clampedY = Math.min(Math.max(newY, minY), maxY)

    const targetTopRightX = Math.max(minX, window.innerWidth - currentWidth - WINDOW_CONTROLS_OFFSET)
    if (Math.abs(newX - targetTopRightX) <= SNAP_THRESHOLD && Math.abs(newY - TOOLBAR_MARGIN_TOP) <= SNAP_THRESHOLD) {
      clampedX = targetTopRightX
      clampedY = TOOLBAR_MARGIN_TOP
    }

    setPosition({ x: Math.round(clampedX), y: Math.round(clampedY) })
  }, [dragging, offset, isCollapsed, setPosition])

  const handlePointerUp = useCallback(() => {
    if (!dragging) return
    setDragging(false)
    handlePositionCommit(position)
  }, [dragging, position, handlePositionCommit])

  useEffect(() => {
    if (!dragging) return
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
    window.addEventListener("pointercancel", handlePointerUp)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("pointercancel", handlePointerUp)
    }
  }, [dragging, handlePointerMove, handlePointerUp])

  const handleMainButtonClick = () => {
    if (dragDistanceRef.current > 5) return
    if (isCollapsed) {
      setIsCollapsed(false)
    } else {
      handleEnablePointerMode()
    }
  }

  return (
    <aside
      id="toolbar"
      ref={toolbarRef}
      className={`toolbar--compact ${isCollapsed ? "toolbar--collapsed" : ""}`}
      style={{ left: position.x, top: position.y }}
    >
      <div
        className="toolbar__handle"
        onPointerDown={handlePointerDown}
        onClick={handleMainButtonClick}
        title={isCollapsed ? "Click to Expand • Drag to Move" : "Pointer Mode • Drag to Move"}
      >
        <div className="handle__grip">
          <div className="grip-dot" />
          <div className="grip-dot" />
          <div className="grip-dot" />
          <div className="grip-dot" />
          <div className="grip-dot" />
          <div className="grip-dot" />
        </div>
        <div className="handle__icon">
          <Icons.DrawModeEnabled />
        </div>
      </div>

      {!isCollapsed && (
        <div className="toolbar__grid">
          <div className="grid-row">
            {toolsRow1.map((tool) => (
              <button
                key={tool.id}
                tabIndex={-1}
                className={`grid-item ${activeTool === tool.id ? "active" : ""}`}
                style={{ "--icon-color": tool.color }}
                onClick={() => (tool.action ? tool.action() : handleChangeTool(tool.id))}
                title={tool.title}
              >
                {tool.customRender ? tool.customRender() : tool.icon}
              </button>
            ))}
          </div>

          <div className="grid-row">
            {toolsRow2.map((tool) => (
              <button
                key={tool.id}
                tabIndex={-1}
                className={`grid-item ${activeTool === tool.id ? "active" : ""}`}
                style={{ "--icon-color": tool.color }}
                onClick={() => (tool.action ? tool.action() : handleChangeTool(tool.id))}
                title={tool.title}
              >
                {tool.customRender ? tool.customRender() : tool.icon}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}

export default ToolBar
