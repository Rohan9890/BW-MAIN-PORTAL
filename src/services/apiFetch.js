import { forceLogoutClient } from "./apiClient";
import {
  buildApiRequestUrl,
  isAuthTokenDebugEnabled,
  logDevApiTransport,
} from "./apiConfig";
import {
  isAuthFlowAppPath,
  isPublicAuthPath,
  isSessionSoft401Path,
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
    // eslint-disable-next-line no-console
    console.group("[AUTH DEBUG] outgoing GET /profile");
    // eslint-disable-next-line no-console
    console.log("Bearer JWT length:", token.length);
    // eslint-disable-next-line no-console
    console.log("Request URL:", requestUrl);
    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  const profileVerbose =
    import.meta.env.DEV &&
    import.meta.env.VITE_DEBUG_PROFILE === "true" &&
    isProfilePath;

  if (profileVerbose) {
    const t = token ? String(token).trim() : "";
    // eslint-disable-next-line no-console
    console.log("[profile] apiFetch verbose", {
      path: url,
      requestUrl,
      tokenPresent: Boolean(t),
      tokenLength: t.length,
      attachAuth,
      publicPath,
      authorizationPresent: Boolean(mergedHeaders.Authorization),
    });
  }

  const res = await fetch(requestUrl, {
    ...options,
    headers: mergedHeaders,
    credentials: credentialsMode,
  });

  if (import.meta.env.DEV && normalizeAuthPath(url) === "/admin/auth/login") {
    // eslint-disable-next-line no-console
    console.log(
      "[apiFetch] /admin/auth/login HTTP status:",
      res.status,
      res.statusText,
    );
  }

  if (import.meta.env.DEV && isProfilePath && res.status === 401) {
    // eslint-disable-next-line no-console
    console.warn("[profile] 401 unauthorized");
  }

  if (profileVerbose) {
    // eslint-disable-next-line no-console
    console.log("[profile] response status:", res.status, res.statusText);
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
     * Optional endpoints (e.g. notifications) may 401 due to backend routing/roles while
     * `/profile` still succeeds — return the response and let callers degrade; do not logout.
     */
    if (isSessionSoft401Path(url) || isSessionSoft401Path(requestUrl)) {
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
