import { getSocket } from "./websocket.js";

const canvas = document.getElementById("draw");
const overlay = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const octx = overlay.getContext("2d");

const brushEl = document.getElementById("brush");
const colorEl = document.getElementById("color");
const sizeEl = document.getElementById("size");
const clearBtn = document.getElementById("clear");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const presenceBar = document.getElementById("presenceBar");

const socket = getSocket();

// ===== Drawing state =====
let drawing = false;
let lastX = 0, lastY = 0;
const history = [];
const redoStack = [];
pushSnapshot();

const knownUsers = new Map(); // { id, name, color, online }
ctx.lineCap = "round";
ctx.lineJoin = "round";

/* ---------- Accurate mouse position ---------- */
function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();

  // Mouse position within the displayed canvas (CSS pixels)
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Scale from displayed size to actual drawing size
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: x * scaleX,
    y: y * scaleY
  };
}


/* ---------- Brush styles ---------- */
function drawLine(x1, y1, x2, y2, color, size, brush = "pencil") {
  ctx.save();

  if (brush === "pencil") {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

  } else if (brush === "marker") {
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

  } else if (brush === "paint") {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = color;
    for (let i = 0; i < 10; i++) {
      const ox = x2 + (Math.random() - 0.5) * size * 2;
      const oy = y2 + (Math.random() - 0.5) * size * 2;
      ctx.beginPath();
      ctx.arc(ox, oy, Math.max(1, size / 2), 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (brush === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = size * 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}

/* ---------- Drawing actions ---------- */
function startDrawing(e) {
  drawing = true;
  const pos = getMousePos(e);
  lastX = pos.x;
  lastY = pos.y;
}

function draw(e) {
  if (!drawing) return;
  const pos = getMousePos(e);
  const x2 = pos.x, y2 = pos.y;

  const color = colorEl.value;
  const size = Number(sizeEl.value);
  const brush = brushEl.value;

  drawLine(lastX, lastY, x2, y2, color, size, brush);
  socket.emit("draw", { x1: lastX, y1: lastY, x2, y2, color, size, brush });

  lastX = x2;
  lastY = y2;
}

function stopDrawing() {
  if (!drawing) return;
  drawing = false;
  pushSnapshot();
  socket.emit("syncCanvas", canvas.toDataURL("image/png"));
}

/* ---------- Event listeners ---------- */
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseout", stopDrawing);

/* ---------- Clear ---------- */
clearBtn.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pushSnapshot();
  socket.emit("clear");
  socket.emit("syncCanvas", canvas.toDataURL("image/png"));
});

/* ---------- Undo / Redo ---------- */
undoBtn.addEventListener("click", () => {
  if (history.length <= 1) return;
  const cur = history.pop();
  redoStack.push(cur);
  const prev = history[history.length - 1];
  drawFromDataURL(prev);
  socket.emit("syncCanvas", prev);
});

redoBtn.addEventListener("click", () => {
  if (!redoStack.length) return;
  const next = redoStack.pop();
  history.push(next);
  drawFromDataURL(next);
  socket.emit("syncCanvas", next);
});

/* ---------- Presence bar ---------- */
function renderPresence() {
  const frag = document.createDocumentFragment();
  const entries = Array.from(knownUsers.values()).sort((a, b) => a.name.localeCompare(b.name));
  entries.forEach(u => {
    const chip = document.createElement("span");
    chip.className = "badge";
    const dot = document.createElement("span");
    dot.className = "dot" + (u.online ? "" : " offline");
    const text = document.createTextNode(" " + u.name);
    chip.appendChild(dot);
    chip.appendChild(text);
    frag.appendChild(chip);
  });
  presenceBar.innerHTML = "";
  presenceBar.appendChild(frag);
}

// Refresh presence on connect so all users see each other
socket.emit("presence:refresh");

socket.on("presence", (users) => {
  const now = Date.now();
  for (const u of knownUsers.values()) u.online = false;

  users.forEach(u => {
    const entry = knownUsers.get(u.id) || { id: u.id, name: u.name, color: u.color, online: true, lastSeen: now };
    entry.online = true;
    entry.name = u.name;
    entry.color = u.color;
    entry.lastSeen = now;
    knownUsers.set(u.id, entry);
  });

  renderPresence();
});

/* ---------- Remote drawing & sync ---------- */
socket.on("draw", (d) => {
  drawLine(d.x1, d.y1, d.x2, d.y2, d.color, d.size, d.brush);
});

socket.on("clear", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pushSnapshot();
});

socket.on("syncCanvas", (dataUrl) => {
  drawFromDataURL(dataUrl);
  history.push(dataUrl);
  if (history.length > 100) history.splice(0, history.length - 100);
  redoStack.length = 0;
});

/* ---------- Cursor indicators ---------- */
const cursors = {};
canvas.addEventListener("mousemove", (e) => {
  const pos = getMousePos(e);
  socket.emit("cursor", { x: pos.x, y: pos.y });
});

socket.on("cursor", (data) => {
  cursors[data.id] = { x: data.x, y: data.y, color: data.color, t: Date.now() };
  paintCursors();
});

function paintCursors() {
  octx.clearRect(0, 0, overlay.width, overlay.height);
  const now = Date.now();
  for (const [id, c] of Object.entries(cursors)) {
    if (now - c.t > 1000) { delete cursors[id]; continue; }
    octx.beginPath();
    octx.arc(c.x, c.y, 3, 0, Math.PI * 2);
    octx.fillStyle = c.color;
    octx.fill();
  }
}

/* ---------- Helpers ---------- */
function pushSnapshot() {
  const dataUrl = canvas.toDataURL("image/png");
  history.push(dataUrl);
  if (history.length > 100) history.splice(0, history.length - 100);
  redoStack.length = 0;
}

function drawFromDataURL(dataUrl) {
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
  img.src = dataUrl;
}

/* ---------- Keyboard shortcuts ---------- */
window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    undoBtn.click();
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
    e.preventDefault();
    redoBtn.click();
  }
});
