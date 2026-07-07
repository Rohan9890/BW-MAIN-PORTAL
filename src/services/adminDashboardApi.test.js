import { beforeEach, describe, it, expect, vi } from "vitest";

vi.mock("./backendClient", () => ({
  backendJson: vi.fn(),
  backendMultipart: vi.fn(),
}));

import { backendJson } from "./backendClient";
import { adminDashboardApi, toAdminUserStatusMeta, toAdminUserStatusValue } from "./adminDashboardApi";

describe("toAdminUserStatusValue", () => {
  it("maps activate toggle to ACTIVE", () => {
    expect(toAdminUserStatusValue(true)).toBe("ACTIVE");
  });

  it("maps deactivate toggle to SUSPENDED", () => {
    expect(toAdminUserStatusValue(false)).toBe("SUSPENDED");
  });
});

describe("toAdminUserStatusMeta", () => {
  it("returns suspended pill metadata when deactivating", () => {
    expect(toAdminUserStatusMeta(false)).toEqual({
      key: "SUSPENDED",
      label: "Suspended",
      pillClass: "suspended",
    });
  });
});

describe("adminDashboardApi.updateUser", () => {
  beforeEach(() => {
    backendJson.mockReset();
    backendJson.mockResolvedValue({ ok: true });
  });

  it("PATCHes phoneNumber without email by default", async () => {
    await adminDashboardApi.updateUser("USR-42", {
      email: "new@test.com",
      phoneNumber: "9876543210",
    });

    expect(backendJson).toHaveBeenCalledWith("/admin/users/USR-42", {
      method: "PATCH",
      json: { phoneNumber: "9876543210" },
      suppressGlobalServerErrorToast: true,
    });
  });

  it("PATCHes email when allowEmail rollout flag is set", async () => {
    await adminDashboardApi.updateUser(
      "USR-42",
      { email: "new@test.com", phoneNumber: "9876543210" },
      { allowEmail: true },
    );

    expect(backendJson).toHaveBeenCalledWith("/admin/users/USR-42", {
      method: "PATCH",
      json: { email: "new@test.com", phoneNumber: "9876543210" },
      suppressGlobalServerErrorToast: true,
    });
  });
});

describe("adminDashboardApi email change OTP", () => {
  beforeEach(() => {
    backendJson.mockReset();
    backendJson.mockResolvedValue({ success: true });
  });

  it("POSTs request-email-change", async () => {
    await adminDashboardApi.requestEmailChange("USR-42", "new@test.com");
    expect(backendJson).toHaveBeenCalledWith("/admin/users/request-email-change", {
      method: "POST",
      json: { userId: "USR-42", newEmail: "new@test.com" },
      suppressGlobalServerErrorToast: true,
    });
  });

  it("POSTs verify-email-change-otp", async () => {
    await adminDashboardApi.verifyEmailChangeOtp("USR-42", "123456");
    expect(backendJson).toHaveBeenCalledWith(
      "/admin/users/verify-email-change-otp",
      {
        method: "POST",
        json: { userId: "USR-42", otp: "123456" },
        suppressGlobalServerErrorToast: true,
      },
    );
  });

  it("POSTs resend-email-change-otp", async () => {
    await adminDashboardApi.resendEmailChangeOtp("ORG-99");
    expect(backendJson).toHaveBeenCalledWith(
      "/admin/users/resend-email-change-otp",
      {
        method: "POST",
        json: { userId: "ORG-99" },
        suppressGlobalServerErrorToast: true,
      },
    );
  });
});

describe("adminDashboardApi.listAdmins", () => {
  beforeEach(() => {
    backendJson.mockReset();
  });

  it("GETs /admin/users/admins when available", async () => {
    backendJson.mockResolvedValue([{ id: 1, role: "ADMIN" }]);
    const list = await adminDashboardApi.listAdmins();
    expect(backendJson).toHaveBeenCalledWith("/admin/users/admins", {
      method: "GET",
      suppressGlobalServerErrorToast: true,
    });
    expect(list).toHaveLength(1);
  });

  it("falls back to filtered /admin/users on 404", async () => {
    backendJson
      .mockRejectedValueOnce(Object.assign(new Error("Not found"), { status: 404 }))
      .mockResolvedValueOnce([
        { id: 1, role: "ROLE_USER" },
        { id: 2, role: "ROLE_ADMIN" },
      ]);
    const list = await adminDashboardApi.listAdmins();
    expect(list).toHaveLength(1);
    expect(list[0].role).toBe("ROLE_ADMIN");
  });
});

describe("adminDashboardApi.listOwners", () => {
  beforeEach(() => {
    backendJson.mockReset();
  });

  it("GETs /admin/users/owners when available", async () => {
    backendJson.mockResolvedValue([{ id: 1, role: "OWNER" }]);
    const list = await adminDashboardApi.listOwners();
    expect(backendJson).toHaveBeenCalledWith("/admin/users/owners", {
      method: "GET",
      suppressGlobalServerErrorToast: true,
    });
    expect(list).toHaveLength(1);
  });
});

describe("adminDashboardApi.updateUserStatus", () => {
  beforeEach(() => {
    backendJson.mockReset();
    backendJson.mockResolvedValue({ ok: true });
  });

  it("PATCHes status ACTIVE when activating", async () => {
    await adminDashboardApi.updateUserStatus("user-42", true);

    expect(backendJson).toHaveBeenCalledWith("/admin/users/user-42/status", {
      method: "PATCH",
      json: { status: "ACTIVE" },
      suppressGlobalServerErrorToast: true,
    });
  });

  it("PATCHes status SUSPENDED when deactivating", async () => {
    await adminDashboardApi.updateUserStatus("user-42", false);

    expect(backendJson).toHaveBeenCalledWith("/admin/users/user-42/status", {
      method: "PATCH",
      json: { status: "SUSPENDED" },
      suppressGlobalServerErrorToast: true,
    });
  });
});
