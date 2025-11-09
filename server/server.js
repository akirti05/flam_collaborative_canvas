import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

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
  const user = { id: socket.id, color: pickColor(), name: "User-" + socket.id.slice(0, 4) };
  socket.dataUser = user;

  console.log(`🟢 ${user.name} connected`);

  // Notify all clients of presence
  io.emit("presence", Array.from(io.sockets.sockets.values()).map(s => s.dataUser));

  // Drawing events
  socket.on("draw", (data) => {
    socket.broadcast.emit("draw", data);
  });

  socket.on("clear", () => {
    io.emit("clear");
  });

  // Cursor updates
  socket.on("cursor", (pos) => {
    socket.broadcast.emit("cursor", {
      id: socket.id,
      ...pos,
      color: socket.dataUser.color,
      name: socket.dataUser.name,
    });
  });

  // Latency ping-pong (keeps connection alive)
  socket.on("latency:ping", (t0) => socket.emit("latency:pong", t0));

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`🔴 ${user.name} disconnected`);
    io.emit("presence", Array.from(io.sockets.sockets.values()).map(s => s.dataUser));
  });
});

// ===== Start Server =====
const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
