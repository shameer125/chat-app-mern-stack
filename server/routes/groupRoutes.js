import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
  addGroupMembers,
  createGroup,
  getGroup,
  getGroupMessages,
  getMyGroups,
  leaveGroup,
  sendGroupMessage,
} from "../controllers/groupController.js";

const router = express.Router();

router.get("/my", protectRoute, getMyGroups);
router.post("/", protectRoute, createGroup);
router.get("/:id/messages", protectRoute, getGroupMessages);
router.post("/:id/messages", protectRoute, sendGroupMessage);
router.put("/:id/members", protectRoute, addGroupMembers);
router.post("/:id/leave", protectRoute, leaveGroup);
router.get("/:id", protectRoute, getGroup);


export default router;
