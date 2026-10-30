// Touch screen and finger drawing manager for DrawPen

export const LARGE_PALM_MIN_LENGTH = 100
export const LARGE_PALM_MIN_AREA = 8000
export const STANDARD_PALM_MIN_LENGTH = 35
export const STANDARD_PALM_MIN_AREA = 2000

/**
 * Determines whether an input event should temporarily switch the tool to the eraser.
 * When drawWithTouchEnabled is true, normal finger contacts draw instead of erasing.
 */
export const shouldTreatAsEraser = (event, drawWithTouchEnabled = true) => {
  // Stylus eraser button (barrel button or eraser tip)
  if (event.pointerType === 'pen' && event.button === 5) {
    return true
  }

  // Mouse wheel / middle button click
  if (event.pointerType === 'mouse' && event.button === 1) {
    return true
  }

  // Touch screen input
  if (event.pointerType === 'touch') {
    const contactLength = Math.max(event.width || 0, event.height || 0)
    const contactArea = (event.width || 0) * (event.height || 0)

    if (drawWithTouchEnabled) {
      // Finger drawing is ENABLED:
      // Only an intentional flat palm or fist contact triggers the eraser
      return contactLength >= LARGE_PALM_MIN_LENGTH && contactArea >= LARGE_PALM_MIN_AREA
    }

    // Finger drawing is DISABLED (Pen-only / Palm rejection mode):
    // Standard contact threshold acts as palm rejection / eraser
    return contactLength >= STANDARD_PALM_MIN_LENGTH && contactArea >= STANDARD_PALM_MIN_AREA
  }

  return false
}

/**
 * Determines whether a touch event should be ignored completely.
 * Used when finger drawing is disabled and the user wants strict stylus-only input.
 */
export const shouldIgnoreTouch = (event, drawWithTouchEnabled = true) => {
  if (!drawWithTouchEnabled && event.pointerType === 'touch') {
    return true
  }
  return false
}

