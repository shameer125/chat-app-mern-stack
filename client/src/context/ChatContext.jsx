/* eslint-disable react-refresh/only-export-components */
import {
  useContext,
  useState,
  createContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import { idEq, sid, previewText } from "../lib/utils";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [unseenGroupMessages, setUnseenGroupMessages] = useState({});
  const [lastMessages, setLastMessages] = useState({});
  const [lastGroupMessages, setLastGroupMessages] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [groupTypingUsers, setGroupTypingUsers] = useState({});
  const [replyTo, setReplyTo] = useState(null);
  const [search, setSearch] = useState("");

  const { socket, axios, authUser } = useContext(AuthContext);
  const selectedUserRef = useRef(null);
  const selectedGroupRef = useRef(null);
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);
  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
  }, [selectedGroup]);

  const openDM = useCallback((user) => {
    setSelectedGroup(null);
    setSelectedUser(user);
  }, []);

  const openGroup = useCallback((group) => {
    setSelectedUser(null);
    setSelectedGroup(group);
  }, []);

  const clearChatSelection = useCallback(() => {
    setSelectedUser(null);
    setSelectedGroup(null);
  }, []);

  // ---------------- USERS + GROUPS ----------------
  const getUsers = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users || []);
        setUnseenMessages(data.unseenMessages || {});
        setLastMessages(data.lastMessages || {});
        setGroups(data.groups || []);
        setLastGroupMessages(data.lastGroupMessages || {});
        setUnseenGroupMessages(data.unseenGroupMessages || {});
      }
    } catch {
      // silent
    }
  }, [axios]);

  // ---------------- GET MESSAGES (DM) ----------------
  const getMessages = useCallback(
    async (userId) => {
      try {
        const { data } = await axios.get(`/api/messages/${userId}`);
        if (data.success) {
          setMessages(data.messages || []);
          setUnseenMessages((prev) => {
            const c = { ...prev };
            delete c[sid(userId)];
            return c;
          });
          if (socket) socket.emit("messagesRead", { from: sid(userId) });
        }
      } catch (error) {
        toast.error(error.message);
      }
    },
    [axios, socket]
  );

  const getGroupMessages = useCallback(
    async (groupId) => {
      try {
        const { data } = await axios.get(`/api/groups/${groupId}/messages`);
        if (data.success) {
          setMessages(data.messages || []);
          const gk = sid(groupId);
          setUnseenGroupMessages((prev) => {
            const c = { ...prev };
            delete c[gk];
            return c;
          });
        }
      } catch (error) {
        toast.error(error.message);
      }
    },
    [axios]
  );

  // ---------------- SEND MESSAGE (DM) ----------------
  const sendMessage = async (messageData) => {
    try {
      if (!selectedUser?._id) return;

      const payload = { ...messageData };
      if (replyTo) {
        payload.replyTo = {
          _id: replyTo._id,
          text: replyTo.text,
          image: replyTo.image,
          audio: replyTo.audio,
          senderId: replyTo.senderId,
          type: replyTo.type,
        };
      }

      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        payload
      );

      if (!data.success) {
        toast.error(data.message || "Send failed");
        return;
      }

      const newMsg = data.newMessage || data.message;
      if (!newMsg) return;

      setMessages((prev) => [...prev, newMsg]);
      setLastMessages((prev) => ({ ...prev, [sid(selectedUser._id)]: newMsg }));
      setReplyTo(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendGroupMessage = async (messageData) => {
    try {
      if (!selectedGroup?._id) return;
      const gid = sid(selectedGroup._id);

      const payload = { ...messageData };
      if (replyTo) {
        payload.replyTo = {
          _id: replyTo._id,
          text: replyTo.text,
          image: replyTo.image,
          audio: replyTo.audio,
          senderId: replyTo.senderId,
          type: replyTo.type,
        };
      }

      const { data } = await axios.post(
        `/api/groups/${gid}/messages`,
        payload
      );

      if (!data.success) {
        toast.error(data.message || "Send failed");
        return;
      }

      const newMsg = data.newMessage || data.message;
      if (!newMsg) return;

      setMessages((prev) => [...prev, newMsg]);
      setLastGroupMessages((prev) => ({ ...prev, [gid]: newMsg }));
      setReplyTo(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const addGroupMembers = async (groupId, memberIds) => {
    const { data } = await axios.put(`/api/groups/${sid(groupId)}/members`, {
      memberIds,
    });
    if (!data.success) {
      toast.error(data.message || "Could not add members");
      return null;
    }
    const g = data.group;
    setGroups((prev) =>
      prev.map((x) => (sid(x._id) === sid(g._id) ? g : x))
    );
    if (selectedGroup && sid(selectedGroup._id) === sid(g._id)) {
      setSelectedGroup(g);
    }
    toast.success("Members added");
    return g;
  };

  const leaveGroup = async (groupId) => {
    const { data } = await axios.post(`/api/groups/${sid(groupId)}/leave`);
    if (!data.success) {
      toast.error(data.message || "Could not leave");
      return;
    }
    await getUsers();
    if (selectedGroup && sid(selectedGroup._id) === sid(groupId)) {
      clearChatSelection();
      setMessages([]);
    }
    toast.success(data.deleted ? "Group deleted" : "You left the group");
  };

  // ---------------- DELETE MESSAGE ----------------
  const deleteMessage = async (id, forEveryone = false) => {
    try {
      const { data } = await axios.delete(`/api/messages/${id}`, {
        data: { forEveryone },
      });
      if (data.success) {
        if (forEveryone) {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === id
                ? {
                    ...m,
                    deletedForEveryone: true,
                    text: "",
                    image: "",
                    audio: "",
                  }
                : m
            )
          );
        } else {
          setMessages((prev) => prev.filter((m) => m._id !== id));
        }
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ---------------- REACT ----------------
  const reactToMessage = async (id, emoji) => {
    try {
      const { data } = await axios.post(`/api/messages/react/${id}`, { emoji });
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === id ? { ...m, reactions: data.reactions } : m
          )
        );
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const editMessageText = async (messageId, text) => {
    try {
      const { data } = await axios.put(`/api/messages/edit/${messageId}`, {
        text,
      });
      if (!data.success) {
        toast.error(data.message || "Could not edit");
        return;
      }
      const msg = data.message;
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, text: msg.text, editedAt: msg.editedAt }
            : m
        )
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Edit failed"
      );
    }
  };

  // ---------------- LOG CALL ----------------
  const logCall = async ({ receiverId, kind, status, duration }) => {
    try {
      await axios.post("/api/messages/call/log", {
        receiverId,
        kind,
        status,
        duration,
      });
    } catch {
      // silent
    }
  };

  // ---------------- TYPING ----------------
  const sendTyping = (to, isTyping) => {
    if (!socket || to == null) return;
    socket.emit(isTyping ? "typing" : "stopTyping", { to: sid(to) });
  };

  const sendGroupTyping = (groupId, isTyping) => {
    if (!socket || groupId == null) return;
    const gid = sid(groupId);
    socket.emit(isTyping ? "typingGroup" : "stopTypingGroup", { groupId: gid });
  };

  // Join / leave group socket room for typing
  useEffect(() => {
    if (!socket) return;
    const g = selectedGroupRef.current;
    if (g?._id) {
      const gid = sid(g._id);
      socket.emit("joinGroupRoom", { groupId: gid });
      return () => {
        socket.emit("leaveGroupRoom", { groupId: gid });
      };
    }
    return undefined;
  }, [socket, selectedGroup?._id]);

  // ---------------- SOCKET EVENTS ----------------
  useEffect(() => {
    if (!socket) return;

    const tryDesktopNotify = (newMessage, { isGroup, groupIdStr, inThisChat }) => {
      if (typeof Notification === "undefined") return;
      if (Notification.permission !== "granted") return;
      if (idEq(newMessage.senderId, authUser?._id)) return;

      if (isGroup) {
        if (
          (authUser?.mutedGroupIds || []).some((id) => sid(id) === groupIdStr)
        ) {
          return;
        }
      } else if (
        (authUser?.mutedUserIds || []).some(
          (id) => sid(id) === sid(newMessage.senderId)
        )
      ) {
        return;
      }

      if (inThisChat && document.visibilityState === "visible") return;

      try {
        const title = isGroup ? "Group message" : "QuickChat";
        const body = previewText(newMessage).slice(0, 160) || "New activity";
        new Notification(title, { body });
      } catch {
        /* ignore */
      }
    };

    const handleNewMessage = (newMessage) => {
      const isGroup = !!newMessage.groupId;
      const gid = newMessage.groupId ? sid(newMessage.groupId) : null;

      if (isGroup) {
        const currentG = selectedGroupRef.current;
        const isChatOpen = currentG && sid(currentG._id) === gid;

        setLastGroupMessages((prev) => ({ ...prev, [gid]: newMessage }));

        if (isChatOpen) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === newMessage._id)) return prev;
            return [...prev, newMessage];
          });
        } else if (!idEq(newMessage.senderId, authUser?._id)) {
          setUnseenGroupMessages((prev) => ({
            ...prev,
            [gid]: (prev[gid] || 0) + 1,
          }));
        }

        const inThisChat = currentG && sid(currentG._id) === gid;
        tryDesktopNotify(newMessage, {
          isGroup: true,
          groupIdStr: gid,
          inThisChat,
        });

        return;
      }

      const current = selectedUserRef.current;
      const isChatOpen =
        current &&
        (idEq(newMessage.senderId, current._id) ||
          idEq(newMessage.receiverId, current._id));

      const otherId = idEq(newMessage.senderId, authUser?._id)
        ? sid(newMessage.receiverId)
        : sid(newMessage.senderId);

      if (isChatOpen) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });
        if (idEq(newMessage.senderId, current._id)) {
          socket.emit("messagesRead", { from: sid(current._id) });
          axios.put(`/api/messages/mark/${newMessage._id}`).catch(() => {});
        }
      } else if (!idEq(newMessage.senderId, authUser?._id)) {
        const senderKey = sid(newMessage.senderId);
        setUnseenMessages((prev) => ({
          ...prev,
          [senderKey]: (prev[senderKey] || 0) + 1,
        }));
        if (socket && newMessage.senderId) {
          socket.emit("messageDelivered", {
            messageId: newMessage._id,
            senderId: sid(newMessage.senderId),
          });
        }
      }

      const inThisChat =
        current &&
        (idEq(newMessage.senderId, current._id) ||
          idEq(newMessage.receiverId, current._id));
      tryDesktopNotify(newMessage, {
        isGroup: false,
        groupIdStr: "",
        inThisChat,
      });

      setLastMessages((prev) => ({ ...prev, [otherId]: newMessage }));
    };

    const handleMessageSent = (msg) => {
      if (msg.groupId) {
        const gid = sid(msg.groupId);
        setLastGroupMessages((prev) => ({ ...prev, [gid]: msg }));
      }
    };

    const handleMessageStatus = ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, status } : m))
      );
    };

    const handleMessagesRead = ({ by }) => {
      const byId = sid(by);
      setMessages((prev) =>
        prev.map((m) =>
          idEq(m.receiverId, byId) &&
          m.status !== "read" &&
          !m.groupId
            ? { ...m, status: "read", seen: true }
            : m
        )
      );
    };

    const handleTyping = ({ from }) => {
      setTypingUsers((prev) => ({ ...prev, [sid(from)]: true }));
    };
    const handleStopTyping = ({ from }) => {
      setTypingUsers((prev) => {
        const c = { ...prev };
        delete c[sid(from)];
        return c;
      });
    };

    const handleTypingGroup = ({ from, groupId }) => {
      if (!groupId || idEq(from, authUser?._id)) return;
      setGroupTypingUsers((prev) => ({
        ...prev,
        [sid(groupId)]: { ...(prev[sid(groupId)] || {}), [sid(from)]: true },
      }));
    };

    const handleStopTypingGroup = ({ from, groupId }) => {
      if (!groupId) return;
      setGroupTypingUsers((prev) => {
        const g = { ...(prev[sid(groupId)] || {}) };
        delete g[sid(from)];
        const next = { ...prev };
        if (Object.keys(g).length === 0) delete next[sid(groupId)];
        else next[sid(groupId)] = g;
        return next;
      });
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? {
                ...m,
                deletedForEveryone: true,
                text: "",
                image: "",
                audio: "",
              }
            : m
        )
      );
    };

    const handleMessageReacted = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    };

    const handleMessageEdited = ({ messageId, text, editedAt }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, text, editedAt } : m
        )
      );
    };

    const handleGroupCreated = () => {
      getUsers();
    };

    const handleGroupUpdated = ({ group }) => {
      if (!group?._id) return;
      setGroups((prev) => {
        const id = sid(group._id);
        const idx = prev.findIndex((g) => sid(g._id) === id);
        if (idx < 0) return [group, ...prev];
        const copy = [...prev];
        copy[idx] = group;
        return copy;
      });
      if (selectedGroupRef.current && sid(selectedGroupRef.current._id) === sid(group._id)) {
        setSelectedGroup(group);
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageSent", handleMessageSent);
    socket.on("messageStatus", handleMessageStatus);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("typingGroup", handleTypingGroup);
    socket.on("stopTypingGroup", handleStopTypingGroup);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messageReacted", handleMessageReacted);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("groupCreated", handleGroupCreated);
    socket.on("groupUpdated", handleGroupUpdated);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageSent", handleMessageSent);
      socket.off("messageStatus", handleMessageStatus);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("typingGroup", handleTypingGroup);
      socket.off("stopTypingGroup", handleStopTypingGroup);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("messageReacted", handleMessageReacted);
      socket.off("messageEdited", handleMessageEdited);
      socket.off("groupCreated", handleGroupCreated);
      socket.off("groupUpdated", handleGroupUpdated);
    };
  }, [socket, authUser, axios, getUsers]);

  const value = {
    messages,
    users,
    groups,
    selectedUser,
    selectedGroup,
    unseenMessages,
    unseenGroupMessages,
    lastMessages,
    lastGroupMessages,
    typingUsers,
    groupTypingUsers,
    replyTo,
    search,

    getUsers,
    getMessages,
    getGroupMessages,
    sendMessage,
    sendGroupMessage,
    addGroupMembers,
    leaveGroup,
    deleteMessage,
    reactToMessage,
    editMessageText,
    sendTyping,
    sendGroupTyping,
    logCall,

    openDM,
    openGroup,
    clearChatSelection,

    setMessages,
    setSelectedUser,
    setSelectedGroup,
    setUnseenMessages,
    setLastMessages,
    setReplyTo,
    setSearch,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
