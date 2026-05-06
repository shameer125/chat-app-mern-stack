/** Shared text limits for DM + group messages (real-world abuse prevention). */

export const MAX_MESSAGE_TEXT_LENGTH = 4096;
export const EDIT_MESSAGE_WINDOW_MS = 15 * 60 * 1000;

export function normalizeMessageText(text) {
  if (text == null) return "";
  if (typeof text !== "string") return "";
  return text.replace(/\0/g, "").trimEnd().slice(0, MAX_MESSAGE_TEXT_LENGTH);
}

export function assertTextWithinLimit(text, label = "Message") {
  const t = text ?? "";
  if (typeof t !== "string") return `${label} text must be a string`;
  if (t.length > MAX_MESSAGE_TEXT_LENGTH) {
    return `${label} is too long (max ${MAX_MESSAGE_TEXT_LENGTH} characters)`;
  }
  return null;
}
