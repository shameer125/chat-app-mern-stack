import express from 'express';
import { protectRoute } from '../middleware/authMiddleware.js';
import { checkUser, login, signUp, updateProfile } from '../controllers/userController.js';

const userRoutes = express.Router();

userRoutes.post('/signup', signUp);
userRoutes.post('/login', login);
userRoutes.put('/update-profile', protectRoute, updateProfile);
userRoutes.get('/check', protectRoute, checkUser);


export default userRoutes;