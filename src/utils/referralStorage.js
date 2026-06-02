/** Persist referral code from ?ref= across refresh and login → register navigation. */
export const REFERRAL_REF_STORAGE_KEY = "bw-referral-ref";

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

export function persistReferralRef(ref) {
  const value = String(ref ?? "").trim();
  if (!value) return;
  try {
    sessionStorage.setItem(REFERRAL_REF_STORAGE_KEY, value);
    localStorage.setItem(REFERRAL_REF_STORAGE_KEY, value);
  } catch {
    /* storage unavailable */
  }
}

export function clearStoredReferralRef() {
  try {
    sessionStorage.removeItem(REFERRAL_REF_STORAGE_KEY);
    localStorage.removeItem(REFERRAL_REF_STORAGE_KEY);
  } catch {
    /* ignore */
  }
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
