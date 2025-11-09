let socket;

export function connect() {
  const serverURL =
    window.location.hostname === "localhost"
      ? "http://localhost:3001"
      : window.location.origin;

  socket = io(serverURL, { transports: ["websocket"] });

  // keep alive
  setInterval(() => socket.emit("latency:ping", Date.now()), 1000);
  socket.on("latency:pong", () => {});
}

export function getSocket() {
  return socket;
}
