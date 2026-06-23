import { describe, expect, it } from "vitest";
import { buildCsvContent, escapeCsvCell } from "./csvExport";
import {
  DIRECT_SIGNUP_LABEL,
  isDirectSignup,
  normalizeReferredByDisplay,
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
  });

  it("isDirectSignup detects canonical label only", () => {
    expect(isDirectSignup(DIRECT_SIGNUP_LABEL)).toBe(true);
    expect(isDirectSignup("USR-1")).toBe(false);
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
