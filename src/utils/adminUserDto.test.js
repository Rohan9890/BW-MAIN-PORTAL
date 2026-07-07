import { describe, expect, it } from "vitest";
import {
  extractPendingEmail,
  normalizeUserStatusMeta,
  parseAdminUserUpdateResponse,
  parseEmailChangeRequestResponse,
  pickAdminUserPatchId,
  resolveAccountTypeLabel,
  resolveStaffRoleLabel,
  resolveUserAudienceCounts,
  sortUsersByCreatedAtDesc,
} from "./adminUserDto";

describe("adminUserDto", () => {
  it("pickAdminUserPatchId prefers external id over numeric id", () => {
    expect(
      pickAdminUserPatchId({ id: 42, userId: "USR-ABC123" }),
    ).toBe("USR-ABC123");
    expect(pickAdminUserPatchId({ id: "ORG-999" })).toBe("ORG-999");
  });

  it("normalizeUserStatusMeta prefers userStatus over legacy status", () => {
    expect(normalizeUserStatusMeta({ userStatus: "ACTIVE" }).key).toBe("ACTIVE");
    expect(normalizeUserStatusMeta({ status: "SUSPENDED" }).key).toBe(
      "SUSPENDED",
    );
  });

  it("extractPendingEmail reads nested pending fields", () => {
    expect(extractPendingEmail({ pendingEmail: "new@test.com" })).toBe(
      "new@test.com",
    );
    expect(extractPendingEmail({ _raw: { pending_email: "x@y.com" } })).toBe(
      "x@y.com",
    );
  });

  it("parseEmailChangeRequestResponse handles OTP request success", () => {
    const parsed = parseEmailChangeRequestResponse(
      { success: true, message: "OTP sent successfully." },
      { newEmail: "new@gmail.com" },
    );
    expect(parsed.verificationSent).toBe(true);
    expect(parsed.pendingEmail).toBe("new@gmail.com");
  });

  it("parseAdminUserUpdateResponse handles verification pending", () => {
    const parsed = parseAdminUserUpdateResponse(
      {
        verificationSent: true,
        pendingEmail: "new@gmail.com",
        message: "Verification mail sent",
      },
      { emailChanged: true },
    );
    expect(parsed.kind).toBe("email_verification_pending");
    expect(parsed.pendingEmail).toBe("new@gmail.com");
  });

  it("parseAdminUserUpdateResponse handles legacy direct email update", () => {
    const parsed = parseAdminUserUpdateResponse(
      { email: "updated@test.com" },
      { emailChanged: true },
    );
    expect(parsed.kind).toBe("email_updated_direct");
    expect(parsed.email).toBe("updated@test.com");
  });

  it("resolveAccountTypeLabel returns USER or ORG only", () => {
    expect(
      resolveAccountTypeLabel({ panelRole: "ROLE_ADMIN", entityType: "INDIVIDUAL" }),
    ).toBe("USER");
    expect(
      resolveAccountTypeLabel({ entityType: "ORGANIZATION" }),
    ).toBe("ORG");
    expect(resolveStaffRoleLabel({ panelRole: "ROLE_ADMIN" })).toBe("ADMIN");
  });

  it("sortUsersByCreatedAtDesc orders newest first", () => {
    const sorted = sortUsersByCreatedAtDesc([
      { id: "a", createdAt: "2024-01-01" },
      { id: "b", createdAt: "2025-06-01" },
      { id: "c", createdAt: "2024-12-01" },
    ]);
    expect(sorted.map((r) => r.id)).toEqual(["b", "c", "a"]);
  });

  it("resolveUserAudienceCounts prefers summary fields", () => {
    expect(
      resolveUserAudienceCounts(
        { totalUserAccounts: 100, adminCount: 5, ownerCount: 2 },
        { users: 0, admins: 0, owners: 0 },
      ),
    ).toEqual({ users: 100, admins: 5, owners: 2 });
  });
});
