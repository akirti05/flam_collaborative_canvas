let socket;

export function connect() {
  // ✅ Connect your frontend (Vercel) to backend (Render)
  const baseURL = "https://flam-collaborative-canvas-6idt.onrender.com";

  socket = io(baseURL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1500,
  });

  socket.on("connect", () => {
    console.log("✅ Connected to backend:", baseURL);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ WebSocket connection error:", err.message);
  });

  // Keep backend alive (health check)
  setInterval(() => {
    if (socket && socket.connected) {
      socket.emit("latency:ping", Date.now());
    }
  }, 5000);

  socket.on("latency:pong", () => {});
}

export function getSocket() {
  if (!socket) {
    console.warn("⚠️ Socket not initialized yet. Calling connect()...");
    connect();
  }
  return socket;
}
