/** Persist referral code from ?ref= across refresh and login → register navigation. */
export const REFERRAL_REF_STORAGE_KEY = "bw-referral-ref";
export const REFERRAL_LOCKED_STORAGE_KEY = "bw-referral-ref-locked";

/** Default platform referral for direct signup (always locked, not user-editable). */
export const DEFAULT_DIRECT_SIGNUP_REFERRAL = "BWVPL#26";

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
 * Resolve referral state for registration forms.
 * - Direct signup → default `BWVPL#26`, always locked
 * - `/register?ref=CODE` → invite code overrides default, locked
 * Clears stale storage on direct signup to prevent pollution.
 */
export function resolveReferralInviteState(search) {
  const fromUrl = parseReferralFromSearch(search);
  if (fromUrl) {
    persistReferralRef(fromUrl, { locked: true });
    return { ref: fromUrl, locked: true, fromInviteLink: true };
  }

  clearStoredReferralRef();
  return {
    ref: DEFAULT_DIRECT_SIGNUP_REFERRAL,
    locked: true,
    fromInviteLink: false,
  };
}

/** Referral value for submit — form field or resolved invite/default code. */
export function resolveReferralCodeForSubmit(formReferral, options = {}) {
  const fromForm = String(formReferral || "").trim();
  if (fromForm) return fromForm;
  if (options.ref) return String(options.ref).trim();
  return DEFAULT_DIRECT_SIGNUP_REFERRAL;
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
