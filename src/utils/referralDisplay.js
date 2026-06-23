/** Canonical label when a user has no referral attribution. */
export const DIRECT_SIGNUP_LABEL = "Direct Signup";

/**
 * Normalize admin/API referred-by values to a single display string.
 * Empty, null-like, and dash placeholders → DIRECT_SIGNUP_LABEL.
 */
export function normalizeReferredByDisplay(raw) {
  const s = String(raw ?? "").trim();
  if (!s || s === "—" || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") {
    return DIRECT_SIGNUP_LABEL;
  }
  if (/^direct\s*signup$/i.test(s)) {
    return DIRECT_SIGNUP_LABEL;
  }
  return s;
}

export function isDirectSignup(value) {
  return normalizeReferredByDisplay(value) === DIRECT_SIGNUP_LABEL;
}
