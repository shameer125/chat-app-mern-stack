import User from "../models/User.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";
import { simplifyDataUriForUpload } from "../lib/dataUrl.js";

// sign up a new user
export const signUp = async (req, res) => {
  const { fullName, email, password, bio } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }

    const emailNorm = String(email).trim().toLowerCase();

    const existingUser = await User.findOne({ email: emailNorm });

    if (existingUser) {
      return res.json({ success: false, message: "Account already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName: String(fullName).trim(),
      email: emailNorm,
      password: hashedPassword,
      bio,
    });

    const token = generateToken(newUser._id);

    const userData = await User.findById(newUser._id).select("-password");

    res.json({
      success: true,
      message: "Account created successfully",
      token,
      user: userData,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// login
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }

    const emailNorm = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: emailNorm });

    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    const userData = await User.findById(user._id).select("-password");

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// check user
export const checkUser = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// update profile
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName } = req.body;
    const userId = req.user._id;

    let updatedUser;

    if (profilePic) {
      const upload = await cloudinary.uploader.upload(
        simplifyDataUriForUpload(profilePic)
      );

      updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: upload.secure_url, bio, fullName },
        { new: true },
      );
    } else {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { bio, fullName },
        { new: true },
      );
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Error updating profile" });
  }
};

const MAX_PINNED_CHATS = 3;

// Pin / unpin a chat (WhatsApp-style, max 3)
export const togglePinChat = async (req, res) => {
  try {
    const rawId = req.params.id;
    if (!rawId || !mongoose.Types.ObjectId.isValid(rawId)) {
      return res.json({ success: false, message: "Invalid user" });
    }
    const otherId = new mongoose.Types.ObjectId(rawId);
    if (otherId.equals(req.user._id)) {
      return res.json({ success: false, message: "Cannot pin yourself" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const pins = [...(user.pinnedChatIds || [])].map((id) => id.toString());
    const key = otherId.toString();
    const idx = pins.indexOf(key);
    let nextPins;
    if (idx >= 0) {
      nextPins = pins.filter((_, i) => i !== idx);
    } else {
      if (pins.length >= MAX_PINNED_CHATS) {
        return res.json({
          success: false,
          message: `You can pin up to ${MAX_PINNED_CHATS} chats`,
        });
      }
      nextPins = [...pins, key];
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        pinnedChatIds: nextPins.map(
          (id) => new mongoose.Types.ObjectId(id)
        ),
      },
      { new: true }
    ).select("-password");

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const MAX_PINNED_GROUPS = 3;

export const togglePinGroup = async (req, res) => {
  try {
    const rawId = req.params.id;
    if (!rawId || !mongoose.Types.ObjectId.isValid(rawId)) {
      return res.json({ success: false, message: "Invalid group" });
    }
    const groupId = new mongoose.Types.ObjectId(rawId);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const pins = [...(user.pinnedGroupIds || [])].map((id) => id.toString());
    const key = groupId.toString();
    const idx = pins.indexOf(key);
    let nextPins;
    if (idx >= 0) {
      nextPins = pins.filter((_, i) => i !== idx);
    } else {
      if (pins.length >= MAX_PINNED_GROUPS) {
        return res.json({
          success: false,
          message: `You can pin up to ${MAX_PINNED_GROUPS} groups`,
        });
      }
      nextPins = [...pins, key];
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        pinnedGroupIds: nextPins.map((id) => new mongoose.Types.ObjectId(id)),
      },
      { new: true }
    ).select("-password");

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleMuteChat = async (req, res) => {
  try {
    const rawId = req.params.id;
    if (!rawId || !mongoose.Types.ObjectId.isValid(rawId)) {
      return res.json({ success: false, message: "Invalid user" });
    }
    const otherId = new mongoose.Types.ObjectId(rawId);
    if (otherId.equals(req.user._id)) {
      return res.json({ success: false, message: "Invalid chat" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.json({ success: false, message: "User not found" });

    const mutes = [...(user.mutedUserIds || [])].map((id) => id.toString());
    const key = otherId.toString();
    const idx = mutes.indexOf(key);
    const next =
      idx >= 0 ? mutes.filter((_, i) => i !== idx) : [...mutes, key];

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        mutedUserIds: next.map((id) => new mongoose.Types.ObjectId(id)),
      },
      { new: true }
    ).select("-password");

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleMuteGroup = async (req, res) => {
  try {
    const rawId = req.params.id;
    if (!rawId || !mongoose.Types.ObjectId.isValid(rawId)) {
      return res.json({ success: false, message: "Invalid group" });
    }
    const groupId = new mongoose.Types.ObjectId(rawId);

    const user = await User.findById(req.user._id);
    if (!user) return res.json({ success: false, message: "User not found" });

    const mutes = [...(user.mutedGroupIds || [])].map((id) => id.toString());
    const key = groupId.toString();
    const idx = mutes.indexOf(key);
    const next =
      idx >= 0 ? mutes.filter((_, i) => i !== idx) : [...mutes, key];

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        mutedGroupIds: next.map((id) => new mongoose.Types.ObjectId(id)),
      },
      { new: true }
    ).select("-password");

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
