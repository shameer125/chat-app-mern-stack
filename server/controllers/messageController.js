import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";
import { emitToGroupMembers, emitToUserSocket } from "../socketRegistry.js";
import {
  assertTextWithinLimit,
  normalizeMessageText,
  EDIT_MESSAGE_WINDOW_MS,
} from "../lib/messageLimits.js";
import { simplifyDataUriForUpload } from "../lib/dataUrl.js";

const normId = (id) => (id == null ? "" : String(id));

async function userCanAccessMessage(userId, msg) {
  if (!msg) return false;
  const uid = normId(userId);
  if (msg.groupId) {
    const g = await Group.findOne({
      _id: msg.groupId,
      members: { $elemMatch: { user: userId } },
    }).lean();
    return !!g;
  }
  return normId(msg.senderId) === uid || normId(msg.receiverId) === uid;
}

function dmThreadFilter(uidA, uidB) {
  return {
    $and: [
      {
        $or: [
          { senderId: uidA, receiverId: uidB },
          { senderId: uidB, receiverId: uidA },
        ],
      },
      { $or: [{ groupId: null }, { groupId: { $exists: false } }] },
    ],
  };
}

// ---------- USERS FOR SIDEBAR ----------
export const getUserForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: userId } }).select(
      "-password"
    );

    const unseenMessages = {};
    const lastMessages = {};

    await Promise.all(
      filteredUsers.map(async (user) => {
        const unseen = await Message.countDocuments({
          senderId: user._id,
          receiverId: userId,
          groupId: null,
          status: { $ne: "read" },
        });
        if (unseen > 0) unseenMessages[user._id] = unseen;

        const last = await Message.findOne(dmThreadFilter(user._id, userId))
          .sort({ createdAt: -1 })
          .lean();
        if (last) lastMessages[user._id] = last;
      })
    );

    const groups = await Group.find({ "members.user": userId })
      .populate("members.user", "-password")
      .sort({ updatedAt: -1 })
      .lean();

    const lastGroupMessages = {};
    const unseenGroupMessages = {};

    await Promise.all(
      groups.map(async (g) => {
        const gid = g._id.toString();
        const member = g.members.find(
          (m) => normId(m.user?._id || m.user) === normId(userId)
        );
        const after = member?.lastReadAt || new Date(0);

        const last = await Message.findOne({ groupId: g._id })
          .sort({ createdAt: -1 })
          .lean();
        if (last) lastGroupMessages[gid] = last;

        const unseen = await Message.countDocuments({
          groupId: g._id,
          senderId: { $ne: userId },
          createdAt: { $gt: after },
        });
        if (unseen > 0) unseenGroupMessages[gid] = unseen;
      })
    );

    res.json({
      success: true,
      users: filteredUsers,
      unseenMessages,
      lastMessages,
      groups,
      lastGroupMessages,
      unseenGroupMessages,
    });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ---------- GET MESSAGES ----------
export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $and: [
        {
          $or: [
            { senderId: myId, receiverId: selectedUserId },
            { senderId: selectedUserId, receiverId: myId },
          ],
        },
        { $or: [{ groupId: null }, { groupId: { $exists: false } }] },
      ],
    }).sort({ createdAt: 1 });

    await Message.updateMany(
      {
        senderId: selectedUserId,
        receiverId: myId,
        groupId: null,
        status: { $ne: "read" },
      },
      { $set: { status: "read", seen: true } }
    );
    
    const senderSocketId = userSocketMap[normId(selectedUserId)];
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", { by: myId.toString() });
    }

    res.json({ success: true, messages });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ---------- MARK SEEN BY ID ----------
export const markMessagesAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { status: "read", seen: true });
    res.json({ success: true });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ---------- SEND MESSAGE ----------
export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio, file, replyTo, type } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    let imageUrl;
    let audioUrl;
    let fileObj;

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(
        simplifyDataUriForUpload(image)
      );
      imageUrl = uploadResponse.secure_url;
    }

    if (audio) {
      const uploadResponse = await cloudinary.uploader.upload(
        simplifyDataUriForUpload(audio),
        {
          resource_type: "video", // cloudinary uses 'video' for audio
          folder: "voice-notes",
        }
      );
      audioUrl = uploadResponse.secure_url;
    }

    if (file && file.data) {
      const uploadResponse = await cloudinary.uploader.upload(
        simplifyDataUriForUpload(file.data),
        {
          resource_type: "auto",
          folder: "files",
        }
      );
      fileObj = {
        url: uploadResponse.secure_url,
        name: file.name,
        size: file.size,
        mime: file.mime,
      };
    }

    const messageType = type
      ? type
      : audioUrl
      ? "audio"
      : imageUrl
      ? "image"
      : fileObj
      ? "file"
      : "text";

    let normalizedText = text;
    if (text != null && text !== "") {
      const err = assertTextWithinLimit(text);
      if (err) return res.json({ success: false, message: err });
      normalizedText = normalizeMessageText(text);
    }

    const isReceiverOnline = !!userSocketMap[normId(receiverId)];

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: normalizedText,
      image: imageUrl,
      audio: audioUrl,
      file: fileObj,
      replyTo: replyTo || undefined,
      type: messageType,
      status: isReceiverOnline ? "delivered" : "sent",
    });

    const receiverSocketId = userSocketMap[normId(receiverId)];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    const senderSocketId = userSocketMap[normId(senderId)];
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageSent", newMessage);
    }

    res.json({ success: true, newMessage, message: newMessage });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ---------- DELETE MESSAGE ----------
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { forEveryone } = req.body;
    const userId = req.user._id;

    const msg = await Message.findById(id);
    if (!msg) return res.json({ success: false, message: "Not found" });

    if (msg.senderId.toString() !== userId.toString() && forEveryone) {
      return res.json({ success: false, message: "Not allowed" });
    }

    if (forEveryone) {
      msg.deletedForEveryone = true;
      msg.text = "";
      msg.image = "";
      msg.audio = "";
      msg.file = undefined;
      await msg.save();

      if (msg.groupId) {
        const group = await Group.findById(msg.groupId)
          .populate("members.user", "-password")
          .lean();
        if (group) {
          emitToGroupMembers(group, "messageDeleted", { messageId: id });
        }
      } else {
        const otherId =
          msg.senderId.toString() === userId.toString()
            ? msg.receiverId
            : msg.senderId;
        const targetSocketId = userSocketMap[normId(otherId)];
        if (targetSocketId) {
          io.to(targetSocketId).emit("messageDeleted", { messageId: id });
        }
        const ownSocketId = userSocketMap[normId(userId)];
        if (ownSocketId) {
          io.to(ownSocketId).emit("messageDeleted", { messageId: id });
        }
      }
    } else {
      await Message.findByIdAndDelete(id);
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ---------- REACT TO MESSAGE ----------
export const reactToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const msg = await Message.findById(id);
    if (!msg) return res.json({ success: false, message: "Not found" });

    const existing = msg.reactions.find(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existing) {
      if (existing.emoji === emoji) {
        msg.reactions = msg.reactions.filter(
          (r) => r.userId.toString() !== userId.toString()
        );
      } else {
        existing.emoji = emoji;
      }
    } else if (emoji) {
      msg.reactions.push({ userId, emoji });
    }

    await msg.save();

    if (msg.groupId) {
      const group = await Group.findById(msg.groupId)
        .populate("members.user", "-password")
        .lean();
      if (group) {
        emitToGroupMembers(group, "messageReacted", {
          messageId: id,
          reactions: msg.reactions,
        });
      }
    } else {
      const otherId =
        msg.senderId.toString() === userId.toString()
          ? msg.receiverId
          : msg.senderId;
      const targetSocketId = userSocketMap[normId(otherId)];
      if (targetSocketId) {
        io.to(targetSocketId).emit("messageReacted", {
          messageId: id,
          reactions: msg.reactions,
        });
      }
    }

    res.json({ success: true, reactions: msg.reactions });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

const MAX_STARRED_MESSAGES = 100;

// ---------- STARRED MESSAGES ----------
export const getStarredMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).lean();
    const ids = user?.starredMessageIds || [];
    if (!ids.length) {
      return res.json({ success: true, messages: [] });
    }

    const msgs = await Message.find({ _id: { $in: ids } })
      .sort({ createdAt: -1 })
      .limit(MAX_STARRED_MESSAGES)
      .lean();

    const filtered = [];
    for (const m of msgs) {
      if (await userCanAccessMessage(userId, m)) filtered.push(m);
    }

    res.json({ success: true, messages: filtered });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const toggleStarMessage = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.json({ success: false, message: "Not found" });
    if (!(await userCanAccessMessage(req.user._id, msg))) {
      return res.json({ success: false, message: "Not allowed" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.json({ success: false, message: "User not found" });

    const stars = [...(user.starredMessageIds || [])].map((x) => x.toString());
    const key = msg._id.toString();
    const idx = stars.indexOf(key);
    let next;
    if (idx >= 0) {
      next = stars.filter((_, i) => i !== idx);
    } else {
      if (stars.length >= MAX_STARRED_MESSAGES) {
        return res.json({
          success: false,
          message: `You can star up to ${MAX_STARRED_MESSAGES} messages`,
        });
      }
      next = [...stars, key];
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        starredMessageIds: next.map(
          (id) => new mongoose.Types.ObjectId(id)
        ),
      },
      { new: true }
    ).select("-password");

    res.json({ success: true, user: updatedUser, starred: idx < 0 });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ---------- EDIT MESSAGE (text, short window, sender only) ----------
export const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text: rawText } = req.body;
    const userId = req.user._id;

    const text = normalizeMessageText(rawText ?? "");
    if (!text) {
      return res.json({ success: false, message: "Text required" });
    }
    const lenErr = assertTextWithinLimit(text);
    if (lenErr) return res.json({ success: false, message: lenErr });

    const msg = await Message.findById(id);
    if (!msg) return res.json({ success: false, message: "Not found" });
    if (normId(msg.senderId) !== normId(userId)) {
      return res.json({ success: false, message: "Not allowed" });
    }
    if (msg.deletedForEveryone || msg.type !== "text") {
      return res.json({ success: false, message: "Cannot edit this message" });
    }

    const age = Date.now() - new Date(msg.createdAt).getTime();
    if (age > EDIT_MESSAGE_WINDOW_MS) {
      return res.json({ success: false, message: "Edit window expired (15 min)" });
    }

    msg.text = text;
    msg.editedAt = new Date();
    await msg.save();

    const payload = {
      messageId: id,
      text: msg.text,
      editedAt: msg.editedAt,
    };

    if (msg.groupId) {
      const group = await Group.findById(msg.groupId)
        .populate("members.user", "-password")
        .lean();
      if (group) emitToGroupMembers(group, "messageEdited", payload);
    } else {
      emitToUserSocket(msg.receiverId, "messageEdited", payload);
      emitToUserSocket(msg.senderId, "messageEdited", payload);
    }

    res.json({ success: true, message: msg });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ---------- LOG CALL ----------
export const logCall = async (req, res) => {
  try {
    const { receiverId, kind, status, duration } = req.body;
    const senderId = req.user._id;

    const newMessage = await Message.create({
      senderId,
      receiverId,
      type: "call",
      callInfo: { kind, status, duration: duration || 0 },
      status: "delivered",
    });

    const receiverSocketId = userSocketMap[normId(receiverId)];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    const senderSocketId = userSocketMap[normId(senderId)];
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageSent", newMessage);
    }

    res.json({ success: true, newMessage });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};
