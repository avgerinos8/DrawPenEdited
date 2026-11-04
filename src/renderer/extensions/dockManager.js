// Docking manager for DrawPen toolbar
export const TOOLBAR_HEIGHT = 50
export const TOOLBAR_WIDTH = 432
export const TOOLBAR_MARGIN = 10

/**
 * Calculates above-start-menu dock coordinates for the toolbar.
 * Positions toolbar centered horizontally (above Windows Start menu) and 10px above the taskbar.
 */
export const getAboveStartMenuPosition = (windowWidth, windowHeight, toolbarWidth = TOOLBAR_WIDTH, toolbarHeight = TOOLBAR_HEIGHT, margin = TOOLBAR_MARGIN) => {
  return {
    x: Math.max(margin, Math.round((windowWidth - toolbarWidth) / 2)),
    y: Math.max(margin, windowHeight - toolbarHeight - margin)
  }
}

/**
 * Calculates bottom-left dock coordinates for the toolbar.
 * Positions toolbar 10px from the left edge and 10px above the bottom edge.
 */
export const getBottomLeftPosition = (windowHeight, toolbarHeight = TOOLBAR_HEIGHT, margin = TOOLBAR_MARGIN) => {
  return {
    x: margin,
    y: Math.max(margin, windowHeight - toolbarHeight - margin)
  }
}

/**
 * Evaluates whether a given (x, y) coordinate is within docking threshold of above-start-menu.
 */
export const isNearAboveStartMenu = (x, y, windowWidth, windowHeight, threshold = 50, toolbarWidth = TOOLBAR_WIDTH, toolbarHeight = TOOLBAR_HEIGHT, margin = TOOLBAR_MARGIN) => {
  const targetX = Math.round((windowWidth - toolbarWidth) / 2)
  const targetY = windowHeight - toolbarHeight - margin
  return Math.abs(x - targetX) <= threshold && Math.abs(y - targetY) <= threshold
}

/**
 * Evaluates whether a given (x, y) coordinate is within docking threshold of bottom-left.
 */
export const isNearBottomLeft = (x, y, windowHeight, threshold = 40, toolbarHeight = TOOLBAR_HEIGHT, margin = TOOLBAR_MARGIN) => {
  const targetY = windowHeight - toolbarHeight - margin
  return Math.abs(x - margin) <= threshold && Math.abs(y - targetY) <= threshold
}
