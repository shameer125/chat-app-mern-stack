import React, { useEffect, useRef, useState } from "react";
import { FaTrash, FaPaperPlane, FaPause, FaPlay } from "react-icons/fa";
import { formatDuration } from "../lib/utils";

const VoiceRecorder = ({ onSend, onCancel }) => {
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const mr = new MediaRecorder(stream);
        mediaRecorderRef.current = mr;
        chunksRef.current = [];
        mr.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        mr.start();
        tickRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      } catch {
        onCancel?.();
      }
    })();
    return () => {
      mounted = false;
      clearInterval(tickRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePause = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    if (mr.state === "recording") {
      mr.pause();
      clearInterval(tickRef.current);
      setPaused(true);
    } else if (mr.state === "paused") {
      mr.resume();
      tickRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      setPaused(false);
    }
  };

  const cancel = () => {
    clearInterval(tickRef.current);
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      try {
        mr.stop();
      } catch {
        /* noop */
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    onCancel?.();
  };

  const send = () => {
    clearInterval(tickRef.current);
    const mr = mediaRecorderRef.current;
    if (!mr) return onCancel?.();

    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: chunksRef.current[0]?.type || "audio/webm",
      });
      const reader = new FileReader();
      reader.onloadend = () => {
        onSend?.({ data: reader.result, duration: seconds });
      };
      reader.readAsDataURL(blob);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
    if (mr.state !== "inactive") mr.stop();
  };

  return (
    <div className="flex-1 flex items-center gap-3 bg-[#2a3942] rounded-full px-4 py-2.5 fade-up">
      <button
        onClick={cancel}
        className="text-[#f15c6d] hover:scale-110 transition"
        title="Cancel"
      >
        <FaTrash />
      </button>
      <div className="flex items-center gap-2 flex-1">
        <span
          className={`w-3 h-3 rounded-full ${
            paused ? "bg-[#8696a0]" : "bg-[#f15c6d] record-pulse"
          }`}
        />
        <div className="flex-1 flex items-center gap-1">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="w-0.5 bg-[#8696a0]/60 rounded"
              style={{
                height: `${
                  4 + Math.abs(Math.sin((seconds + i) * 0.5)) * 14
                }px`,
              }}
            />
          ))}
        </div>
        <span className="text-[#aebac1] text-sm font-mono w-14 text-right">
          {formatDuration(seconds)}
        </span>
      </div>
      <button
        onClick={togglePause}
        className="text-[#aebac1] hover:text-white transition"
        title={paused ? "Resume" : "Pause"}
      >
        {paused ? <FaPlay /> : <FaPause />}
      </button>
      <button
        onClick={send}
        className="bg-[#00a884] text-white p-2.5 rounded-full hover:bg-[#06cf9c] transition"
        title="Send"
      >
        <FaPaperPlane className="text-sm" />
      </button>
    </div>
  );
};

export default VoiceRecorder;
