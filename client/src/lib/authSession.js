/**
 * Auth token lives in sessionStorage so each browser tab has its own login.
 * (localStorage is shared across all tabs — that caused “wrong name” / mixed accounts.)
 *
 * One-time: if only legacy localStorage `token` exists, move it into this tab’s session.
 */

const TOKEN_KEY = "quickchat_token";
const LEGACY_LS_KEY = "token";

export function readAuthToken() {
  if (typeof window === "undefined") return null;
  try {
    let t = sessionStorage.getItem(TOKEN_KEY);
    if (t) return t;
    const legacy = localStorage.getItem(LEGACY_LS_KEY);
    if (legacy) {
      sessionStorage.setItem(TOKEN_KEY, legacy);
      localStorage.removeItem(LEGACY_LS_KEY);
      return legacy;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeAuthToken(token) {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(LEGACY_LS_KEY);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(LEGACY_LS_KEY);
    }
  } catch {
    /* private mode etc. */
  }
}

export function clearAuthToken() {
  writeAuthToken(null);
}
