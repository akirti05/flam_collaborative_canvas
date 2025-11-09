import { connect } from "./websocket.js";
connect();
setTimeout(() => import("./canvas.js"), 200);
