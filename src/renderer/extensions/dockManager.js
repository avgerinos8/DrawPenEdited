// Docking manager for DrawPen toolbar
export const TOOLBAR_HEIGHT = 40
export const TOOLBAR_WIDTH = 210
export const WINDOW_CONTROLS_OFFSET = 150
export const TOOLBAR_MARGIN_TOP = 8

/**
 * Calculates top-right dock coordinates for the toolbar.
 * Positions toolbar at the top right, to the left of window control buttons (minimize, maximize, close).
 */
export const getTopRightPosition = (windowWidth, toolbarWidth = TOOLBAR_WIDTH, offset = WINDOW_CONTROLS_OFFSET, marginTop = TOOLBAR_MARGIN_TOP) => {
  return {
    x: Math.max(10, windowWidth - toolbarWidth - offset),
    y: marginTop
  }
}

/**
 * Evaluates whether a given (x, y) coordinate is within docking threshold of top-right.
 */
export const isNearTopRight = (x, y, windowWidth, threshold = 60, toolbarWidth = TOOLBAR_WIDTH, offset = WINDOW_CONTROLS_OFFSET, marginTop = TOOLBAR_MARGIN_TOP) => {
  const targetX = windowWidth - toolbarWidth - offset
  return Math.abs(x - targetX) <= threshold && Math.abs(y - marginTop) <= threshold
}
