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
