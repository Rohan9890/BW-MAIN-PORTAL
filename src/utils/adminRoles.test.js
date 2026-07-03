import { describe, expect, it } from "vitest";
import {
  canActorDeactivateUser,
  canActorManageUserRole,
  computeAdminUserRoleCounts,
  extractEmailFromRawUser,
  extractNameFromRawUser,
  extractPhoneFromRawUser,
  extractRawRoleLabel,
  extractRoleFromRawUser,
  extractRowPanelRole,
  getAllowedTargetRoles,
  getDeactivateDisabledReason,
  getRoleChangeConfirmation,
  isLastOwnerTarget,
  isOrganizationAccount,
  isRoleChangeAllowed,
  isSameUserRow,
  normalizePanelRole,
  resolveAdminUserDisplayName,
  resolveAdminUserTypeLabel,
} from "./adminRoles";

describe("adminRoles extractors", () => {
  it("normalizePanelRole supports all backend role shapes", () => {
    expect(normalizePanelRole("ROLE_USER")).toBe("ROLE_USER");
    expect(normalizePanelRole("USER")).toBe("ROLE_USER");
    expect(normalizePanelRole("ROLE_ORG")).toBe("ROLE_ORG");
    expect(normalizePanelRole("ORG")).toBe("ROLE_ORG");
    expect(normalizePanelRole("ROLE_ADMIN")).toBe("ROLE_ADMIN");
    expect(normalizePanelRole("ADMIN")).toBe("ROLE_ADMIN");
    expect(normalizePanelRole("ROLE_OWNER")).toBe("ROLE_OWNER");
    expect(normalizePanelRole("OWNER")).toBe("ROLE_OWNER");
  });

  it("extractRoleFromRawUser reads nested profile and authorities", () => {
    expect(
      extractRoleFromRawUser({
        profile: { role: "OWNER" },
        email: "owner@test.com",
      }),
    ).toBe("ROLE_OWNER");
    expect(
      extractRoleFromRawUser({
        authorities: [{ authority: "ROLE_ADMIN" }],
      }),
    ).toBe("ROLE_ADMIN");
    expect(
      extractRoleFromRawUser({
        user: { userRole: "ORG" },
      }),
    ).toBe("ROLE_ORG");
  });

  it("extractNameFromRawUser prefers firstName + lastName", () => {
    expect(
      extractNameFromRawUser({ firstName: "Jane", lastName: "Doe" }),
    ).toBe("Jane Doe");
    expect(
      extractNameFromRawUser({ profile: { displayName: "Acme Org" } }),
    ).toBe("Acme Org");
  });

  it("extractEmailFromRawUser reads nested emailAddress", () => {
    expect(
      extractEmailFromRawUser({ user: { emailAddress: "a@test.com" } }),
    ).toBe("a@test.com");
  });

  it("extractPhoneFromRawUser reads nested phoneNumber", () => {
    expect(
      extractPhoneFromRawUser({ profile: { phoneNumber: "9876543210" } }),
    ).toBe("9876543210");
  });

  it("resolveAdminUserDisplayName falls back to Unknown User", () => {
    expect(resolveAdminUserDisplayName({})).toBe("Unknown User");
  });

  it("computeAdminUserRoleCounts uses normalized panelRole", () => {
    const rows = [
      { panelRole: "ROLE_ADMIN" },
      { panelRole: "ROLE_OWNER" },
      { panelRole: "ROLE_USER" },
    ];
    expect(computeAdminUserRoleCounts(rows)).toEqual({
      all: 3,
      admin: 1,
      owner: 1,
    });
  });

  it("extractRawRoleLabel preserves raw backend value for audit", () => {
    expect(extractRawRoleLabel({ role: "ROLE_ADMIN" })).toBe("ROLE_ADMIN");
  });
});

describe("adminRoles role management", () => {
  const ownerRow = { id: "1", email: "owner@test.com", role: "OWNER" };
  const adminRow = { id: "2", email: "admin@test.com", role: "ADMIN" };
  const userRow = { id: "3", email: "user@test.com", role: "USER" };
  const allRows = [ownerRow, adminRow, userRow];

  it("extractRowPanelRole normalizes API shapes", () => {
    expect(extractRowPanelRole({ role: "ROLE_ADMIN" })).toBe("ADMIN");
    expect(extractRowPanelRole({ userRole: "owner" })).toBe("OWNER");
    expect(extractRowPanelRole({})).toBe("USER");
  });

  it("isSameUserRow matches email or id", () => {
    expect(
      isSameUserRow({ email: "admin@test.com" }, adminRow),
    ).toBe(true);
    expect(isSameUserRow({ userId: "3" }, userRow)).toBe(true);
    expect(isSameUserRow({ email: "other@test.com" }, userRow)).toBe(false);
  });

  it("ADMIN allowed targets exclude OWNER option", () => {
    expect(
      getAllowedTargetRoles("ROLE_ADMIN", "USER", { isSelf: false }),
    ).toEqual(["USER", "ADMIN"]);
    expect(
      getAllowedTargetRoles("ROLE_ADMIN", "ADMIN", { isSelf: false }),
    ).toEqual(["ADMIN", "USER"]);
    expect(
      getAllowedTargetRoles("ROLE_ADMIN", "OWNER", { isSelf: false }),
    ).toEqual(["OWNER"]);
  });

  it("OWNER can assign all roles except last owner demotion", () => {
    expect(
      getAllowedTargetRoles("ROLE_OWNER", "USER", { isSelf: false }),
    ).toEqual(["USER", "ADMIN", "OWNER"]);
    expect(
      getAllowedTargetRoles("ROLE_OWNER", "OWNER", {
        isSelf: false,
        isLastOwnerTarget: true,
      }),
    ).toEqual(["OWNER"]);
  });

  it("isRoleChangeAllowed enforces transition matrix", () => {
    expect(
      isRoleChangeAllowed("ROLE_ADMIN", "USER", "ADMIN", { isSelf: false }),
    ).toBe(true);
    expect(
      isRoleChangeAllowed("ROLE_ADMIN", "USER", "OWNER", { isSelf: false }),
    ).toBe(false);
    expect(
      isRoleChangeAllowed("ROLE_ADMIN", "OWNER", "USER", { isSelf: false }),
    ).toBe(false);
    expect(
      isRoleChangeAllowed("ROLE_OWNER", "ADMIN", "USER", { isSelf: false }),
    ).toBe(true);
    expect(
      isRoleChangeAllowed("ROLE_OWNER", "OWNER", "ADMIN", {
        isSelf: false,
        isLastOwnerTarget: true,
      }),
    ).toBe(false);
  });

  it("isLastOwnerTarget when single owner in list", () => {
    expect(isLastOwnerTarget(ownerRow, [ownerRow, userRow])).toBe(true);
    expect(
      isLastOwnerTarget(ownerRow, [ownerRow, { role: "OWNER" }, userRow]),
    ).toBe(false);
  });

  it("canActorManageUserRole blocks self and owner rows for admin", () => {
    const actor = { email: "admin@test.com", userId: "2" };
    const otherAdminActor = { email: "admin2@test.com", userId: "22" };
    expect(
      canActorManageUserRole("ROLE_ADMIN", userRow, allRows, actor),
    ).toBe(true);
    expect(
      canActorManageUserRole("ROLE_ADMIN", adminRow, allRows, otherAdminActor),
    ).toBe(true);
    expect(
      canActorManageUserRole("ROLE_ADMIN", ownerRow, allRows, actor),
    ).toBe(false);
    expect(
      canActorManageUserRole("ROLE_ADMIN", actor, allRows, actor),
    ).toBe(false);
    expect(
      canActorManageUserRole("ROLE_OWNER", ownerRow, [ownerRow], actor),
    ).toBe(false);
  });

  it("getRoleChangeConfirmation messages", () => {
    expect(getRoleChangeConfirmation("USER", "ADMIN", "Jane")).toContain(
      "dashboard management",
    );
    expect(getRoleChangeConfirmation("ADMIN", "USER", "Jane")).toContain(
      "removes admin",
    );
    expect(getRoleChangeConfirmation("USER", "OWNER", "Jane")).toContain(
      "full platform ownership",
    );
  });

  it("canActorDeactivateUser blocks self, owner-for-admin, and last owner", () => {
    const actor = { email: "admin@test.com", userId: "2" };
    const otherAdminActor = { email: "admin2@test.com", userId: "22" };
    expect(
      canActorDeactivateUser("ROLE_ADMIN", userRow, allRows, actor),
    ).toBe(true);
    expect(
      canActorDeactivateUser("ROLE_ADMIN", ownerRow, allRows, actor),
    ).toBe(false);
    expect(
      canActorDeactivateUser("ROLE_ADMIN", actor, allRows, actor),
    ).toBe(false);
    expect(
      canActorDeactivateUser("ROLE_OWNER", ownerRow, [ownerRow], actor),
    ).toBe(false);
    expect(
      canActorDeactivateUser("ROLE_OWNER", adminRow, allRows, otherAdminActor),
    ).toBe(true);
  });

  it("getDeactivateDisabledReason explains blocked deactivation", () => {
    const actor = { email: "admin@test.com", userId: "2" };
    expect(getDeactivateDisabledReason("ROLE_ADMIN", actor, allRows, actor)).toBe(
      "You cannot deactivate your own account",
    );
    expect(
      getDeactivateDisabledReason("ROLE_ADMIN", ownerRow, allRows, actor),
    ).toBe("Only owners can deactivate owner accounts");
    expect(
      getDeactivateDisabledReason("ROLE_OWNER", ownerRow, [ownerRow], actor),
    ).toBe("The last owner cannot be deactivated");
  });

  it("resolveAdminUserTypeLabel distinguishes USER and ORG accounts", () => {
    expect(
      resolveAdminUserTypeLabel({ role: "USER", userId: "USR-12345678" }),
    ).toBe("USER");
    expect(
      resolveAdminUserTypeLabel({ role: "USER", userId: "ORG-12345678" }),
    ).toBe("ORG");
    expect(resolveAdminUserTypeLabel({ role: "ADMIN" })).toBe("ADMIN");
    expect(
      resolveAdminUserTypeLabel({ role: "USER", orgName: "Acme Corp", userId: "USR-99" }),
    ).toBe("ORG");
  });

  it("isOrganizationAccount supports legacy USR- rows with org metadata", () => {
    expect(isOrganizationAccount({ userId: "ORG-1" })).toBe(true);
    expect(isOrganizationAccount({ userId: "USR-1", orgName: "Legacy Org" })).toBe(true);
    expect(isOrganizationAccount({ userId: "USR-1", entityType: "Organization" })).toBe(true);
    expect(isOrganizationAccount({ userId: "USR-1" })).toBe(false);
  });
});
