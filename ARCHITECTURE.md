
# System Architecture – Flam Collaborative Canvas

## Overview

Flam Collaborative Canvas is a real-time collaborative drawing system where multiple users can interact with the same canvas in real time.  
The system uses WebSockets to handle bidirectional communication between the client and server, ensuring instant synchronization of drawing events.

## Data Flow

1. A user performs an action on the canvas (draw, clear, undo, redo).
2. The client captures this action in `canvas.js` and sends it through Socket.io to the backend.
3. The backend receives the event, identifies the room, and broadcasts it to other connected clients.
4. Other clients receive the event and update their canvases accordingly.
5. The latest canvas snapshot is stored in memory (`drawing-state.js`) for state recovery when new users join.


## WebSocket Events

| Event | Direction | Payload | Description |
|--------|------------|----------|--------------|
| `draw` | Client → Server | `{x1, y1, x2, y2, color, size, brush}` | Broadcasts a drawn line segment. |
| `clear` | Client ↔ Server | none | Clears the shared canvas for all users. |
| `syncCanvas` | Client ↔ Server | `{ dataUrl }` | Sends or restores the full canvas image. |
| `cursor` | Client ↔ Server | `{ x, y }` | Tracks user cursor positions. |
| `presence` | Server → Clients | `[ {id, name, color} ]` | Lists active users in the room. |
| `globalUndoRedo` | Client ↔ Server | `{ dataUrl }` | Syncs undo/redo changes across all users. |
| `disconnect` | Built-in | none | Removes user and updates presence list. |


## Undo and Redo Strategy

- Each client maintains a local history stack of canvas snapshots.
- On undo or redo, the client sends the updated snapshot (`dataUrl`) to the server.
- The server broadcasts this new state to all other users in the same room.
- Each client updates its canvas using the received image, ensuring synchronized global state.

## Room Management

- Rooms are created dynamically using the `rooms.js` module.
- Each room maintains a user list and an associated canvas state.
- A room object structure is as follows:

```js
{
  users: Map<socketId, user>,
  canvas: <latestDataUrl>
}
