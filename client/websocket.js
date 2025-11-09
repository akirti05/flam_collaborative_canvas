// client/websocket.js

let socket;

export function connect() {
  // Detect environment (local vs deployed)
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  // Automatically choose base URL
  const baseURL = isLocal
    ? "http://localhost:3001"
    : window.location.origin; // e.g., https://flam-collaborative-canvas.onrender.com

  // Initialize socket connection
  socket = io(baseURL, {
    transports: ["websocket"], // faster and reliable
  });

  console.log(`🔗 Connected to ${baseURL}`);

  // Internal latency health-check (silent)
  setInterval(() => socket.emit("latency:ping", Date.now()), 1000);

  socket.on("latency:pong", () => {
    // Silent — keeps socket connection alive
  });
}

export function getSocket() {
  return socket;
}
