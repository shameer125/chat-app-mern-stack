import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    emoji: { type: String, required: true },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    text: { type: String },
    image: { type: String },
    audio: { type: String },
    file: {
      url: { type: String },
      name: { type: String },
      size: { type: Number },
      mime: { type: String },
    },
    type: {
      type: String,
      enum: ["text", "image", "audio", "file", "call"],
      default: "text",
    },
    callInfo: {
      kind: { type: String, enum: ["audio", "video"] },
      status: { type: String, enum: ["missed", "rejected", "ended"] },
      duration: { type: Number, default: 0 },
    },
    replyTo: {
      _id: { type: mongoose.Schema.Types.ObjectId },
      text: { type: String },
      image: { type: String },
      audio: { type: String },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      type: { type: String },
    },
    reactions: { type: [reactionSchema], default: [] },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    seen: { type: Boolean, default: false },
    deletedForEveryone: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageSchema.index({ groupId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
