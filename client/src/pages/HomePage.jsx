import React, { useContext } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import RightSidebar from "../components/RightSidebar";
import { ChatContext } from "../context/ChatContext";
import { sid } from "../lib/utils";

const HomePage = () => {
  const { selectedUser, selectedGroup } = useContext(ChatContext);
  const showRight = selectedUser || selectedGroup;

  return (
    <div className="w-full h-screen bg-[#0b141a]">
      <div
        className={`h-full grid relative
        ${
          showRight
            ? "grid-cols-1 md:grid-cols-[360px_1fr] xl:grid-cols-[360px_1fr_360px]"
            : "grid-cols-1 md:grid-cols-[360px_1fr]"
        }`}
      >
        <Sidebar />
        <ChatContainer />
        {showRight && (
          <RightSidebar
            key={`${sid(selectedUser?._id || "")}-${sid(selectedGroup?._id || "")}`}
          />
        )}
      </div>
      
    </div>

  );
};

export default HomePage;
