/** Normalize Mongo/socket ids so comparisons and Map keys always match */
export function sid(id) {
  return id == null ? "" : String(id);
}

export function idEq(a, b) {
  return sid(a) === sid(b);
}

export function formatMessageTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatLastSeen(date) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffH < 24)
    return `today at ${d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  if (diffD === 1) return "yesterday";
  if (diffD < 7)
    return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString();
}

export function formatChatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (dDay.getTime() === today.getTime()) return "Today";
  if (dDay.getTime() === yesterday.getTime()) return "Yesterday";

  const diffDays = (today - dDay) / 86400000;
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString();
}

export function formatChatListTime(date) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (dDay.getTime() === today.getTime()) {
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
  const diffDays = (today - dDay) / 86400000;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString();
}

export function formatDuration(secondsTotal) {
  const s = Math.max(0, Math.floor(secondsTotal || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function formatBytes(bytes) {
  if (!bytes) return "";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export function previewText(msg) {
  if (!msg) return "";
  if (msg.deletedForEveryone) return "🚫 This message was deleted";
  if (msg.type === "call") {
    const k = msg.callInfo?.kind === "video" ? "Video" : "Voice";
    return `📞 ${k} call`;
  }
  if (msg.type === "audio" || msg.audio) return "🎤 Voice message";
  if (msg.type === "image" || msg.image) return "📷 Photo";
  if (msg.type === "file" || msg.file) return `📎 ${msg.file?.name || "File"}`;
  return msg.text || "";
}
