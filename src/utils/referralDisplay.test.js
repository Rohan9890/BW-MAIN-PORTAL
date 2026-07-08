import { describe, expect, it } from "vitest";
import { buildCsvContent, escapeCsvCell } from "./csvExport";
import {
  DIRECT_SIGNUP_LABEL,
  extractReferredByFromUser,
  isDirectSignup,
  isLegacyReferralCode,
  normalizeReferralCodeDisplay,
  normalizeReferredByDisplay,
  sanitizeReferredByForDisplay,
} from "./referralDisplay";

describe("referralDisplay", () => {
  it("uses canonical Direct Signup label for empty values", () => {
    expect(normalizeReferredByDisplay(null)).toBe(DIRECT_SIGNUP_LABEL);
    expect(normalizeReferredByDisplay("")).toBe(DIRECT_SIGNUP_LABEL);
    expect(normalizeReferredByDisplay("—")).toBe(DIRECT_SIGNUP_LABEL);
    expect(normalizeReferredByDisplay("direct signup")).toBe(DIRECT_SIGNUP_LABEL);
  });

  it("preserves referrer user ids", () => {
    expect(normalizeReferredByDisplay("USR-84739037")).toBe("USR-84739037");
    expect(normalizeReferredByDisplay("ORG-84739037")).toBe("ORG-84739037");
  });

  it("isDirectSignup detects canonical label only", () => {
    expect(isDirectSignup(DIRECT_SIGNUP_LABEL)).toBe(true);
    expect(isDirectSignup("USR-1")).toBe(false);
  });

  it("preserves legacy REF codes during migration", () => {
    expect(isLegacyReferralCode("REF-ABC12345")).toBe(true);
    expect(normalizeReferralCodeDisplay("REF-ABC12345")).toBe("REF-ABC12345");
    expect(extractReferredByFromUser({ referredBy: "REF-OLD123" })).toBe(
      "REF-OLD123",
    );
  });

  it("hides numeric and ADM referred-by values in admin display", () => {
    expect(sanitizeReferredByForDisplay("42")).toBe(DIRECT_SIGNUP_LABEL);
    expect(sanitizeReferredByForDisplay("ADM-12345678")).toBe(
      DIRECT_SIGNUP_LABEL,
    );
    expect(extractReferredByFromUser({ referredByUserId: "ADM-999" })).toBe(
      DIRECT_SIGNUP_LABEL,
    );
    expect(extractReferredByFromUser({ referredBy: "USR-123" })).toBe("USR-123");
    expect(extractReferredByFromUser({ referredBy: "BWVPL#26" })).toBe(
      "BWVPL#26",
    );
  });

  it("extractReferredByFromUser reads string, object, and legacy fields", () => {
    expect(extractReferredByFromUser({ referredBy: "USR-123" })).toBe("USR-123");
    expect(
      extractReferredByFromUser({ referredBy: { userId: "ORG-456" } }),
    ).toBe("ORG-456");
    expect(
      extractReferredByFromUser({ referredByUserId: "ADM-789" }),
    ).toBe(DIRECT_SIGNUP_LABEL);
    expect(extractReferredByFromUser({})).toBe(DIRECT_SIGNUP_LABEL);
  });
});

describe("csvExport", () => {
  it("escapes quotes in cells", () => {
    expect(escapeCsvCell('Say "hi"')).toBe('"Say ""hi"""');
  });

  it("neutralizes formula injection prefixes", () => {
    expect(escapeCsvCell("=1+1")).toBe('"\t=1+1"');
    expect(escapeCsvCell("+cmd")).toBe('"\t+cmd"');
  });

  it("buildCsvContent includes UTF-8 BOM", () => {
    const csv = buildCsvContent(["A"], [["B"]]);
    expect(csv.startsWith("\ufeff")).toBe(true);
    expect(csv).toContain('"A"');
    expect(csv).toContain('"B"');
  });
});
