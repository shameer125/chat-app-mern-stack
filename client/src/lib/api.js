import axios from "axios";
import { readAuthToken } from "./authSession.js";

/** Trim .env quirks: spaces, accidental quotes */
function normalizeUrl(v) {
  if (v == null || v === "") return "";
  return String(v).trim().replace(/^["']+|["']+$/g, "").trim();
}

const envBackend = normalizeUrl(import.meta.env.VITE_BACKEND_URL);
const isDev = import.meta.env.DEV;

/**
 * Dev: "" → requests go to the Vite dev server, which proxies /api → backend.
 * Prod / preview: full URL from env (set at build time).
 */
export const API_BASE = isDev
  ? ""
  : envBackend || "http://127.0.0.1:5000";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = readAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Socket.io must match page origin in dev so the Vite /socket.io proxy is used. */
export function getSocketUrl() {
  if (isDev && typeof window !== "undefined") {
    return window.location.origin;
  }
  return envBackend || "http://127.0.0.1:5000";
}
