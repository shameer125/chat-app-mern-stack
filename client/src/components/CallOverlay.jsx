import React, { useContext, useEffect, useRef, useState } from "react";
import {
  IoCall,
  IoVideocam,
  IoVideocamOff,
  IoMic,
  IoMicOff,
} from "react-icons/io5";
import { MdCallEnd } from "react-icons/md";
import { CallContext } from "../context/CallContext";
import Avatar from "./Avatar";
import { formatDuration } from "../lib/utils";

const CallOverlay = () => {
  const {
    callState,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  } = useContext(CallContext);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (localVideoRef.current && callState.localStream) {
      localVideoRef.current.srcObject = callState.localStream;
    }
  }, [callState.localStream]);

  useEffect(() => {
    if (callState.remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = callState.remoteStream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = callState.remoteStream;
      }
    }
  }, [callState.remoteStream]);

  useEffect(() => {
    if (callState.status !== "active" || !callState.startedAt) {
      return;
    }
    const id = setInterval(() => {
      setSeconds(Math.floor((Date.now() - callState.startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [callState.status, callState.startedAt]);

  if (callState.status === "idle") return null;

  const isVideo = callState.kind === "video";
  const peer = callState.peer || {};

  // ---- INCOMING ----
  if (callState.status === "incoming") {
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 fade-up">
        <div className="bg-[#111b21] rounded-3xl p-8 max-w-sm w-full text-center border border-[#374045] shadow-2xl">
          <p className="text-[#8696a0] text-sm mb-1">
            Incoming {isVideo ? "video" : "voice"} call
          </p>
          <div className="relative inline-block my-6">
            <span className="absolute inset-0 rounded-full bg-[#00a884]/40 pulse-ring" />
            <span
              className="absolute inset-0 rounded-full bg-[#00a884]/30 pulse-ring"
              style={{ animationDelay: "0.3s" }}
            />
            <Avatar src={peer.profilePic} name={peer.fullName} size={120} />
          </div>
          <h2 className="text-2xl font-medium text-white">
            {peer.fullName || "Unknown"}
          </h2>
          <p className="text-[#8696a0] text-sm mt-1">QuickChat is calling...</p>

          <div className="flex items-center justify-center gap-12 mt-8">
            <button
              onClick={rejectCall}
              className="w-16 h-16 rounded-full bg-[#f15c6d] hover:bg-[#e94c5e] 
              flex items-center justify-center text-white shadow-lg transition"
              title="Decline"
            >
              <MdCallEnd className="text-3xl" />
            </button>
            <button
              onClick={acceptCall}
              className="w-16 h-16 rounded-full bg-[#00a884] hover:bg-[#06cf9c]
              flex items-center justify-center text-white shadow-lg transition"
              title="Accept"
            >
              {isVideo ? (
                <IoVideocam className="text-3xl" />
              ) : (
                <IoCall className="text-3xl" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- CALLING / ACTIVE ----
  return (
    <div className="fixed inset-0 z-[100] bg-[#0b141a] flex flex-col fade-up">
      {/* Hidden audio for voice */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Top bar */}
      <div
        className="px-6 py-4 flex items-center justify-between text-white
       bg-gradient-to-b from-black/60 to-transparent z-10"
      >
        <div className="flex items-center gap-3">
          <Avatar src={peer.profilePic} name={peer.fullName} size={42} />
          <div>
            <p className="font-medium">{peer.fullName || "Calling..."}</p>
            <p className="text-xs text-[#aebac1]">
              {callState.status === "active"
                ? `${formatDuration(seconds)} · ${
                    isVideo ? "Video call" : "Voice call"
                  }`
                : callState.status === "calling"
                  ? "Ringing…"
                  : ""}
            </p>
            {(callState.connectionState || callState.iceState) &&
              callState.status === "active" && (
                <p className="text-[10px] text-[#8696a0] mt-0.5 capitalize">
                  {callState.iceState === "connected" ||
                  callState.iceState === "completed"
                    ? "Connected"
                    : callState.iceState
                      ? `Network: ${callState.iceState}`
                      : callState.connectionState
                        ? `Call: ${callState.connectionState}`
                        : ""}
                </p>
              )}
          </div>
        </div>
        <span className="text-xs text-[#aebac1] flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse" />
          End-to-end encrypted
        </span>
      </div>

      {/* Video / Audio surface */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {isVideo ? (
          <>
            {callState.remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center text-white">
                <div className="relative inline-block">
                  <span className="absolute inset-0 rounded-full bg-[#00a884]/30 pulse-ring" />
                  <Avatar
                    src={peer.profilePic}
                    name={peer.fullName}
                    size={160}
                  />
                </div>
                <p className="mt-6 text-xl">{peer.fullName}</p>
                <p className="text-sm text-[#aebac1] mt-1">Connecting...</p>
              </div>
            )}
            {callState.localStream && (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute bottom-6 right-6 w-40 h-56 md:w-52 md:h-72 
                rounded-2xl object-cover border-2 border-[#00a884] shadow-2xl"
                style={{ transform: "scaleX(-1)" }}
              />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center text-white">
            <div className="relative inline-block">
              <span className="absolute inset-0 rounded-full bg-[#00a884]/30 pulse-ring" />
              <span
                className="absolute inset-0 rounded-full bg-[#00a884]/20 pulse-ring"
                style={{ animationDelay: "0.3s" }}
              />
              <Avatar src={peer.profilePic} name={peer.fullName} size={180} />
            </div>
            <h2 className="text-3xl font-light mt-6">
              {peer.fullName || "Voice call"}
            </h2>
            <p className="text-[#aebac1] mt-2">
              {callState.status === "active"
                ? formatDuration(seconds)
                : callState.status === "calling"
                  ? "Ringing…"
                  : "Connecting…"}
            </p>
            {callState.status === "active" &&
              callState.iceState &&
              callState.iceState !== "connected" &&
              callState.iceState !== "completed" && (
                <p className="text-xs text-[#8696a0] mt-1 capitalize">
                  {callState.iceState}
                </p>
              )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gradient-to-t from-black/80 to-transparent py-8 px-6 flex items-center justify-center gap-6">
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition shadow-lg ${
            callState.muted
              ? "bg-white text-black"
              : "bg-white/15 hover:bg-white/25"
          }`}
          title={callState.muted ? "Unmute" : "Mute"}
        >
          {callState.muted ? (
            <IoMicOff className="text-2xl" />
          ) : (
            <IoMic className="text-2xl" />
          )}
        </button>

        {isVideo && (
          <button
            onClick={toggleCamera}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition shadow-lg ${
              callState.cameraOff
                ? "bg-white text-black"
                : "bg-white/15 hover:bg-white/25"
            }`}
            title={callState.cameraOff ? "Turn on camera" : "Turn off camera"}
          >
            {callState.cameraOff ? (
              <IoVideocamOff className="text-2xl" />
            ) : (
              <IoVideocam className="text-2xl" />
            )}
          </button>
        )}

        <button
          onClick={endCall}
          className="w-16 h-16 rounded-full bg-[#f15c6d] hover:bg-[#e94c5e] flex items-center justify-center text-white shadow-2xl transition"
          title="End call"
        >
          <MdCallEnd className="text-3xl" />
        </button>
      </div>
    </div>
  );
};

export default CallOverlay;
