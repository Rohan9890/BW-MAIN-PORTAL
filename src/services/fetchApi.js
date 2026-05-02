import { buildApiRequestUrl, logDevApiTransport } from "./apiConfig";
import { isPublicAuthPath } from "./authPaths";

const TOKEN_KEY = "ui-access-token";
const USER_ID_KEY = "userId";

// ================= GENERIC API =================
export async function apiCall(
  endpoint,
  method = "GET",
  body = null,
  isFormData = false,
) {
  const ep = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = buildApiRequestUrl(ep);

  const headers = {};

  // ✅ only JSON ke liye content-type
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const rawTok = localStorage.getItem(TOKEN_KEY);
  const token =
    typeof rawTok === "string" ? rawTok.trim() : "";
  if (
    typeof rawTok === "string" &&
    rawTok !== token &&
    token
  ) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  const attachAuth = Boolean(token && !isPublicAuthPath(endpoint));
  if (attachAuth) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (isPublicAuthPath(endpoint)) {
    delete headers.Authorization;
    delete headers.authorization;
  }

  const credentialsMode = attachAuth ? "omit" : "include";

  if (import.meta.env.DEV) {
    logDevApiTransport({
      source: "fetchApi",
      finalUrl: url,
      credentialsMode,
      authorizationHeader: headers.Authorization,
    });
  }

  const options = {
    method,
    headers,
    credentials: credentialsMode,
  };

  // ✅ body handling
  if (body && method !== "GET") {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  let response;
  let data = {};

  try {
    response = await fetch(url, options);

    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    throw {
      message: "Network error. Please check your connection.",
      status: 0,
    };
  }

  if (!response.ok) {
    throw {
      message: data?.message || `HTTP ${response.status}`,
      status: response.status,
      data,
    };
  }

  return data;
}

// ================= AUTH =================
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

export async function loginWithEmailPassword(email, password) {
  return apiCall("/login", "POST", { email, password });
}

export async function verifyOtpLogin(email, otp) {
  return apiCall("/verify-otp", "POST", { email, otp });
}

// ================= REGISTER =================
export async function registerUser(formData) {
  return apiCall("/register", "POST", formData, true); // ✅ FormData
}

// ================= PROFILE =================
export async function getProfile() {
  return apiCall("/profile", "GET");
}

export async function uploadProfilePhoto(file) {
  const fd = new FormData();
  fd.append("file", file);

  return apiCall("/profile/upload-photo", "POST", fd, true);
}

// ================= DASHBOARD =================
export async function getDashboardSummary(userId) {
  return apiCall(`/dashboard/summary/${userId}`, "GET");
}

export async function getDashboardTransactions(userId) {
  return apiCall(`/dashboard/transactions/${userId}`, "GET");
}
