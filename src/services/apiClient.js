import axios from "axios";
import { getApiBaseRoot, logDevApiTransport } from "./apiConfig";
import { isPublicAuthPath, isAuthFlowAppPath, urlIncludesVerifyOtp } from "./authPaths";

// ── Constants ───────────────────────────────────────────────────────────────
const TOKEN_KEY = "ui-access-token";
const REQUEST_TIMEOUT_MS = 15_000;

// ── Logout handler registry ─────────────────────────────────────────────────
// AuthContext calls setLogoutHandler(logout) on mount. This avoids a circular
// import: apiClient does not import AuthContext; AuthContext registers itself.

/** @type {(() => void) | null} */
let _logoutHandler = null;

/**
 * Register the application logout function so the 401 interceptor can call it.
 * Must be called once from AuthContext (or the top-level auth provider).
 * @param {() => void} fn
 */
export function setLogoutHandler(fn) {
  _logoutHandler = fn;
}

const PROFILE_CACHE_KEY = "ui-profile";

/**
 * Full client logout for 401 from non-axios callers (e.g. `apiFetch`).
 * Clears storage keys used by AuthContext, then invokes the registered handler.
 */
export function forceLogoutClient() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem("userId");
  window.localStorage.removeItem(PROFILE_CACHE_KEY);
  if (typeof _logoutHandler === "function") {
    _logoutHandler();
  }
}

// ── Axios instance ──────────────────────────────────────────────────────────
const axiosInstance = axios.create({
  baseURL: getApiBaseRoot(),
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ── Request interceptor: attach JWT + mirror fetch credentials rules ──────────
axiosInstance.interceptors.request.use(
  (config) => {
    const rawTok = window.localStorage.getItem(TOKEN_KEY);
    const token =
      typeof rawTok === "string" ? rawTok.trim() : "";
    if (
      typeof rawTok === "string" &&
      rawTok !== token &&
      token
    ) {
      window.localStorage.setItem(TOKEN_KEY, token);
    }
    const rawUrl = config.url || "";
    const base = config.baseURL || "";
    const combined = `${base}${rawUrl}`;
    const authSafe = isPublicAuthPath(rawUrl) || isPublicAuthPath(combined);
    const attachAuth = Boolean(token && !authSafe);

    if (attachAuth) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    /** Same as `apiFetch`: Bearer → no cookies; public auth → `include` for session cookies. */
    config.withCredentials = !attachAuth;

    if (import.meta.env.DEV) {
      const finalUrl = axios.getUri(config);
      logDevApiTransport({
        source: "axios",
        finalUrl,
        credentialsMode: config.withCredentials ? "include" : "omit",
        authorizationHeader: config.headers.Authorization,
      });
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: global error handling ──────────────────────────────
axiosInstance.interceptors.response.use(
  // Pass successful responses straight through.
  (response) => response,

  (error) => {
    const status = error.response?.status ?? null;

    const combinedUrl = `${error.config?.baseURL || ""}${error.config?.url || ""}`;
    const skip401Logout =
      urlIncludesVerifyOtp(combinedUrl) ||
      urlIncludesVerifyOtp(error.config?.url || "") ||
      isPublicAuthPath(error.config?.url || "") ||
      isPublicAuthPath(combinedUrl) ||
      (typeof window !== "undefined" && isAuthFlowAppPath(window.location.pathname));

    /**
     * Match `apiFetch`: delayed logout on protected routes so Network / logs stay usable;
     * skip on auth flows and verify-otp.
     */
    if (status === 401 && !skip401Logout) {
      setTimeout(() => {
        forceLogoutClient();
        window.location.href = "/login";
      }, 2000);
    }

    // Normalize to a plain Error with a predictable shape so callers don't
    // need to inspect the raw AxiosError structure.
    const hasServerResponse = Boolean(error.response);
    const message = hasServerResponse
      ? error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong"
      : error.message || "Network Error";

    const normalized = new Error(message);
    normalized.status = status;
    normalized.payload = error.response?.data ?? null;
    return Promise.reject(normalized);
  },
);

export default axiosInstance;

// ── Backward-compatible apiClient wrapper ────────────────────────────────────
// All existing service files call apiClient.get / .post / etc. and receive the
// unwrapped response body — no changes needed in those files.

function buildQueryString(path, query) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!query || typeof query !== "object") return normalizedPath;

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

  const qs = params.toString();
  return qs ? `${normalizedPath}?${qs}` : normalizedPath;
}

async function request(path, options = {}) {
  const { method = "GET", query, body, headers = {}, signal } = options;
  const url = buildQueryString(path, query);
  const response = await axiosInstance.request({
    url,
    method,
    data: body !== undefined ? body : undefined,
    headers,
    signal,
  });
  return response.data;
}

export const apiClient = {
  request,
  get: (path, options = {}) => request(path, { ...options, method: "GET" }),
  post: (path, body, options = {}) =>
    request(path, { ...options, method: "POST", body }),
  put: (path, body, options = {}) =>
    request(path, { ...options, method: "PUT", body }),
  patch: (path, body, options = {}) =>
    request(path, { ...options, method: "PATCH", body }),
  delete: (path, options = {}) =>
    request(path, { ...options, method: "DELETE" }),
};
