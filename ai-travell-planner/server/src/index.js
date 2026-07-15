import http from "node:http";
import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();

console.log(process.env.AVIATIONSTACK_API_KEY);

import app from "./app.js";
import { connectDb } from "./config/db.js";
import { config } from "./config/env.js";
import { registerTravelSocket } from "./services/socketService.js";

// wraps the express server inside a http
const server = http.createServer(app);
//now attach the socket.io server to the http server   
const io = new Server(server, {
  cors: {
    origin: config.clientOrigin,
    credentials: true
  }
});

registerTravelSocket(io);

server.listen(config.port, () => {
  console.log(`Travel AI server listening on port ${config.port}`);
});

connectDb().catch((error) => {
  console.error(`MongoDB connection failed: ${error.message}`);
});
