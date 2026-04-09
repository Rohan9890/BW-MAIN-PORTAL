/**
 * Reusable fetch-based API utility for backend integration.
 * Automatically attaches Authorization Bearer token from localStorage.
 */

const API_BASE_URL = "http://43.205.116.38:8080/api/v1.0";
const TOKEN_KEY = "ui-access-token";
const USER_ID_KEY = "userId";

/**
 * Generic API call handler using fetch.
 * @param {string} endpoint API endpoint (e.g. "/login", "/profile").
 * @param {string} method HTTP method.
 * @param {object|null} body Request body for non-GET methods.
 * @returns {Promise<any>} Parsed JSON response.
 */
export async function apiCall(endpoint, method = "GET", body = null) {
  const url = `${API_BASE_URL}${endpoint}`;

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw {
      message: data?.message || `HTTP ${response.status}`,
      status: response.status,
      data,
    };
  }

  return data;
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

export async function loginWithEmailPassword(email, password) {
  return apiCall("/login", "POST", { email, password });
}

export async function registerUser(payload) {
  return apiCall("/register", "POST", payload);
}

export async function verifyOtpLogin(email, otp) {
  return apiCall("/login/verify-otp", "POST", { email, otp });
}

export async function getProfile() {
  return apiCall("/profile", "GET");
}

export async function getCart(userId) {
  return apiCall(`/cart/${userId}`, "GET");
}

export async function addToCart(userId, productData) {
  return apiCall(`/cart/${userId}/add`, "POST", productData);
}

export async function removeFromCart(userId, productId) {
  return apiCall(`/cart/${userId}/${productId}/delete`, "DELETE");
}

export async function getDashboardSummary(userId) {
  return apiCall(`/dashboard/summary/${userId}`, "GET");
}

export async function getDashboardTransactions(userId) {
  return apiCall(`/dashboard/transactions/${userId}`, "GET");
}
