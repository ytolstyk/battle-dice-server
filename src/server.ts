import { Server } from "socket.io";
import { socketHandler } from "./socketHandler";

const PORT = 8080;

const io = new Server({
  path: "/battle-dice/",
  serveClient: false,
  cors: {
    // Configure CORS for Socket.IO if your client is on a different origin
    origin: ["*", "http://localhost:5173"],
    // origin: false,
    methods: ["GET", "POST"],
  },
});

socketHandler(io);

io.listen(PORT);
