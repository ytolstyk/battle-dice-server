import { createServer } from "http";
import { Server } from "socket.io";
import { socketHandler } from "./socketHandler";
import * as child from "child_process";

const PORT = Number(process.env.PORT) || 8080;
const HOST = "0.0.0.0";

const commitHash = child
  .execSync("git rev-parse --short HEAD")
  .toString()
  .trim();

console.log("*** COMMIT HASH ***");
console.log(`*** ${commitHash} ***`);
console.log(`*** COMMIT HASH ***`);

const origin =
  process.env.NODE_ENV === "production"
    ? [
        "https://main.d2wj3ci2d6hgbv.amplifyapp.com",
        "https://main.d2wj3ci2d6hgbv.amplifyapp.com/",
        "http://main.d2wj3ci2d6hgbv.amplifyapp.com:80",
        "https://main.d2wj3ci2d6hgbv.amplifyapp.com:433",
        "https://dicebattles.com",
        "https://dicebattles.com/",
        "http://dicebattles.com:80",
        "https://dicebattles.com:433",
        "https://www.dicebattles.com",
        "https://www.dicebattles.com/",
        "http://www.dicebattles.com:80",
        "https://www.dicebattles.com:433",
      ]
    : ["http://localhost:5173", "http://localhost:5174"];

const httpServer = createServer((_, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Please, use the API\n");
});

const io = new Server(httpServer, {
  path: "/battle-dice/",
  serveClient: false,
  cors: {
    origin,
    methods: ["GET", "POST"],
  },
});

console.log("------------ START CORS ------------");
console.log("Accepting origins:");
origin.forEach((val) => console.log(val));
console.log("------------ END CORS ------------");

socketHandler(io);

httpServer.listen(PORT, HOST);
