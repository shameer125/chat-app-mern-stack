import express from "express";
import cors from "cors";
import "dotenv/config";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRoutes from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

// initialize Socket.io server 
export const io = new Server(server, {
  cors: {origin: "*"}
})

// store online users
export const userSocket


app.use(express.json({ limit: "4mb" }));
app.use(cors());

// Routes setup 
app.use("/api/status", (req, res) => res.send("server is live"));
app.use("/api/auth", userRoutes)
app.use("/api/messages", messageRouter)

await connectDB();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
