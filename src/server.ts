import express from "express";
import * as http from "http";
import { Server } from "socket.io";
import { socketHandler } from "./socketHandler";

const PORT = 8080;

const app = express();

// Create an HTTP server instance using the Express app
const server = http.createServer(app);
// Create a Socket.IO server and pass the HTTP server instance to it
const io = new Server(server, {
  path: "/battle-dice/",
  cors: {
    // Configure CORS for Socket.IO if your client is on a different origin
    origin: ["*"],
    // origin: false,
    methods: ["GET", "POST"],
  },
});

app.get("/", (_req, res) => {
  res.send("<h1>Hey you - use API stuff</h1>");
  console.log("Received a request at /");
});

socketHandler(io);

server.listen(PORT, () => {
  console.log(`Running at localhost:${PORT}`);
});
