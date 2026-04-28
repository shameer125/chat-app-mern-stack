// import React, { useEffect, useRef } from 'react'
// import assets, { messagesDummyData } from '../assets/assets'
// import { formatMessageTime } from '../lib/utils'
// import { useContext } from 'react'
// import { ChatContext } from '../context/ChatContext'
// import { AuthContext } from '../context/AuthContext'
// import { useState } from 'react'
// import toast from 'react-hot-toast'

// const ChatContainer = () => {

//     const { messages, selectedUser, setSelectedUser, sendMessage,
//         getMessages } = useContext(ChatContext);
//     const { authUser, onlineUser } = useContext(AuthContext);

//     const scrollEnd = useRef()

//     const [input, setInput] = useState('');

//     // Handle sending a message
//     const handleSendMessage = async (e) => {
//         e.preventDefault();
//         if (input.trim() === "") return null;
//         await sendMessage({ text: input.trim() });
//         setInput("")
//     }

//     // Handle sending message
//     const handleSendImage = async (e) => {
//         const file = e.target.files[0];
//         if (!file || !file.type.startsWith("image/")) {
//             toast.error("Select an image file")
//             return;
//         }
//         const reader = new FileReader();
//         reader.onloadend = async () => {
//             await sendMessage({ image: reader.result })
//             e.target.value = "";
//         }
//         reader.readAsDataURL(file)
//     }

//     useEffect(() => {
//         if (selectedUser) {
//             getMessages(selectedUser._id)
//         }
//     }, [selectedUser])


//  useEffect(() => {
//    if (scrollEnd.current) {
//      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
//    }
//  }, [messages]);

//   return selectedUser ? (
//     <div className="h-full overflow-scroll relative backdrop-blur-lg">
//       {/* header  */}
//       <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
//         <img
//           src={selectedUser.profilePic || assets.avatar_icon}
//           alt=""
//           className="w-8 rounded-full"
//         />
//         <p className="flex-1 text-lg text-white flex items-center gap-2">
//           {selectedUser.fullName}
//           {onlineUser.includes(selectedUser._id) && (
//             <span className="w-2 h-2 rounded-full bg-green-500"></span>
//           )}
//         </p>
//         <img
//           onClick={() => setSelectedUser(null)}
//           src={assets.arrow_icon}
//           alt=""
//           className="md:hidden max-w-7"
//         />
//         <img src={assets.help_icon} alt="" className="max-md:hidden max-w-5" />
//       </div>
//       {/* chat area  */}

//       <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6">
//         {messages.map((msg, index) => (
//           <div
//             key={index}
//             className={`flex items-end gap-2 justify-end ${
//               msg.senderId === authUser._id ? "justify-end" : "justify-start"
//             }`}
//           >
//             {msg.image ? (
//               <img
//                 src={msg.image}
//                 alt=""
//                 className="max-w-[230px] border border-gray-700
//                           rounded-lg overflow-hidden mb-8"
//               />
//             ) : (
//               <p
//                 className={`p-2 max-w-[1200px] md:text-sm font-light rounded-lg
//                                 mb-8 break-all bg-violet-500/30 text-white ${
//                                   msg.senderId === authUser._id
//                                     ? "rounded-bl-none"
//                                     : "rounded-br-none"
//                                 }`}
//               >
//                 {msg.text}
//               </p>
//             )}

//             <div className="text-center text-xs">
//               <img
//                 src={
//                   msg.senderId === authUser._id
//                     ? authUser?.profilePic || assets.avatar_icon
//                     : selectedUser?.profilePic || assets.avatar_icon
//                 }
//                 alt=""
//                 className="w-7 rounded-full"
//               />

//               <p className="text-gray-500">
//                 {formatMessageTime(msg.createdAt)}{" "}
//               </p>
//             </div>
//           </div>
//         ))}

//         <div ref={scrollEnd}></div>
//       </div>

//       {/* bottom input area   */}

//       <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3">
//         <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
//           <input
//             onChange={(e) => setInput(e.target.value)}
//             value={input}
//             type="text"
//             onKeyDown={(e) => (e.key === "Enter" ? handleSendMessage(e) : null)}
//             placeholder="Send a message"
//             className="flex-1 text-sm p-3 border-none rounded-lg outline-none
//                   text-white placeholder-gray-400"
//           />
//           <input
//             onChange={handleSendImage}
//             type="file"
//             id="image"
//             accept="image/png, image/jpeg"
//             hidden
//           />
//           <label htmlFor="image">
//             <img
//               src={assets.gallery_icon}
//               alt=""
//               className="w-5 mr-2
//                       cursor-pointer"
//             />
//           </label>
//         </div>
//         <img
//           onClick={handleSendMessage}
//           src={assets.send_button}
//           alt=""
//           className="w-7 cursor-pointer"
//         />
//       </div>
//     </div>
//   ) : (
//     <div
//       className="flex flex-col items-center justify-center gap-2 text-gray-500
//           bg-white/10 max-md:hidden"
//     >
//       <img src={assets.logo_icon} alt="" className="max-w-16" />
//       <p className="text-lg font-medium text-white">Chat anytime, anywhere</p>
//     </div>
//   );
// }

// export default ChatContainer





import React, { useEffect, useRef, useState, useContext } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages } =
    useContext(ChatContext);

  const { authUser, onlineUser } = useContext(AuthContext);

  const scrollEnd = useRef(null);
  const [input, setInput] = useState("");

  // ---------------- SEND MESSAGE ----------------
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();

    if (!selectedUser?._id) {
      toast.error("No user selected");
      return;
    }

    if (!input.trim()) return;

    try {
      await sendMessage({ text: input.trim() });
      setInput("");
    } catch (error) {
      console.error("Send message error:", error);
      toast.error("Message failed");
    }
  };

  // ---------------- SEND IMAGE ----------------
  const handleSendImage = async (e) => {
    const file = e.target.files[0];

    if (!file || !file.type.startsWith("image/")) {
      toast.error("Select a valid image");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        if (!selectedUser?._id) return;
        await sendMessage({ image: reader.result });
        e.target.value = "";
      } catch (error) {
        console.error(error);
        toast.error("Image send failed");
      }
    };

    reader.readAsDataURL(file);
  };

  // ---------------- LOAD MESSAGES ----------------
  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser]);

  // ---------------- AUTO SCROLL ----------------
  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------------- EMPTY SCREEN ----------------
  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center gap-2
      text-gray-500 bg-white/10 max-md:hidden">
        <img src={assets.logo_icon} alt="" className="max-w-16" />
        <p className="text-lg font-medium text-white">Chat anytime, anywhere</p>
      </div>
    );
  }

  // ---------------- MAIN UI ----------------
  return (
    <div className="h-full overflow-y-auto relative backdrop-blur-lg">
      {/* HEADER */}
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
        <img
          src={
            selectedUser?.profilePic
              ? selectedUser.profilePic
              : assets.avatar_icon
          }
          alt=""
          className="w-8 rounded-full"
        />

        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser.fullName}

          {onlineUser?.includes(selectedUser._id) && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}
        </p>

        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt=""
          className="md:hidden max-w-7 cursor-pointer"
        />

        <img src={assets.help_icon} alt="" className="max-md:hidden max-w-5" />
      </div>

      {/* CHAT AREA */}
      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-auto p-3 pb-6">
        {messages?.map((msg, index) => {
          if (!msg) return null; // ✅ prevent crash

          const isMe = msg?.senderId === authUser?._id;

          return (
            <div
              key={index}
              className={`flex items-end gap-2 ${
                isMe ? "justify-end" : "justify-start"
              }`}
            >
              {/* MESSAGE */}
              {msg?.image ? (
                <img
                  src={msg.image}
                  alt=""
                  className="max-w-[230px] border border-gray-700 rounded-lg mb-8"
                />
              ) : (
                <p
                  className={`p-2 max-w-[250px] text-sm rounded-lg mb-8 break-words text-white ${
                    isMe
                      ? "bg-violet-500/30 rounded-br-none"
                      : "bg-gray-600/30 rounded-bl-none"
                  }`}
                >
                  {msg?.text || ""}
                </p>
              )}

              {/* USER IMAGE + TIME */}
              <div className="text-center text-xs">
                <img
                  src={
                    isMe
                      ? authUser?.profilePic || assets.avatar_icon
                      : selectedUser?.profilePic || assets.avatar_icon
                  }
                  alt=""
                  className="w-7 rounded-full"
                />

                <p className="text-gray-500">
                  {msg?.createdAt ? formatMessageTime(msg.createdAt) : "now"}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={scrollEnd}></div>
      </div>

      {/* INPUT AREA */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3">
        <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            type="text"
            placeholder="Send a message"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage(e);
            }}
            className="flex-1 text-sm p-3 outline-none bg-transparent text-white placeholder-gray-400"
          />

          <input
            onChange={handleSendImage}
            type="file"
            id="image"
            accept="image/png, image/jpeg"
            hidden
          />

          <label htmlFor="image">
            <img
              src={assets.gallery_icon}
              alt=""
              className="w-5 mr-2 cursor-pointer"
            />
          </label>
        </div>

        <img
          onClick={handleSendMessage}
          src={assets.send_button}
          alt=""
          className="w-7 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default ChatContainer;





