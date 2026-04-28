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
export const userSocketMap = {};  // {userId : socketId}

// socket.io connection string

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connceted", userId);

  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User Disconnected", userId);
    delete userSocketMap[userId]
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  })
  
})


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
