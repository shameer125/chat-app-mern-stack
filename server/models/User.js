import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 },
    profilePic: { type: String, default: "" },
    bio: { type: String, default: "Hey there! I am using QuickChat." },
    lastSeen: { type: Date, default: Date.now },
    about: { type: String, default: "Available" },
    pinnedChatIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    pinnedGroupIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
      default: [],
    },
    mutedUserIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    mutedGroupIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
      default: [],
    },
    starredMessageIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
      default: [],
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
