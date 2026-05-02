import { backendBlob, backendJson, backendMultipart, backendPost } from "./backendClient";

export const authBackend = {
  login({ email, password }) {
    return backendPost("/login", { email, password });
  },
  verifyOtp({ email, otp }) {
    const body = { email, otp };
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info("[authBackend.verifyOtp] POST /api/v1.0/verify-otp body:", body);
    }
    return backendPost("/verify-otp", body).catch((err) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(
          "[authBackend.verifyOtp] error response:",
          err?.status,
          err?.payload ?? err?.message,
        );
      }
      throw err;
    });
  },
};

export const profileBackend = {
  getProfile() {
    return backendJson("/profile", { method: "GET" });
  },
  updateProfile({ name, phoneNumber }) {
    return backendJson("/profile", {
      method: "PUT",
      json: { name, phoneNumber },
    });
  },
  uploadPhoto(file) {
    const fd = new FormData();
    fd.append("file", file);
    if (import.meta?.env?.DEV) {
      // DEV-only: prove request shape (no secrets).
      console.info("[profile/upload-photo] uploading", {
        endpoint: "/profile/upload-photo",
        formKeys: Array.from(fd.keys()),
        file: file
          ? { name: file.name, type: file.type, size: file.size }
          : null,
      });
    }
    return backendMultipart("/profile/upload-photo", fd);
  },
};

export const dashboardBackend = {
  getSummary() {
    return backendJson("/dashboard/summary");
  },
  getTransactions({ page = 0, size = 80 } = {}) {
    const qs = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    return backendJson(`/dashboard/transactions?${qs.toString()}`);
  },
};

export const applicationBackend = {
  list() {
    return backendJson("/application/list");
  },
  my() {
    return backendJson("/application/my");
  },
  open(appId) {
    return backendPost("/application/open", { appId });
  },
};

export const favoritesBackend = {
  list() {
    return backendJson("/favorites/list");
  },
  add(appId) {
    return backendJson(`/favorites/${encodeURIComponent(String(appId))}`, {
      method: "POST",
    });
  },
  remove(appId) {
    return backendJson(`/favorites/${encodeURIComponent(String(appId))}`, {
      method: "DELETE",
    });
  },
};

export const kycBackend = {
  me() {
    return backendJson("/kyc/me", { method: "GET" });
  },
  /** Multipart KYC document upload */
  upload(formData) {
    return backendMultipart("/kyc/upload", formData);
  },
  resubmit(payload) {
    return backendPost("/kyc/resubmit", payload ?? {});
  },
};

export const notificationsBackend = {
  /** GET /notifications — paginated inbox */
  list({ page = 0, size = 20 } = {}) {
    const qs = new URLSearchParams({ page: String(page), size: String(size) });
    return backendJson(`/notifications?${qs.toString()}`, { method: "GET" });
  },
  markRead(id) {
    return backendJson(`/notifications/${encodeURIComponent(String(id))}/read`, {
      method: "PUT",
      json: {},
    });
  },
  readAll() {
    return backendJson("/notifications/read-all", { method: "PUT", json: {} });
  },
  deleteById(id) {
    return backendJson(`/notifications/${encodeURIComponent(String(id))}`, {
      method: "DELETE",
    });
  },
};

export const activityBackend = {
  /** GET /activity — paginated activity feed (Spring-style page or raw array). */
  list({ page = 0, size = 10 } = {}) {
    const qs = new URLSearchParams({ page: String(page), size: String(size) });
    return backendJson(`/activity?${qs.toString()}`, { method: "GET" });
  },
  /** @deprecated use list() — alias for backward compatibility */
  my(opts) {
    return this.list(opts);
  },
};

export const ticketsBackend = {
  create(payload) {
    if (import.meta?.env?.DEV) {
      console.info("[tickets/create] payload", payload ?? {});
    }
    return backendPost("/tickets/create", payload ?? {});
  },
  my() {
    return backendJson("/tickets/my", { method: "GET" });
  },
  getById(id) {
    return backendJson(`/tickets/${encodeURIComponent(String(id))}`, { method: "GET" });
  },
  /** POST /tickets/reply — body must include ticket id + message (backend-specific keys included for compatibility). */
  reply(payload) {
    return backendPost("/tickets/reply", payload ?? {});
  },
};

export const sessionsBackend = {
  list() {
    return backendJson("/settings/sessions", { method: "GET" });
  },
  revoke(sessionId) {
    return backendJson(`/sessions/${encodeURIComponent(String(sessionId))}`, {
      method: "DELETE",
    });
  },
};

export const settingsBackend = {
  me() {
    return backendJson("/settings/me", { method: "GET" });
  },
  update(payload) {
    return backendJson("/settings/me", { method: "PUT", json: payload ?? {} });
  },
  changePassword(payload) {
    return backendPost("/settings/change-password", payload ?? {});
  },
  logoutAll() {
    return backendPost("/settings/logout-all", {});
  },
  deactivate(payload) {
    return backendJson("/settings/deactivate", { method: "PUT", json: payload ?? {} });
  },
  exportBlob() {
    return backendBlob("/settings/export", { method: "GET" });
  },
};

export const passwordBackend = {
  forgotPassword(email) {
    return backendPost("/forgot-password", { email });
  },
  resetPassword(payload) {
    return backendPost("/reset-password", payload ?? {});
  },
};

export const appBackend = {
  apply(appId) {
    const qs = new URLSearchParams({ appId: String(appId) });
    return backendJson(`/app/apply?${qs.toString()}`, { method: "POST" });
  },
  get(appId) {
    const qs = new URLSearchParams({ appId: String(appId) });
    return backendJson(`/app/get?${qs.toString()}`);
  },
};

