import { describe, expect, it } from "vitest";
import {
  extractAdminUserExternalId,
  isExternalUserId,
  isOrganizationExternalId,
} from "./userExternalId";

describe("userExternalId", () => {
  it("recognizes USR, ADM, and ORG prefixes", () => {
    expect(isExternalUserId("USR-12345678")).toBe(true);
    expect(isExternalUserId("ADM-12345678")).toBe(true);
    expect(isExternalUserId("ORG-12345678")).toBe(true);
    expect(isExternalUserId("numeric-42")).toBe(false);
  });

  it("detects organization external ids", () => {
    expect(isOrganizationExternalId("ORG-84739037")).toBe(true);
    expect(isOrganizationExternalId("USR-84739037")).toBe(false);
  });

  it("extracts ORG id from nested admin user rows", () => {
    expect(
      extractAdminUserExternalId({
        id: 42,
        userId: "ORG-84739037",
        email: "org@test.com",
      }),
    ).toBe("ORG-84739037");
  });
});
