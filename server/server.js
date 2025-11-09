import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "https://flam-collaborative-canvas.vercel.app",
      "https://flam-collaborative-canvas-6idt.onrender.com",
      "http://localhost:3001"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const COLORS = ["#ff5a5f", "#1f7aff", "#22c55e", "#eab308", "#a855f7", "#06b6d4", "#ef4444", "#f97316"];
function pickColor() { return COLORS[Math.floor(Math.random() * COLORS.length)]; }

app.use("/client", express.static(path.join(__dirname, "../client")));
app.get("/", (_, res) => res.sendFile(path.join(__dirname, "../client/index.html")));

io.on("connection", (socket) => {
  const user = { id: socket.id, color: pickColor(), name: "User-" + socket.id.slice(0, 4) };
  socket.dataUser = user;

  console.log("🟢 Client connected:", user.name);
  io.emit("presence", Array.from(io.sockets.sockets.values()).map(s => s.dataUser));

  socket.on("draw", (data) => socket.broadcast.emit("draw", data));

  socket.on("clear", () => io.emit("clear"));

  socket.on("latency:ping", (t0) => socket.emit("latency:pong", t0));

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", user.name);
    io.emit("presence", Array.from(io.sockets.sockets.values()).map(s => s.dataUser));
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
