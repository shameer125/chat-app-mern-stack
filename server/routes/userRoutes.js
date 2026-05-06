import express from "express";
import rateLimit from "express-rate-limit";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
  checkUser,
  login,
  signUp,
  updateProfile,
  togglePinChat,
  togglePinGroup,
  toggleMuteChat,
  toggleMuteGroup,
} from "../controllers/userController.js";

const userRoutes = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

userRoutes.post("/signup", authLimiter, signUp);
userRoutes.post("/login", authLimiter, login);
userRoutes.put("/update-profile", protectRoute, updateProfile);
userRoutes.put("/pin-chat/:id", protectRoute, togglePinChat);
userRoutes.put("/pin-group/:id", protectRoute, togglePinGroup);
userRoutes.put("/mute-chat/:id", protectRoute, toggleMuteChat);
userRoutes.put("/mute-group/:id", protectRoute, toggleMuteGroup);
userRoutes.get("/check", protectRoute, checkUser);

export default userRoutes;
