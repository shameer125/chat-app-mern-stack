import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import { getMessages, getUserForSidebar, markMessagesAsSeen } from "../controllers/messageController.js";

const messageRouter = express.Router();

messageRouter.get('/users', protectRoute, getUserForSidebar);
messageRouter.get('/:id', protectRoute, getMessages);
messageRouter.put('/mark/:id', protectRoute, markMessagesAsSeen);

export default messageRouter;