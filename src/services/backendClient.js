import { apiFetch } from "./apiFetch";
import { showError } from "./toast";

function toError(message, extras = {}) {
  const err = new Error(message || "Something went wrong");
  Object.assign(err, extras);
  return err;
}

/** Spring-style validation and generic API error text */
export function buildApiErrorMessage(payload, fallback) {
  if (payload == null) return fallback;
  if (typeof payload === "string" && payload.trim()) return payload.trim();
  if (typeof payload !== "object") return fallback;
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }
  if (Array.isArray(payload.errors)) {
    const parts = payload.errors
      .map((e) =>
        e && typeof e === "object"
          ? e.defaultMessage || e.message || ""
          : String(e || ""),
      )
      .filter(Boolean);
    if (parts.length) return parts.join(" ");
  }
  if (payload.errors && typeof payload.errors === "object" && !Array.isArray(payload.errors)) {
    const parts = Object.entries(payload.errors).map(([k, v]) => {
      const val = Array.isArray(v) ? v.join(", ") : String(v ?? "");
      return `${k}: ${val}`;
    });
    if (parts.length) return parts.join("; ");
  }
  return fallback;
}

async function readJsonSafe(res) {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function unwrapBackendEnvelope(res, unwrapOptions = {}) {
  const { suppressGlobalServerErrorToast } = unwrapOptions || {};
  // apiFetch returns null on 401 and handles redirect/logout.
  if (!res) throw toError("Session expired. Please login again.", { status: 401 });

  const payload = await readJsonSafe(res);
  if (!res.ok) {
    const fallback = `HTTP ${res.status}`;
    const message = buildApiErrorMessage(payload, fallback);
    if (res.status >= 500 && !suppressGlobalServerErrorToast) {
      showError(message !== fallback ? message : "Server error. Please try again shortly.");
    }
    throw toError(message, { status: res.status, payload });
  }

  if (!payload || typeof payload !== "object") return payload;

  // Standard backend envelope: `{ status: number, data: ... }` — avoid treating unrelated
  // body shapes (e.g. `{ token, message }`) as envelopes unless `data` is explicit.
  const looksLikeEnvelope =
    typeof payload.status === "number" &&
    Object.prototype.hasOwnProperty.call(payload, "data");
  if (looksLikeEnvelope) {
    return payload.data;
  }

  return payload;
}

/**
 * Calls backend using centralized `apiFetch()` and unwraps the standard envelope:
 *   { status: number, message?: string, data: any }
 *
 * Returns `data` directly.
 */
export async function backendJson(path, options = {}) {
  const { json, suppressGlobalServerErrorToast, ...fetchOptions } = options || {};
  const requestOptions = json
    ? {
        ...fetchOptions,
        method: fetchOptions.method || "POST",
        body: JSON.stringify(json),
      }
    : fetchOptions;

  const res = await apiFetch(path, requestOptions);
  return unwrapBackendEnvelope(res, { suppressGlobalServerErrorToast });
}

export async function backendPost(path, body) {
  return backendJson(path, { method: "POST", json: body ?? {} });
}

export async function backendBlob(path, options = {}) {
  const res = await apiFetch(path, { ...(options || {}), method: options?.method || "GET" });
  if (!res) throw toError("Session expired. Please login again.", { status: 401 });
  if (!res.ok) {
    const payload = await readJsonSafe(res);
    const fallback = `HTTP ${res.status}`;
    const message = buildApiErrorMessage(payload, fallback);
    if (res.status >= 500) {
      showError(message !== fallback ? message : "Server error. Please try again shortly.");
    }
    throw toError(message, { status: res.status, payload });
  }
  return res.blob();
}

export async function backendMultipart(path, formData, options = {}) {
  const res = await apiFetch(path, {
    ...(options || {}),
    method: options?.method || "POST",
    body: formData,
  });
  return unwrapBackendEnvelope(res);
}

