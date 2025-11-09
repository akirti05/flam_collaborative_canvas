# Flam Collaborative Canvas

A real-time multi-user collaborative drawing application built using Vanilla JavaScript, HTML5 Canvas, Node.js, and Socket.io.  
Multiple users can draw simultaneously on the same canvas with synchronized updates, undo/redo functionality, and separate drawing rooms.

## Overview

The application demonstrates real-time data synchronization, event handling, and efficient canvas manipulation using native browser APIs.  
It focuses on raw implementation without frontend frameworks or third-party drawing libraries.

## Features

- Real-time drawing synchronization between connected users.
- Multiple brush types: pen, marker, paint, and eraser.
- Adjustable brush size and color picker.
- Global undo and redo functionality across all clients in a room.
- Room-based drawing sessions (users in different rooms have independent canvases).
- Connected user presence indicators with live online/offline updates.
- Persistent in-memory canvas state for newly joined users.
- Stable UI with a clear layout and aesthetic background.

## Tech Stack

| Layer | Technology |
|--------|-------------|
| Frontend | HTML5 Canvas, Vanilla JavaScript, Socket.io Client |
| Backend | Node.js, Express.js, Socket.io |
| Communication | WebSockets |
| State Management | In-memory storage via `rooms.js` and `drawing-state.js` |

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/<akirti05>/flam-canvas.git
   cd flam-canvas
