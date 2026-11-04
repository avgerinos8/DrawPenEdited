// Docking manager for DrawPen toolbar
export const TOOLBAR_HEIGHT = 60
export const TOOLBAR_WIDTH = 300
export const TOOLBAR_MARGIN = 10

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
 * Evaluates whether a given (x, y) coordinate is within docking threshold of bottom-left.
 */
export const isNearBottomLeft = (x, y, windowHeight, threshold = 60, toolbarHeight = TOOLBAR_HEIGHT, margin = TOOLBAR_MARGIN) => {
  const targetY = windowHeight - toolbarHeight - margin
  return Math.abs(x - margin) <= threshold && Math.abs(y - targetY) <= threshold
}
