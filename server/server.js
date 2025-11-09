import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { clearCanvasState, getCanvasState, updateCanvasState } from "./drawing-state.js";
import { cleanupRoom, getRoom } from "./rooms.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const COLORS = [
  "#ff5a5f", "#1f7aff", "#22c55e", "#eab308",
  "#a855f7", "#06b6d4", "#ef4444", "#f97316"
];

function pickColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// ===== Serve Static Files =====
app.use("/client", express.static(path.join(__dirname, "../client")));
app.get("/", (_, res) => res.sendFile(path.join(__dirname, "../client/index.html")));

// ===== Socket.io Setup =====
io.on("connection", (socket) => {
  // Room assignment (default: "global")
  const roomId = socket.handshake.query.room || "global";
  const room = getRoom(roomId);

  const user = { id: socket.id, color: pickColor(), name: "User-" + socket.id.slice(0, 4) };
  socket.dataUser = user;
  socket.join(roomId);
  room.users.set(socket.id, user);

  console.log(`🟢 ${user.name} connected to room ${roomId}`);

  // Send existing presence list
  io.to(roomId).emit("presence", Array.from(room.users.values()));

  // Send latest saved canvas if available
  const existingCanvas = getCanvasState(room);
  if (existingCanvas) socket.emit("syncCanvas", existingCanvas);

  // ===== Drawing Logic =====
  socket.on("draw", (data) => socket.to(roomId).emit("draw", data));

  socket.on("clear", () => {
    clearCanvasState(room);
    io.to(roomId).emit("clear");
  });

  socket.on("syncCanvas", (dataUrl) => {
    updateCanvasState(room, dataUrl);
    socket.to(roomId).emit("syncCanvas", dataUrl);
  });

  // ===== Cursor (live pointer tracking) =====
  socket.on("cursor", (pos) => {
    socket.to(roomId).emit("cursor", { ...pos, id: socket.id, color: user.color });
  });

  // ===== Disconnect =====
  socket.on("disconnect", () => {
    console.log(`🔴 ${user.name} disconnected from ${roomId}`);
    room.users.delete(socket.id);
    io.to(roomId).emit("presence", Array.from(room.users.values()));
    cleanupRoom(roomId);
  });
});

// ===== Start Server =====
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
