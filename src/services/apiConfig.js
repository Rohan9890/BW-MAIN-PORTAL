/**
 * Single source of truth for API origin + `/api/v1.0` prefix.
 *
 * **`VITE_API_URL`** — scheme + host + port only (no path), e.g. `http://43.205.116.38:8080`
 *
 * | Mode | `VITE_API_URL` set | Behavior |
 * |------|-------------------|----------|
 * | dev  | yes               | Browser calls backend **directly** (CORS must allow dev origin). |
 * | dev  | no                | Origin `""` → relative `/api/v1.0/...` → **Vite proxy** → backend. |
 * | prod | yes               | Direct to env host. |
 * | prod | no                | Falls back to {@link DEFAULT_API_ORIGIN}. |
 */
export const DEFAULT_API_ORIGIN = "http://43.205.116.38:8080";

export const API_PREFIX = "/api/v1.0";

function trimOrigin(v) {
  return String(v ?? "")
    .trim()
    .replace(/\/$/, "");
}

export function getApiOrigin() {
  const fromEnv = trimOrigin(import.meta.env.VITE_API_URL);
  if (fromEnv) return fromEnv;
  if (import.meta.env.PROD) return DEFAULT_API_ORIGIN;
  return "";
}

/** `true` when requests use same-origin `/api/...` + Vite `server.proxy` (dev only, env unset). */
export function usesViteProxy() {
  return import.meta.env.DEV && !trimOrigin(import.meta.env.VITE_API_URL);
}

export function getApiBaseRoot() {
  return `${getApiOrigin()}${API_PREFIX}`;
}

/**
 * @param {string} path API path starting with `/`, e.g. `/profile`
 */
export function buildApiRequestUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${getApiOrigin()}${API_PREFIX}${p}`;
}

/** Safe preview for DEV logs (never log full JWT). */
export function previewAuthorizationHeader(value) {
  if (value == null || value === "") return "(none)";
  const s = String(value);
  if (!/^Bearer\s+\S+/i.test(s)) return s.length > 80 ? `${s.slice(0, 40)}…` : s;
  const raw = s.replace(/^Bearer\s+/i, "").trim();
  if (raw.length < 24) return `Bearer (${raw.length} chars)`;
  return `Bearer ${raw.slice(0, 12)}…${raw.slice(-8)} (${raw.length} chars)`;
}

/**
 * DEV-only: single-line transport summary (Final URL, Authorization presence, credentials).
 */
export function logDevApiTransport({
  source = "apiFetch",
  finalUrl,
  credentialsMode,
  authorizationHeader,
}) {
  if (!import.meta.env.DEV) return;
  const authPresent = Boolean(
    authorizationHeader && String(authorizationHeader).trim(),
  );
  console.log(`[API:${source}]`, {
    finalUrl,
    authorizationPresent: authPresent,
    authorizationPreview: previewAuthorizationHeader(authorizationHeader),
    credentials: credentialsMode,
    transport: usesViteProxy() ? "relative+Vite-proxy" : "direct-to-origin",
  });
}

/**
 * DEV only: set `VITE_DEBUG_AUTH_TOKEN=true` in `.env` to log the **full** JWT and exact
 * `Authorization` header (for comparing with Postman/curl). Never ship production builds with this enabled.
 */
export function isAuthTokenDebugEnabled() {
  return import.meta.env.DEV && import.meta.env.VITE_DEBUG_AUTH_TOKEN === "true";
}
