import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import { useEffect } from "react";

const Sidebar = () => {

  const { getUsers, users, selectedUser, setSelectedUser,
    unseenMessages, setUnseenMessages } = useContext(ChatContext) 

  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { logout, onlineUser } = useContext(AuthContext);

  const [input, setInput] = useState(false);

  const filteredUsers = input ? users.filter((user) =>
    user.fullName.toLowerCase().includes(input.toLowerCase())) : users;

  useEffect(() => {
    getUsers()
  },[onlineUser])

  return (
    <div
      className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-auto
      text-white ${selectedUser ? "max-md:hidden" : ""}`}
    >
      <div className="pb-5">
        {/* Header */}
        <div className="flex justify-between items-center">
          <img src={assets.logo} alt="logo" className="max-w-40" />

          <div className="relative">
            <img
              src={assets.menu_icon}
              alt="menu"
              onClick={() => setOpen(!open)}
              className="max-h-5 cursor-pointer"
            />

            {/* Dropdown */}
            <div
              className={`absolute top-full right-0 z-20 w-36 rounded-md p-4 bg-[#282142]
              border border-gray-600 text-gray-100 ${open ? "block" : "hidden"}`}
            >
              <p
                onClick={() => {
                  setOpen(false);
                  navigate("/profile");
                }}
                className="cursor-pointer text-sm hover:text-gray-300"
              >
                Edit Profile
              </p>

              <hr className="my-2 border-t border-gray-500" />

              <p
                onClick={() => logout()}
                className="cursor-pointer text-sm hover:text-gray-300"
              >
                Logout
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5">
          <img src={assets.search_icon} alt="search" className="w-3" />
          <input
            onChange={(e) => setInput(e.target.value)}
            type="text"
            className="bg-transparent border-none outline-none 
                  text-white text-xs placeholder-[#c8c8c8] flex-1"
            placeholder="Search User..."
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filteredUsers.map((user, index) => (
          <div
            onClick={() => {
              setSelectedUser(user);
            }}
            key={index}
            className={`relative flex items-center gap-2 p-2 pl-4 rounded 
            cursor-pointer max-sm:text-sm ${selectedUser?.id === user.id && "bg-[#282142]/50"}`}
            className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-[#282142]"
          >
            <img
              src={user?.profilePic || assets.avatar_icon}
              alt=""
              className="w-[35px] aspect-[1/1] rounded-full"
            />

            <div className="flex flex-col leading-5">
              <p>{user.fullName}</p>

              {onlineUser.includes(user._id) ? (
                <span className="text-green-400 text-xs">Online</span>
              ) : (
                <span className="text-neutral-400 text-xs">Offline</span>
              )}
            </div>
            {unseenMessages?.[user._id] > 0 && (
              <p
                className="absolute top-4 right-4 text-xs
                    h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/50"
              >
                {unseenMessages[user._id]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
