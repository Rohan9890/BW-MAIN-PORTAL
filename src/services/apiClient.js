import axios from "axios";

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

// ── Axios instance ──────────────────────────────────────────────────────────
const axiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "").replace(/\/$/, ""),
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ── Request interceptor: attach JWT ─────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

    // 401 Unauthorized → token is expired or invalid; force logout.
    if (status === 401) {
      window.localStorage.removeItem(TOKEN_KEY);
      if (typeof _logoutHandler === "function") {
        _logoutHandler();
      }
    }

    // Normalize to a plain Error with a predictable shape so callers don't
    // need to inspect the raw AxiosError structure.
    const serverMessage = error.response?.data?.message;
    const message =
      typeof serverMessage === "string"
        ? serverMessage
        : error.message || "Request failed";

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
