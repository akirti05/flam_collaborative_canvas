// server/rooms.js

export const rooms = new Map(); // roomId -> { users: Map(), canvas: null }

export function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { users: new Map(), canvas: null });
  }
  return rooms.get(roomId);
}

export function cleanupRoom(roomId) {
  const room = rooms.get(roomId);
  if (room && room.users.size === 0) {
    rooms.delete(roomId);
  }
}
