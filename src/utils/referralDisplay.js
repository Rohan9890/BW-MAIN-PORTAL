/** Canonical label when a user has no referral attribution. */
export const DIRECT_SIGNUP_LABEL = "Direct Signup";

/** Legacy referral prefix — display as-is during backend migration. */
export const LEGACY_REFERRAL_RE = /^REF-/i;

/** Founder-valid referred-by / referral code prefixes. */
export const FOUNDER_REFERRAL_DISPLAY_RE =
  /^(BWVPL#\d+|USR-|ORG-)/i;

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
 * Admin "Referred By" display — only BWVPL#26, USR-*, ORG-*, legacy REF-*.
 * Hides numeric DB ids and ADM-* (staff accounts are not referrers).
 */
export function sanitizeReferredByForDisplay(raw) {
  const s = String(raw ?? "").trim();
  if (!s || s === "—" || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") {
    return DIRECT_SIGNUP_LABEL;
  }
  if (/^direct\s*signup$/i.test(s)) {
    return DIRECT_SIGNUP_LABEL;
  }
  if (s === "BWVPL#26" || FOUNDER_REFERRAL_DISPLAY_RE.test(s)) {
    return s;
  }
  if (isLegacyReferralCode(s)) {
    return s;
  }
  if (/^ADM-/i.test(s) || /^\d+$/.test(s)) {
    return DIRECT_SIGNUP_LABEL;
  }
  return s;
}

/**
 * Normalize admin/API referred-by values to a single display string.
 * Empty, null-like, and dash placeholders → DIRECT_SIGNUP_LABEL.
 */
export function normalizeReferredByDisplay(raw) {
  return sanitizeReferredByForDisplay(raw);
}

export function isDirectSignup(value) {
  return normalizeReferredByDisplay(value) === DIRECT_SIGNUP_LABEL;
}

function collectReferredByCandidates(user) {
  if (!user || typeof user !== "object") return [];
  const nodes = [user, user._raw, user.user, user.profile].filter(
    (n) => n && typeof n === "object",
  );
  /** @type {unknown[]} */
  const candidates = [];
  for (const node of nodes) {
    candidates.push(node.referredBy, node.referredByUserId);
    candidates.push(node.referrerUserId, node.referrerId, node.referredByCode);
    const rb = node.referredBy;
    if (rb && typeof rb === "object") {
      candidates.push(
        rb.userId,
        rb.id,
        rb.code,
        rb.referralCode,
        rb.email,
        rb.name,
      );
    }
  }
  return candidates;
}

/** Resolve referred-by from admin user API rows (string, object, or legacy id fields). */
export function extractReferredByFromUser(user) {
  for (const candidate of collectReferredByCandidates(user)) {
    const s = String(candidate ?? "").trim();
    if (!s || s === "—") continue;
    if (
      s === "BWVPL#26" ||
      FOUNDER_REFERRAL_DISPLAY_RE.test(s) ||
      isLegacyReferralCode(s)
    ) {
      return s;
    }
  }
  return DIRECT_SIGNUP_LABEL;
}
