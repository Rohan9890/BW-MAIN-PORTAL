import { forceLogoutClient } from "./apiClient";
import {
  buildApiRequestUrl,
  isAuthTokenDebugEnabled,
  logDevApiTransport,
} from "./apiConfig";
import {
  isAuthFlowAppPath,
  isPublicAuthPath,
  normalizeAuthPath,
  urlIncludesVerifyOtp,
} from "./authPaths";

export { PUBLIC_AUTH_PATHS_LIST } from "./authPaths";
export { isPublicAuthPath, normalizeAuthPath } from "./authPaths";

export async function apiFetch(url, options = {}) {
  const rawStored = localStorage.getItem("ui-access-token");
  let token = typeof rawStored === "string" ? rawStored.trim() : "";
  if (
    import.meta.env.DEV &&
    typeof rawStored === "string" &&
    rawStored !== token &&
    token
  ) {
    console.warn(
      "[apiFetch] ui-access-token had leading/trailing whitespace; normalized in storage.",
      { rawLength: rawStored.length, trimmedLength: token.length },
    );
    localStorage.setItem("ui-access-token", token);
  }

  const isFormData =
    typeof FormData !== "undefined" && options?.body instanceof FormData;

  const publicPath = isPublicAuthPath(url);
  /** Never attach Bearer on login / OTP / password reset — stale JWT causes "session expired". */
  const attachAuth = !publicPath && Boolean(token);

  const mergedHeaders = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(attachAuth ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  if (publicPath) {
    delete mergedHeaders.Authorization;
    delete mergedHeaders.authorization;
  }

  /**
   * - **Public auth** (login, verify-otp, …): send **cookies** (`include`) so `JSESSIONID`
   *   from `/login` reaches `/verify-otp` when the backend is session-aware.
   * - **Bearer requests**: use **`omit`** so a stale pre-auth `JSESSIONID` is not sent
   *   with `Authorization: Bearer`. Some Spring stacks treat the session as anonymous
   *   and ignore the JWT, which produces **401 on `/profile`** even when verify-otp
   *   returned a valid token.
   */
  const credentialsMode = attachAuth ? "omit" : "include";

  const requestUrl = buildApiRequestUrl(url);

  if (import.meta.env.DEV) {
    logDevApiTransport({
      source: "apiFetch",
      finalUrl: requestUrl,
      credentialsMode,
      authorizationHeader: mergedHeaders.Authorization,
    });
  }

  const isProfilePath = normalizeAuthPath(url) === "/profile";
  if (
    isAuthTokenDebugEnabled() &&
    isProfilePath &&
    attachAuth &&
    mergedHeaders.Authorization
  ) {
    console.group("[AUTH DEBUG] outgoing GET /profile");
    console.log("Authorization header (exact full string):", mergedHeaders.Authorization);
    console.log("Bearer JWT only (exact):", token);
    console.log(
      "Equivalent curl (headers match Postman “Bearer Token”):",
      `curl -sS -i -H "Authorization: Bearer ${token}" "${requestUrl}"`,
    );
    console.info(
      "Backend header format: standard `Authorization: Bearer <JWT>` (RFC 6750); same token returns 200 from server curl per backend docs.",
    );
    console.groupEnd();
  }

  const profileVerbose =
    import.meta.env.DEV &&
    import.meta.env.VITE_DEBUG_PROFILE === "true" &&
    isProfilePath;

  if (profileVerbose) {
    const t = token ? String(token).trim() : "";
    console.group("[profile] apiFetch — verbose (VITE_DEBUG_PROFILE)");
    console.log("path:", url, "→", requestUrl);
    console.log("token in localStorage:", Boolean(t), "| length:", t.length);
    console.log("attachAuth:", attachAuth, "| publicPath:", publicPath);
    console.log("full request headers:", { ...mergedHeaders });
    console.groupEnd();
  }

  const res = await fetch(requestUrl, {
    ...options,
    headers: mergedHeaders,
    credentials: credentialsMode,
  });

  if (import.meta.env.DEV && isProfilePath && res.status === 401) {
    try {
      const errText = await res.clone().text();
      console.warn(
        "[profile] 401 response body (backend):",
        errText || "(empty)",
      );
    } catch (e) {
      console.warn("[profile] could not read 401 body:", e);
    }
  }

  if (profileVerbose) {
    console.log("[profile] response status:", res.status, res.statusText);
    try {
      const raw = await res.clone().text();
      console.log(
        "[profile] response body:",
        raw.length > 1200 ? `${raw.slice(0, 1200)}… (${raw.length} chars)` : raw || "(empty)",
      );
    } catch (readErr) {
      console.warn("[profile] could not read response body:", readErr);
    }
  }

  const otpLike =
    isPublicAuthPath(url) ||
    urlIncludesVerifyOtp(url) ||
    urlIncludesVerifyOtp(requestUrl);

  if (res.status === 401) {
    /** Let callers see failed OTP/session responses (never treat like session expiry redirect). */
    if (otpLike) {
      return res;
    }

    /** On login/forgot/reset pages, background calls (e.g. GET /profile) may 401 — do not hard-redirect away while debugging OTP. */
    if (typeof window !== "undefined" && isAuthFlowAppPath(window.location.pathname)) {
      return res;
    }

    /**
     * Delay redirect so Network tab / logs remain observable for non-auth routes.
     */
    setTimeout(() => {
      forceLogoutClient();
      window.location.href = "/login";
    }, 2000);

    return null;
  }

  return res;
}
