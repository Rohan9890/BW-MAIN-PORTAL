/** Persist referral code from ?ref= across refresh and login → register navigation. */
export const REFERRAL_REF_STORAGE_KEY = "bw-referral-ref";
export const REFERRAL_LOCKED_STORAGE_KEY = "bw-referral-ref-locked";

export function parseReferralFromSearch(search) {
  const raw =
    typeof search === "string"
      ? search
      : typeof window !== "undefined"
        ? window.location.search
        : "";
  return String(new URLSearchParams(raw).get("ref") || "").trim();
}

export function readStoredReferralRef() {
  try {
    return (
      sessionStorage.getItem(REFERRAL_REF_STORAGE_KEY) ||
      localStorage.getItem(REFERRAL_REF_STORAGE_KEY) ||
      ""
    ).trim();
  } catch {
    return "";
  }
}

export function readReferralLocked() {
  try {
    return (
      sessionStorage.getItem(REFERRAL_LOCKED_STORAGE_KEY) === "1" ||
      localStorage.getItem(REFERRAL_LOCKED_STORAGE_KEY) === "1"
    );
  } catch {
    return false;
  }
}

export function persistReferralRef(ref, options = {}) {
  const value = String(ref ?? "").trim();
  if (!value) return;
  const locked = Boolean(options.locked);
  try {
    sessionStorage.setItem(REFERRAL_REF_STORAGE_KEY, value);
    localStorage.setItem(REFERRAL_REF_STORAGE_KEY, value);
    if (locked) {
      sessionStorage.setItem(REFERRAL_LOCKED_STORAGE_KEY, "1");
      localStorage.setItem(REFERRAL_LOCKED_STORAGE_KEY, "1");
    }
  } catch {
    /* storage unavailable */
  }
}

export function clearStoredReferralRef() {
  try {
    sessionStorage.removeItem(REFERRAL_REF_STORAGE_KEY);
    localStorage.removeItem(REFERRAL_REF_STORAGE_KEY);
    sessionStorage.removeItem(REFERRAL_LOCKED_STORAGE_KEY);
    localStorage.removeItem(REFERRAL_LOCKED_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Resolve referral state from URL + storage for registration forms.
 * Locks when ?ref= is present or a prior invite-link session was persisted.
 */
export function resolveReferralInviteState(search) {
  const fromUrl = parseReferralFromSearch(search);
  if (fromUrl) {
    persistReferralRef(fromUrl, { locked: true });
  }
  const locked = Boolean(fromUrl) || readReferralLocked();
  const ref = fromUrl || (locked ? readStoredReferralRef() : "");
  return { ref, locked };
}

/**
 * Referral value for submit — optional for normal signup.
 * Only falls back to stored ref when the invite link locked the field.
 */
export function resolveReferralCodeForSubmit(formReferral, options = {}) {
  const locked = Boolean(options.locked);
  const fromForm = String(formReferral || "").trim();
  if (fromForm) return fromForm;
  if (locked) return readStoredReferralRef();
  return "";
}

/** Map backend registration errors to the referral field when applicable. */
export function isReferralRegistrationError(message) {
  const m = String(message || "").toLowerCase();
  if (!m.includes("referral")) return false;
  return (
    m.includes("invalid") ||
    m.includes("not found") ||
    m.includes("unknown") ||
    m.includes("expired") ||
    m.includes("does not exist") ||
    m.includes("required")
  );
}

/** Build shareable registration URL from the user's referral code. */
export function buildReferralRegistrationLink(referralCode) {
  const code = String(referralCode ?? "").trim();
  if (!code) return "";
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "";
  if (!origin) return `/register?ref=${encodeURIComponent(code)}`;
  return `${origin}/register?ref=${encodeURIComponent(code)}`;
}
