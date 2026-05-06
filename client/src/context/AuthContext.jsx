/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef, createContext } from "react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { sid } from "../lib/utils";
import { api, getSocketUrl } from "../lib/api";
import { readAuthToken, writeAuthToken, clearAuthToken } from "../lib/authSession.js";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => readAuthToken());
  const [authUser, setAuthUser] = useState(null);
  const [onlineUser, setOnlineUser] = useState([]);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  /** Drops stale /auth/check results so a fast second login isn't overwritten by the first account's response */
  const authGenerationRef = useRef(0);

  const isDev = import.meta.env.DEV;

  const checkAuth = async () => {
    const gen = ++authGenerationRef.current;
    try {
      const { data } = await api.get("/api/auth/check");
      if (gen !== authGenerationRef.current) return;
      if (data.success) {
        const user = data.user || data.userData;
        setAuthUser(user);
        connectSocket(user);
      } else {
        clearAuthToken();
        setToken(null);
        setAuthUser(null);
      }
    } catch (error) {
      if (gen !== authGenerationRef.current) return;
      if (error.response?.status === 401) {
        clearAuthToken();
        setToken(null);
        setAuthUser(null);
        return;
      }
      const net =
        error.code === "ERR_NETWORK" || error.message === "Network Error";
      if (net) {
        console.error(
          "[auth] check failed: cannot reach API. Is the backend running on port 5000?"
        );
      } else {
        console.log(error.message);
      }
    }
  };

  const login = async (state, credentials) => {
    try {
      const { data } = await api.post(`/api/auth/${state}`, credentials);

      if (data.success) {
        const user = data.user || data.userData;
        /* Invalidate any in-flight session check (e.g. tab opened on /login while old token still existed) */
        authGenerationRef.current += 1;

        setAuthUser(user);
        setToken(data.token);
        writeAuthToken(data.token);
        connectSocket(user);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      const net =
        error.code === "ERR_NETWORK" || error.message === "Network Error";
      toast.error(
        net
          ? `Cannot reach the server. Run the backend (npm run server in /server, port 5000), then refresh.${
              isDev
                ? " Using Vite proxy: API should be at the same address as this page."
                : ""
            }`
          : error.response?.data?.message || error.message
      );
    }
  };

  const logout = () => {
    authGenerationRef.current += 1;
    clearAuthToken();
    setToken(null);
    setAuthUser(null);
    setOnlineUser([]);
    socketRef.current?.removeAllListeners();
    socketRef.current?.disconnect();
    socketRef.current = null;
    setSocket(null);
    toast.success("Logged out");
  };

  const updateProfile = async (body) => {
    try {
      const { data } = await api.put("/api/auth/update-profile", body);
      if (data.success) {
        const user = data.user || data.userData;
        setAuthUser(user);
        toast.success("Profile updated");
      }
    } catch (error) {
      const net =
        error.code === "ERR_NETWORK" || error.message === "Network Error";
      toast.error(
        net ? "Cannot reach the server. Check backend is running." : error.message
      );
    }
  };

  const togglePinChat = async (otherUserId) => {
    try {
      const { data } = await api.put(`/api/auth/pin-chat/${sid(otherUserId)}`);
      if (data.success) {
        const user = data.user || data.userData;
        setAuthUser(user);
        const nowPinned = user.pinnedChatIds?.some(
          (id) => sid(id) === sid(otherUserId)
        );
        toast.success(nowPinned ? "Chat pinned" : "Chat unpinned");
      } else {
        toast.error(data.message || "Could not update pin");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Could not update pin"
      );
    }
  };

  const togglePinGroup = async (groupId) => {
    try {
      const { data } = await api.put(`/api/auth/pin-group/${sid(groupId)}`);
      if (data.success) {
        const user = data.user || data.userData;
        setAuthUser(user);
        const nowPinned = user.pinnedGroupIds?.some(
          (id) => sid(id) === sid(groupId)
        );
        toast.success(nowPinned ? "Group pinned" : "Group unpinned");
      } else {
        toast.error(data.message || "Could not update pin");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Could not update pin"
      );
    }
  };

  const toggleMuteChat = async (otherUserId) => {
    try {
      const { data } = await api.put(`/api/auth/mute-chat/${sid(otherUserId)}`);
      if (data.success) {
        const user = data.user || data.userData;
        setAuthUser(user);
        const muted = user.mutedUserIds?.some(
          (id) => sid(id) === sid(otherUserId)
        );
        toast.success(muted ? "Chat muted" : "Chat unmuted");
      } else {
        toast.error(data.message || "Could not update mute");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Could not update mute"
      );
    }
  };

  const toggleMuteGroup = async (groupId) => {
    try {
      const { data } = await api.put(`/api/auth/mute-group/${sid(groupId)}`);
      if (data.success) {
        const user = data.user || data.userData;
        setAuthUser(user);
        const muted = user.mutedGroupIds?.some(
          (id) => sid(id) === sid(groupId)
        );
        toast.success(muted ? "Group muted" : "Group unmuted");
      } else {
        toast.error(data.message || "Could not update mute");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Could not update mute"
      );
    }
  };

  const toggleStarMessage = async (messageId) => {
    try {
      const { data } = await api.post(`/api/messages/star/${sid(messageId)}`);
      if (data.success) {
        const user = data.user || data.userData;
        setAuthUser(user);
        toast.success(data.starred ? "Starred" : "Unstarred");
      } else {
        toast.error(data.message || "Could not update star");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Could not update star"
      );
    }
  };

  const requestDesktopNotifications = async () => {
    if (typeof Notification === "undefined") {
      toast.error("Notifications not supported in this browser");
      return false;
    }
    if (Notification.permission === "granted") {
      toast.success("Desktop alerts already on");
      return true;
    }
    const p = await Notification.requestPermission();
    if (p === "granted") {
      toast.success("You'll get alerts when the tab is in the background");
      return true;
    }
    toast.error("Permission denied — you can enable alerts in browser settings");
    return false;
  };

  const connectSocket = (userData) => {
    if (!userData?._id) return;
    const uid = sid(userData._id);

    const existing = socketRef.current;
    if (existing?.connected && sid(existing.io?.opts?.query?.userId) === uid) {
      return;
    }

    existing?.removeAllListeners();
    existing?.disconnect();

    const newSocket = io(getSocketUrl(), {
      path: "/socket.io",
      query: { userId: uid },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelayMax: 10000,
    });

    newSocket.on("connect", () => {
      console.debug("[socket] connected as", uid);
    });
    newSocket.on("connect_error", (err) => {
      console.error("[socket] connect_error", err?.message || err);
    });

    newSocket.on("getOnlineUsers", (userIds) =>
      setOnlineUser((userIds || []).map(sid))
    );

    socketRef.current = newSocket;
    setSocket(newSocket);
  };

  useEffect(() => {
    if (token) {
      checkAuth();
    } else {
      setAuthUser(null);
      setOnlineUser([]);
      socketRef.current?.removeAllListeners();
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    return () => {
      socketRef.current?.removeAllListeners();
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const value = {
    axios: api,
    token,
    authUser,
    onlineUser,
    socket,
    login,
    logout,
    updateProfile,
    togglePinChat,
    togglePinGroup,
    toggleMuteChat,
    toggleMuteGroup,
    toggleStarMessage,
    requestDesktopNotifications,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
