import React, { useEffect, useRef, useState } from "react";
import { FaPause, FaPlay } from "react-icons/fa";
import { formatDuration } from "../lib/utils";

const AudioBubble = ({ src, isMe }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onLoaded = () => setDuration(a.duration || 0);
    const onTime = () => setProgress(a.currentTime);
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 min-w-[220px]">
      <button
        onClick={toggle}
        className={`p-2.5 rounded-full ${
          isMe ? "bg-white/15 hover:bg-white/25" : "bg-[#374045] hover:bg-[#475158]"
        } text-white transition`}
      >
        {playing ? <FaPause /> : <FaPlay className="ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div className="h-1 bg-[#8696a0]/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#53bdeb] rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[11px] text-[#aebac1]">
          {playing || progress > 0
            ? formatDuration(progress)
            : formatDuration(duration)}
        </span>
      </div>
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
};

export default AudioBubble;
