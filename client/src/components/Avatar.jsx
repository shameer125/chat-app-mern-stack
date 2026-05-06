import React from "react";
import { FaUser } from "react-icons/fa";

const Avatar = ({ src, name, size = 40, online, ring }) => {
  const initials = (name || "")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="relative inline-block flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <div
        className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center
          bg-gradient-to-br from-[#005c4b] to-[#00a884] text-white font-semibold
          ${ring ? "ring-2 ring-[#00a884]/50" : ""}`}
        style={{ fontSize: size * 0.38 }}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : initials ? (
          <span>{initials}</span>
        ) : (
          <FaUser style={{ fontSize: size * 0.5 }} />
        )}
      </div>
      {online && (
        <span
          className="absolute bottom-0 right-0 block rounded-full bg-[#25d366] ring-2 ring-[#111b21]"
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  );
};

export default Avatar;
