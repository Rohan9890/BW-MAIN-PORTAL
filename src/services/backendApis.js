import {
  backendBlob,
  backendJson,
  backendMultipart,
  backendPost,
} from "./backendClient";

/**
 * User auth (`/login`, `/verify-otp`, email verification).
 */
export const authBackend = {
  login({ email, password }) {
    return backendPost("/login", { email, password });
  },
  verifyOtp({ email, otp }) {
    const body = { email, otp };
    return backendPost("/verify-otp", body).catch((err) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn("[authBackend.verifyOtp] error response:", err?.status);
      }
      throw err;
    });
  },
  /**
   * GET `/verify-email?token=…` — completes email verification from registration link.
   */
  verifyEmailByToken(token, opts = {}) {
    const t = String(token ?? "").trim();
    return backendJson("/verify-email", {
      method: "GET",
      query: { token: t },
      suppressGlobalServerErrorToast: true,
      ...opts,
    });
  },
};

export const adminAuthBackend = {
  login({ email, password, secret }) {
    /**
     * Backend property is `admin.secret = SUPER_ADMIN_SECRET_Sandeep_2026`. The DTO
     * field name in the controller has not been confirmed, and the previous shape
     * `{ email, password, secret }` started returning 401 from
     * `POST /api/v1.0/admin/auth/login`.
     *
     * Send every plausible field-name variant in one body — Spring Boot's default
     * Jackson config (`failOnUnknownProperties: false`) ignores any keys the DTO
     * doesn't declare, so whichever name the backend binds to (`secret`,
     * `adminSecret`, `secretKey`, `adminCode`) will match. Also mirror the value
     * into an `X-Admin-Secret` header for controllers that read it via
     * `@RequestHeader`.
     *
     * `username` duplicates `email` for DTOs that use `username` as the login id
     * (still an email address).
     */
    const trimmedEmail = typeof email === "string" ? email.trim() : email;
    const trimmedSecret = typeof secret === "string" ? secret.trim() : secret;

    const json = {
      email: trimmedEmail,
      username: trimmedEmail,
      /** Never trim password — spaces may be intentional. */
      password,
      secret: trimmedSecret,
      adminSecret: trimmedSecret,
      secretKey: trimmedSecret,
      adminCode: trimmedSecret,
    };

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.group("[adminAuth.login] → POST /api/v1.0/admin/auth/login");
      // eslint-disable-next-line no-console
      console.log("body keys:", Object.keys(json));
      // eslint-disable-next-line no-console
      console.log("email (full):", trimmedEmail);
      // eslint-disable-next-line no-console
      console.log(
        "password: length only =",
        typeof password === "string" ? password.length : "(none)",
      );
      // eslint-disable-next-line no-console
      console.log(
        "secret: length only =",
        trimmedSecret ? String(trimmedSecret).length : 0,
      );
      // eslint-disable-next-line no-console
      console.log(
        "note: Bearer not attached; credentials mode include (see [API:apiFetch] line)",
      );
      // eslint-disable-next-line no-console
      console.groupEnd();
    }

    return backendJson("/admin/auth/login", {
      method: "POST",
      json,
      headers: trimmedSecret
        ? { "X-Admin-Secret": String(trimmedSecret) }
        : undefined,
      suppressGlobalServerErrorToast: true,
    })
      .then((data) => {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log(
            "[adminAuth.login] response OK; data keys:",
            data && typeof data === "object" ? Object.keys(data) : typeof data,
          );
        }
        return data;
      })
      .catch((err) => {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn("[adminAuth.login] error:", {
            status: err?.status,
            message: err?.message,
            payloadKeys:
              err?.payload && typeof err.payload === "object"
                ? Object.keys(err.payload)
                : null,
            payloadPreview:
              err?.payload && typeof err.payload === "object"
                ? {
                    error: err.payload.error,
                    message: err.payload.message,
                    status: err.payload.status,
                  }
                : err?.payload,
          });
        }
        throw err;
      });
  },
  verifyOtp({ email, otp }) {
    const body = { email, otp };
    return backendJson("/admin/auth/verify-otp", {
      method: "POST",
      json: body,
      suppressGlobalServerErrorToast: true,
    }).catch((err) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(
          "[adminAuthBackend.verifyOtp] error response:",
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
    return backendMultipart("/profile/upload-photo", fd);
  },
  /** POST /profile/update-contact/init — send OTP to new email or phone */
  updateContactInit(payload) {
    return backendJson("/profile/update-contact/init", {
      method: "POST",
      json: payload ?? {},
    });
  },
  /** POST /profile/update-contact/verify — confirm OTP and apply contact change */
  updateContactVerify(payload) {
    return backendJson("/profile/update-contact/verify", {
      method: "POST",
      json: payload ?? {},
    });
  },
};

export const dashboardBackend = {
  /** @param {object} [opts] — optional `suppressGlobalServerErrorToast` for resilient dashboards */
  getSummary(opts = {}) {
    return backendJson("/dashboard/summary", { method: "GET", ...opts });
  },
  getTransactions({ page = 0, size = 80, ...opts } = {}) {
    const qs = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    return backendJson(`/dashboard/transactions?${qs.toString()}`, {
      method: "GET",
      ...opts,
    });
  },
  /** GET /dashboard/recent-apps */
  getRecentApps(opts = {}) {
    return backendJson("/dashboard/recent-apps", { method: "GET", ...opts });
  },
  /**
   * GET /dashboard/app-usage-timeseries
   * @param {string|number} appId
   * @param {string} range e.g. 24h, 7d, 30d
   * @param {string} interval e.g. hour, day
   */
  getAppUsageTimeseries(appId, range, interval, opts = {}) {
    const qs = new URLSearchParams({
      appId: String(appId),
      range: String(range ?? ""),
      interval: String(interval ?? ""),
    });
    return backendJson(`/dashboard/app-usage-timeseries?${qs.toString()}`, {
      method: "GET",
      ...opts,
    });
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

function unwrapFavoritesList(res) {
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object") {
    const data = res.data;
    if (Array.isArray(data)) return data;
    for (const k of ["items", "content", "favorites", "results", "records"]) {
      if (Array.isArray(res[k])) return res[k];
      if (data && typeof data === "object" && Array.isArray(data[k]))
        return data[k];
    }
  }
  return [];
}

export const favoritesBackend = {
  /**
   * GET /favorites/my (Authify). Falls back to GET /favorites/list for older deployments.
   */
  async list(opts = {}) {
    const quiet = { suppressGlobalServerErrorToast: true, ...opts };
    try {
      const res = await backendJson("/favorites/my", {
        method: "GET",
        ...quiet,
      });
      return unwrapFavoritesList(res);
    } catch (e) {
      // Some backend deployments return 405/404 for the /favorites/my endpoint
      // (older APIs expose /favorites/list). Some servers incorrectly return
      // a 500 with a message like "Request method 'GET' is not supported" —
      // treat that as a fallback case as well.
      const errMsg =
        e && typeof e === "object"
          ? String(
              (e.payload && (e.payload.error || e.payload.message)) ||
                e.message ||
                "",
            )
          : String(e || "");
      if (
        e?.status === 404 ||
        e?.status === 405 ||
        (e?.status === 500 && /request method.*GET/i.test(errMsg))
      ) {
        const res = await backendJson("/favorites/list", {
          method: "GET",
          ...quiet,
        });
        return unwrapFavoritesList(res);
      }
      throw e;
    }
  },
  add(appId) {
    return backendJson(`/favorites/${encodeURIComponent(String(appId))}`, {
      method: "POST",
    });
  },
  /** PUT /favorites/toggle/{appId} — server-side flip (optional; callers may still use add/remove). */
  toggle(appId) {
    return backendJson(
      `/favorites/toggle/${encodeURIComponent(String(appId))}`,
      {
        method: "PUT",
        json: {},
      },
    );
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
  /** GET /notifications/my — paginated inbox */
  list({ page = 0, size = 10, ...opts } = {}) {
    const qs = new URLSearchParams({ page: String(page), size: String(size) });
    return backendJson(`/notifications/my?${qs.toString()}`, {
      method: "GET",
      ...opts,
    });
  },
  /** GET /notifications/unread-count */
  unreadCount(opts = {}) {
    return backendJson("/notifications/unread-count", {
      method: "GET",
      ...opts,
    });
  },
  markRead(id) {
    return backendJson(
      `/notifications/${encodeURIComponent(String(id))}/read`,
      {
        method: "PUT",
        json: {},
      },
    );
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
  /** GET /activity/my — paginated activity feed (Spring-style page or raw array). */
  list({ page = 0, size = 10, ...opts } = {}) {
    const qs = new URLSearchParams({ page: String(page), size: String(size) });
    return backendJson(`/activity/my?${qs.toString()}`, {
      method: "GET",
      ...opts,
    });
  },
  /** @deprecated use list() — alias for backward compatibility */
  my(opts) {
    return this.list(opts);
  },
};

export const ticketsBackend = {
  async create(payload) {
    const res = await backendPost("/tickets/create", payload ?? {});
    // Support `{ success: true, data: {...} }` without breaking existing callers.
    const normalized = res?.data ?? res;
    return normalized;
  },
  my(opts = {}) {
    return backendJson("/tickets/my", { method: "GET", ...opts });
  },
  async getById(id) {
    const res = await backendJson(
      `/tickets/${encodeURIComponent(String(id))}`,
      { method: "GET" },
    );
    return res;
  },
  /**
   * Reply on a ticket. Spring-style APIs typically expose POST `/tickets/{id}/reply`
   * (see `endpoints.tickets.reply`). A bare POST `/tickets/reply` often has no handler → 500
   * "Request method 'POST' is not supported".
   */
  async reply(payload) {
    const p = payload && typeof payload === "object" ? payload : {};
    const tid = p.ticketId ?? p.id;
    if (tid == null || String(tid).trim() === "") {
      throw new Error("Reply requires ticketId or id in the payload");
    }
    const path = `/tickets/${encodeURIComponent(String(tid))}/reply`;
    const res = await backendPost(path, p);
    return res;
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
    return backendJson("/settings/deactivate", {
      method: "PUT",
      json: payload ?? {},
    });
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
