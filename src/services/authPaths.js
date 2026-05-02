/**
 * Paths that must never send Bearer tokens (stale JWT breaks login / OTP flows).
 * Supports both relative API paths (`/verify-otp`) and prefixed axios URLs (`/api/v1.0/verify-otp`).
 */
export const PUBLIC_AUTH_PATHS_LIST = [
  "/login",
  "/verify-otp",
  "/register",
  "/forgot-password",
  "/reset-password",
];

const PUBLIC_AUTH_PATHS = new Set(PUBLIC_AUTH_PATHS_LIST);

const API_PREFIX = "/api/v1.0";

/**
 * @param {string} url Path or full URL fragment (may include query string or `/api/v1.0` prefix).
 * @returns {string} Normalized path starting with `/`, no query, no trailing slash (except `/`).
 */
export function normalizeAuthPath(url) {
  let p = String(url || "").split("?")[0].trim();
  if (p.length > 1 && p.endsWith("/")) {
    p = p.slice(0, -1);
  }
  const idx = p.indexOf(API_PREFIX);
  if (idx >= 0) {
    p = p.slice(idx + API_PREFIX.length);
  }
  if (!p.startsWith("/")) {
    p = `/${p}`;
  }
  return p;
}

export function isPublicAuthPath(url) {
  return PUBLIC_AUTH_PATHS.has(normalizeAuthPath(url));
}

/** Any URL fragment that targets verify-otp (belt-and-suspenders for 401 / redirect rules). */
export function urlIncludesVerifyOtp(url) {
  return String(url || "").toLowerCase().includes("verify-otp");
}

const AUTH_UI_PATH_RE = /^\/(login|forgot-password|reset-password)(\/|$)/i;

export function isAuthFlowAppPath(pathname) {
  return AUTH_UI_PATH_RE.test(String(pathname || ""));
}
