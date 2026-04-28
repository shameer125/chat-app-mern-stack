// import { useContext } from "react";
// import { useState } from "react";
// import { createContext } from "react";
// import { AuthContext } from "./AuthContext";
// import toast from "react-hot-toast";
// import { useEffect } from "react";

// export const chatContext = createContext();

// export const ChatProivder = ({ children }) => {

//     const [messages, setMessages] = useState([]);
//     const [users, setUsers] = useState([]);
//     const [selectedUser, setSelectedUser] = useState(null);
//     const [unseenMessages, setUnseenMessages] = useState({});

//     const { socket, axios } = useContext(AuthContext);

//     // Function to get all the user for sidebar
//     const getUsers = async () => {
//         try {
//             const { data } = await axios.get('/api/messages/users');
//             if (data.success) {
//                 setUsers(data.users)
//                 setUnseenMessages(data.unseenMessages)
//             }
//         } catch (error) {
//             toast.error(error.message)
//         }
//     }

//     // Function to get messages for selected user

//     const getMessages = async (userId) => {
//         try {
//             const { data } = await axios.get(`/api/messages/${userId}`);
//             if (data.success) {
//                 setMessages(data.messages)
//             }
//         } catch (error) {
//             toast.error(error.message)
//         }
//     }

//     // Function to send message to selected user

//     const sendMessage = async (messageData) => {
//         try {
//             const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
//             if (data.success) {
//                 setMessages((prevMessages)=> [...prevMessages, data.newMessage])
//             } else {
//                 toast.error(data.message)
//             }
//         } catch (error) {
//             toast.error(error.message)
//         }
//     }

//     // Function to subscribe messages for selected user

//     const subscribeToMessages = async () => {
//         if (!socket) return;

//         socket.on("newMessage", (newMessage) => {
//             if (selectedUser && newMessage.senderId === selectedUser._id) {
//                 newMessage.seen = true;
//                 setMessages((prevMessages) => [...prevMessages, newMessage]);
//                 axios.put(`/api/messages/mark/${newMessage._id}`);
//             } else {
//                 setUnseenMessages((prevUnseenMessages) => ({
//                     ...prevUnseenMessages, [newMessage.senderId]:
//                         prevUnseenMessages[newMessage.senderId] ?
//                         prevUnseenMessages[newMessage.senderId] + 1 : 1
//                 }))
//             }
//         })
//     }

//     // Function to unsubscribe from messages

//     const unsubscribeFromMessages = () => {
//         if (socket) socket.off("newMessage");
//     }

//     useEffect(() => {
//         subscribeToMessages();
//         return () => unsubscribeFromMessages();
//     },[socket, selectedUser])

//     const value = {
//         messages, users, selectedUser, getUsers, setMessages, sendMessage,
//         setSelectedUser, unseenMessages, setUnseenMessages
//     }
//     return (
//         <chatContext.Provider value={value}>
//             {children}
//         </chatContext.Provider>
//     )
// }

import { useContext, useState, createContext, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

  const { socket, axios, authUser } = useContext(AuthContext);

  // ---------------- USERS ----------------
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users || []);
        setUnseenMessages(data.unseenMessages || {});
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ---------------- GET MESSAGES ----------------
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ---------------- SEND MESSAGE ----------------
  const sendMessage = async (messageData) => {
    try {
      if (!selectedUser?._id) return;

      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData,
      );

      console.log("SEND RESPONSE:", data);

      if (!data.success) {
        toast.error(data.message);
        return;
      }

      const newMsg = data.newMessage || data.message;

      if (!newMsg) {
        console.error("❌ No message returned from backend");
        return;
      }

      // ✅ instant UI update
      setMessages((prev) => [...prev, newMsg]);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ---------------- SOCKET REALTIME FIX ----------------
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      const isChatOpen =
        selectedUser &&
        (newMessage.senderId === selectedUser._id ||
          newMessage.receiverId === selectedUser._id);

      if (isChatOpen) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === newMessage._id);
          if (exists) return prev;

          return [...prev, newMessage];
        });

        axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
        }));
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, selectedUser]);

  // ---------------- CONTEXT VALUE ----------------
  const value = {
    messages,
    users,
    selectedUser,
    unseenMessages,

    getUsers,
    getMessages,
    sendMessage,

    setMessages,
    setSelectedUser,
    setUnseenMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};