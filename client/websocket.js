let socket;

export function connect() {
  socket = io("http://localhost:3001", { transports: ["websocket"] });

  // internal latency (not shown)
  setInterval(() => socket.emit("latency:ping", Date.now()), 1000);
  socket.on("latency:pong", () => { /* keep for health-check */ });
}

export function getSocket() { return socket; }
