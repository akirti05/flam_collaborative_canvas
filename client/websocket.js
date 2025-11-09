let socket;

export function connect() {
  // Automatically detect environment (local vs deployed)
  const isLocal = window.location.hostname === "localhost";
  const baseURL = isLocal
    ? "http://localhost:10000" // 👈 your working local backend
    : "https://flam-collaborative-canvas-6idt.onrender.com"; // 👈 your Render backend URL

  console.log("Connecting to backend:", baseURL);

  socket = io(baseURL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1500,
  });

  socket.on("connect", () => {
    console.log("✅ Connected to backend");
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Connection error:", err.message);
  });

  // Keep connection alive silently
  setInterval(() => {
    if (socket && socket.connected) {
      socket.emit("latency:ping", Date.now());
    }
  }, 5000);

  socket.on("latency:pong", () => {});
}

export function getSocket() {
  return socket;
}
