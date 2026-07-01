import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  REFERRAL_LOCKED_STORAGE_KEY,
  REFERRAL_REF_STORAGE_KEY,
  clearStoredReferralRef,
  isReferralRegistrationError,
  parseReferralFromSearch,
  readReferralLocked,
  resolveReferralCodeForSubmit,
  resolveReferralInviteState,
} from "./referralStorage";

function createStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
  };
}

describe("referralStorage invite locking", () => {
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

  it("resolveReferralInviteState locks when ref is in URL", () => {
    const state = resolveReferralInviteState("?ref=INVITE1");
    expect(state.ref).toBe("INVITE1");
    expect(state.locked).toBe(true);
    expect(readReferralLocked()).toBe(true);
    expect(sessionStorage.getItem(REFERRAL_REF_STORAGE_KEY)).toBe("INVITE1");
    expect(sessionStorage.getItem(REFERRAL_LOCKED_STORAGE_KEY)).toBe("1");
  });

  it("resolveReferralInviteState stays unlocked without invite URL", () => {
    const state = resolveReferralInviteState("");
    expect(state.ref).toBe("");
    expect(state.locked).toBe(false);
  });

  it("clearStoredReferralRef removes locked flag", () => {
    resolveReferralInviteState("?ref=X");
    clearStoredReferralRef();
    expect(readReferralLocked()).toBe(false);
    expect(sessionStorage.getItem(REFERRAL_REF_STORAGE_KEY)).toBeNull();
  });

  it("resolveReferralInviteState does not auto-fill unlocked stale storage", () => {
    sessionStorage.setItem(REFERRAL_REF_STORAGE_KEY, "STALE");
    const state = resolveReferralInviteState("");
    expect(state.ref).toBe("");
    expect(state.locked).toBe(false);
  });

  it("resolveReferralCodeForSubmit omits referral on normal signup", () => {
    sessionStorage.setItem(REFERRAL_REF_STORAGE_KEY, "STALE");
    expect(resolveReferralCodeForSubmit("", { locked: false })).toBe("");
    expect(resolveReferralCodeForSubmit("  ", { locked: false })).toBe("");
  });

  it("resolveReferralCodeForSubmit uses stored ref only when locked", () => {
    resolveReferralInviteState("?ref=INVITE1");
    expect(resolveReferralCodeForSubmit("", { locked: true })).toBe("INVITE1");
    expect(resolveReferralCodeForSubmit("CUSTOM", { locked: true })).toBe(
      "CUSTOM",
    );
  });

  it("isReferralRegistrationError detects backend referral failures", () => {
    expect(isReferralRegistrationError("Invalid referral code")).toBe(true);
    expect(isReferralRegistrationError("Email already exists")).toBe(false);
  });
});
