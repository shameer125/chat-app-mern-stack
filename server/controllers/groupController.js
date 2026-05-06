import mongoose from "mongoose";
import Group from "../models/Group.js";
import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";
import {
  assertTextWithinLimit,
  normalizeMessageText,
} from "../lib/messageLimits.js";
import {
  emitToGroupMembers,
  emitToUserSocket,
  normIdSock,
} from "../socketRegistry.js";
import { simplifyDataUriForUpload } from "../lib/dataUrl.js";

const normId = normIdSock;

async function loadGroupForUser(groupId, userId) {
  const g = await Group.findById(groupId)
    .populate("members.user", "-password")
    .lean();
  if (!g) return null;
  const isMember = g.members.some(
    (m) => normId(m.user?._id || m.user) === normId(userId)
  );
  if (!isMember) return null;
  return g;
}

export const createGroup = async (req, res) => {
  try {
    const { name, memberIds = [], image, description } = req.body;
    const creatorId = req.user._id;

    if (!name || !String(name).trim()) {
      return res.json({ success: false, message: "Group name is required" });
    }

    const ids = new Set(
      [creatorId.toString(), ...memberIds.map((id) => normId(id))].filter(
        Boolean
      )
    );
    if (ids.size < 2) {
      return res.json({
        success: false,
        message: "Add at least one other person to the group",
      });
    }

    let imageUrl = "";
    if (image) {
      const up = await cloudinary.uploader.upload(image, { folder: "groups" });
      imageUrl = up.secure_url;
    }

    const members = [...ids].map((idStr) => ({
      user: new mongoose.Types.ObjectId(idStr),
      role: idStr === creatorId.toString() ? "admin" : "member",
    }));

    const group = await Group.create({
      name: String(name).trim(),
      description: description || "",
      image: imageUrl,
      createdBy: creatorId,
      members,
    });

    const populated = await Group.findById(group._id)
      .populate("members.user", "-password")
      .lean();

    emitToGroupMembers(populated, "groupCreated", { group: populated });

    res.json({ success: true, group: populated });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const getMyGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await Group.find({ "members.user": userId })
      .populate("members.user", "-password")
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ success: true, groups });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const getGroup = async (req, res) => {
  try {
    const g = await loadGroupForUser(req.params.id, req.user._id);
    if (!g) return res.json({ success: false, message: "Group not found" });
    res.json({ success: true, group: g });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const addGroupMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { memberIds = [] } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(id);
    if (!group) return res.json({ success: false, message: "Group not found" });

    const me = group.members.find((m) => normId(m.user) === normId(userId));
    if (!me || me.role !== "admin") {
      return res.json({
        success: false,
        message: "Only admins can add people",
      });
    }

    const existing = new Set(group.members.map((m) => normId(m.user)));
    for (const mid of memberIds) {
      const k = normId(mid);
      if (!k || !mongoose.Types.ObjectId.isValid(k)) continue;
      if (!existing.has(k)) {
        group.members.push({
          user: new mongoose.Types.ObjectId(k),
          role: "member",
        });
        existing.add(k);
      }
    }

    await group.save();
    const populated = await Group.findById(group._id)
      .populate("members.user", "-password")
      .lean();

    emitToGroupMembers(populated, "groupUpdated", { group: populated });

    res.json({ success: true, group: populated });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id);
    if (!group) return res.json({ success: false, message: "Group not found" });

    const idx = group.members.findIndex(
      (m) => normId(m.user) === normId(userId)
    );
    if (idx < 0) return res.json({ success: false, message: "Not a member" });

    group.members.splice(idx, 1);
    if (group.members.length === 0) {
      await Message.deleteMany({ groupId: group._id });
      await Group.findByIdAndDelete(group._id);
      return res.json({ success: true, left: true, deleted: true });
    }

    const hadAdmin = group.members.some((m) => m.role === "admin");
    if (!hadAdmin && group.members.length > 0) {
      group.members[0].role = "admin";
    }

    await group.save();
    const populated = await Group.findById(group._id)
      .populate("members.user", "-password")
      .lean();

    emitToGroupMembers(populated, "groupUpdated", { group: populated });

    res.json({ success: true, left: true, group: populated });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id);
    if (!group) return res.json({ success: false, message: "Group not found" });

    const m = group.members.find((x) => normId(x.user) === normId(userId));
    if (!m) return res.json({ success: false, message: "Not a member" });

    m.lastReadAt = new Date();
    await group.save();

    const messages = await Message.find({ groupId: id }).sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, image, audio, file, replyTo, type } = req.body;
    const senderId = req.user._id;

    const group = await Group.findById(id).populate("members.user", "-password");
    if (!group) return res.json({ success: false, message: "Group not found" });

    const isMember = group.members.some(
      (m) => normId(m.user?._id || m.user) === normId(senderId)
    );
    if (!isMember) return res.json({ success: false, message: "Not a member" });

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
          resource_type: "video",
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

    const newMessage = await Message.create({
      senderId,
      groupId: group._id,
      receiverId: null,
      text: normalizedText,
      image: imageUrl,
      audio: audioUrl,
      file: fileObj,
      replyTo: replyTo || undefined,
      type: messageType,
      status: "delivered",
      seen: false,
    });

    await Group.findByIdAndUpdate(group._id, { updatedAt: new Date() });

    const populatedGroup = group.toObject
      ? group.toObject()
      : JSON.parse(JSON.stringify(group));
    emitToGroupMembers(populatedGroup, "newMessage", newMessage, senderId);
    emitToUserSocket(senderId, "messageSent", newMessage);

    res.json({ success: true, newMessage, message: newMessage });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};
