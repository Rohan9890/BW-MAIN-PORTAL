/** Canonical label when a user has no referral attribution. */
export const DIRECT_SIGNUP_LABEL = "Direct Signup";

/** Legacy referral prefix — display as-is during backend migration. */
export const LEGACY_REFERRAL_RE = /^REF-/i;

export function isLegacyReferralCode(value) {
  return LEGACY_REFERRAL_RE.test(String(value ?? "").trim());
}

/**
 * Normalize referral code for display — trusts backend USR-* / ORG-* when present.
 * Legacy REF-* codes are shown unchanged (not corrupted to USR-*).
 */
export function normalizeReferralCodeDisplay(raw) {
  const s = String(raw ?? "").trim();
  if (!s || s === "—") return "";
  return s;
}

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

/** Resolve referred-by from admin user API rows (string, object, or legacy id fields). */
export function extractReferredByFromUser(user) {
  if (!user || typeof user !== "object") {
    return normalizeReferredByDisplay("");
  }

  const referredBy = user.referredBy;
  if (typeof referredBy === "string") {
    return normalizeReferredByDisplay(referredBy);
  }
  if (referredBy && typeof referredBy === "object") {
    return normalizeReferredByDisplay(
      referredBy.userId ??
        referredBy.id ??
        referredBy.code ??
        referredBy.referralCode ??
        referredBy.email ??
        referredBy.name,
    );
  }

  return normalizeReferredByDisplay(
    user.referredByUserId ??
      user.referrerUserId ??
      user.referrerId ??
      user.referralCode ??
      user.referredByCode,
  );
}
