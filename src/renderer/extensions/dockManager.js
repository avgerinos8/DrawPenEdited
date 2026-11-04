// Docking manager for DrawPen toolbar
export const TOOLBAR_HEIGHT = 60
export const TOOLBAR_WIDTH = 220
export const TOOLBAR_MARGIN = 10

/**
 * Calculates bottom-left dock coordinates for the toolbar on top of the taskbar.
 * Positions toolbar at x: 10 and anchored to the bottom edge of the display bounds.
 */
export const getBottomLeftPosition = (windowHeight, toolbarHeight = TOOLBAR_HEIGHT, margin = TOOLBAR_MARGIN) => {
  return {
    x: margin,
    y: Math.max(0, windowHeight - toolbarHeight)
  }
}

/**
 * Evaluates whether a given (x, y) coordinate is within docking threshold of bottom-left.
 */
export const isNearBottomLeft = (x, y, windowHeight, threshold = 60, toolbarHeight = TOOLBAR_HEIGHT, margin = TOOLBAR_MARGIN) => {
  const targetY = windowHeight - toolbarHeight
  return Math.abs(x - margin) <= threshold && Math.abs(y - targetY) <= threshold
}
