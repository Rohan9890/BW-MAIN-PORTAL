import { beforeEach, describe, expect, it, vi } from "vitest";

function createStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
  };
}

import {
  DEFAULT_DIRECT_SIGNUP_REFERRAL,
  REFERRAL_LOCKED_STORAGE_KEY,
  REFERRAL_REF_STORAGE_KEY,
  clearStoredReferralRef,
  isReferralRegistrationError,
  parseReferralFromSearch,
  resolveReferralCodeForSubmit,
  resolveReferralInviteState,
} from "./referralStorage";

describe("referralStorage locked referral system", () => {
  beforeEach(() => {
    const session = createStorage();
    const local = createStorage();
    vi.stubGlobal("sessionStorage", session);
    vi.stubGlobal("localStorage", local);
  });

  it("parseReferralFromSearch reads ref query param", () => {
    expect(parseReferralFromSearch("?ref=ABC123")).toBe("ABC123");
    expect(parseReferralFromSearch("")).toBe("");
  });

  it("direct signup uses default platform code and clears stale storage", () => {
    sessionStorage.setItem(REFERRAL_REF_STORAGE_KEY, "STALE");
    sessionStorage.setItem(REFERRAL_LOCKED_STORAGE_KEY, "1");
    const state = resolveReferralInviteState("");
    expect(state.ref).toBe(DEFAULT_DIRECT_SIGNUP_REFERRAL);
    expect(state.locked).toBe(true);
    expect(state.fromInviteLink).toBe(false);
    expect(sessionStorage.getItem(REFERRAL_REF_STORAGE_KEY)).toBeNull();
  });

  it("invite link overrides default and persists locked ref", () => {
    const state = resolveReferralInviteState("?ref=INVITE1");
    expect(state.ref).toBe("INVITE1");
    expect(state.locked).toBe(true);
    expect(state.fromInviteLink).toBe(true);
    expect(sessionStorage.getItem(REFERRAL_REF_STORAGE_KEY)).toBe("INVITE1");
    expect(sessionStorage.getItem(REFERRAL_LOCKED_STORAGE_KEY)).toBe("1");
  });

  it("resolveReferralCodeForSubmit falls back to default when field empty", () => {
    expect(resolveReferralCodeForSubmit("")).toBe(DEFAULT_DIRECT_SIGNUP_REFERRAL);
    expect(resolveReferralCodeForSubmit("CUSTOM")).toBe("CUSTOM");
  });

  it("clearStoredReferralRef removes locked flag", () => {
    resolveReferralInviteState("?ref=X");
    clearStoredReferralRef();
    expect(sessionStorage.getItem(REFERRAL_REF_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(REFERRAL_LOCKED_STORAGE_KEY)).toBeNull();
  });

  it("isReferralRegistrationError detects backend referral failures", () => {
    expect(isReferralRegistrationError("Invalid referral code")).toBe(true);
    expect(isReferralRegistrationError("Email already exists")).toBe(false);
  });
});
