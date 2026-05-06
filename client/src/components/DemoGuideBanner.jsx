import React, { useState, useContext } from "react";
import toast from "react-hot-toast";
import {
  IoInformationCircleOutline,
  IoCopyOutline,
  IoNotificationsOutline,
} from "react-icons/io5";
import { AuthContext } from "../context/AuthContext";

const DemoGuideBanner = () => {
  const { requestDesktopNotifications } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(origin);
      toast.success("Copied! Open in another tab or window and sign in as someone else.");
    } catch {
      toast.error("Could not copy — copy the address bar manually.");
    }
  };

  return (
    <div className="mx-3 mb-2 rounded-lg bg-[#182229] border border-[#00a884]/40 text-[11px] text-[#aebac1] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2.5 text-left flex items-center justify-between gap-2 hover:bg-[#1d282f]"
      >
        <span className="flex items-center gap-2">
          <IoInformationCircleOutline className="text-[#00a884] text-base shrink-0" />
          <span className="text-[#e9edef] font-medium">Chat on two screens</span>
        </span>
        <span className="text-[#00a884] shrink-0">{open ? "Hide" : "How?"}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-[#2a3942] pt-2 leading-relaxed">
          <p>
            <strong className="text-[#e9edef]">1.</strong> Open{" "}
            <strong className="text-white">this same link</strong> in a
            second <strong className="text-white">tab</strong> (each tab keeps its own account) — or use Incognito / another browser if you prefer.
          </p>
          <p>
            <strong className="text-[#e9edef]">2.</strong> Use{" "}
            <strong className="text-white">two different accounts</strong> (two
            sign-ups or one login each).
          </p>
          <p>
            <strong className="text-[#e9edef]">3.</strong> In each window, tap
            the other user in the list — you will see the same chat from both
            sides. messages and calls only work when both people are online
            (green dot).
          </p>
          <p className="text-[#8696a0]">
            From a phone on Wi‑Fi: use the <strong className="text-[#e9edef]">Network</strong> URL
            Vite prints in the terminal (not localhost). Set{" "}
            <code className="text-[#53bdeb]">VITE_BACKEND_URL</code> to{" "}
            <code className="text-[#53bdeb]">http://YOUR_PC_IP:5000</code> in{" "}
            <code className="text-[#53bdeb]">client/.env</code>, then restart both
            dev server and browser.
          </p>
          <button
            type="button"
            onClick={copy}
            className="w-full py-2 rounded-lg bg-[#00a884]/15 border border-[#00a884]/40 text-[#00a884] text-xs font-medium flex items-center justify-center gap-2 hover:bg-[#00a884]/25"
          >
            <IoCopyOutline />
            Copy this page link
          </button>
          <button
            type="button"
            onClick={() => requestDesktopNotifications()}
            className="w-full py-2 rounded-lg bg-[#2a3942] border border-[#374045] text-[#aebac1] text-xs font-medium flex items-center justify-center gap-2 hover:bg-[#374045]"
          >
            <IoNotificationsOutline />
            Allow desktop alerts (background tab)
          </button>
        </div>
      )}
    </div>
  );
};

export default DemoGuideBanner;
