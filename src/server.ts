import { Server } from "socket.io";
import { socketHandler } from "./socketHandler";

const PORT = 8080;

const origin =
  process.env.NODE_ENV === "production"
    ? ["https://main.d2wj3ci2d6hgbv.amplifyapp.com/"]
    : ["http://localhost:5173"];

const io = new Server({
  path: "/battle-dice/",
  serveClient: false,
  cors: {
    origin,
    methods: ["GET", "POST"],
  },
});

socketHandler(io);

io.listen(PORT);
