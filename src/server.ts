import { createServer } from "http";
import { Server } from "socket.io";
import { socketHandler } from "./socketHandler";

const PORT = 8080;

const origin =
  process.env.NODE_ENV === "production"
    ? [
        "https://main.d2wj3ci2d6hgbv.amplifyapp.com",
        "https://main.d2wj3ci2d6hgbv.amplifyapp.com/",
        "http://main.d2wj3ci2d6hgbv.amplifyapp.com:80",
        "https://main.d2wj3ci2d6hgbv.amplifyapp.com:433",
      ]
    : ["http://localhost:5173"];

const httpServer = createServer();

const io = new Server(httpServer, {
  path: "/battle-dice/",
  serveClient: false,
  cors: {
    origin,
    methods: ["GET", "POST"],
  },
});

console.log("Accepting origins:");
origin.forEach((val) => console.log(val));
console.log("------------ end cors ------------");

socketHandler(io);

httpServer.listen(PORT, "0.0.0.0");
