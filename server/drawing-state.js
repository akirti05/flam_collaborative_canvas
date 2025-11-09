
/**
 * Update a room's canvas snapshot.
 * Saves the most recent drawing state for new users.
 */
export function updateCanvasState(room, newDataUrl) {
    room.canvas = newDataUrl;
  }
  
  /**
   * Retrieve the latest saved canvas snapshot.
   * Returns null if none exists.
   */
  export function getCanvasState(room) {
    return room.canvas || null;
  }
  
  /**
   * Clear the saved canvas snapshot for a room.
   */
  export function clearCanvasState(room) {
    room.canvas = null;
  }
  