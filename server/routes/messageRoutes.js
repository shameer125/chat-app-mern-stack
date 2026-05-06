import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
  deleteMessage,
  getMessages,
  getUserForSidebar,
  logCall,
  markMessagesAsSeen,
  reactToMessage,
  sendMessage,
  getStarredMessages,
  toggleStarMessage,
  editMessage,
} from "../controllers/messageController.js";

const messageRouter = express.Router();

messageRouter.get("/users", protectRoute, getUserForSidebar);
messageRouter.get("/starred", protectRoute, getStarredMessages);
messageRouter.put("/edit/:id", protectRoute, editMessage);
messageRouter.post("/star/:id", protectRoute, toggleStarMessage);
messageRouter.post("/call/log", protectRoute, logCall);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.put("/mark/:id", protectRoute, markMessagesAsSeen);
messageRouter.post("/send/:id", protectRoute, sendMessage);
messageRouter.delete("/:id", protectRoute, deleteMessage);
messageRouter.post("/react/:id", protectRoute, reactToMessage);

export default messageRouter;
