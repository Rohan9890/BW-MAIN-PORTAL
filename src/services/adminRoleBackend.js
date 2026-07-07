import { backendJson } from "./backendClient";

/**
 * Admin role change API — backend implements these routes.
 * OTP purpose on server: ROLE_CHANGE_ACTION
 */
export const adminRoleBackend = {
  /** POST /admin/role/request-otp — sends OTP to the logged-in actor's email. */
  requestOtp() {
    return backendJson("/admin/role/request-otp", {
      method: "POST",
      json: {},
      suppressGlobalServerErrorToast: true,
    });
  },

  /**
   * POST /admin/role/verify-otp
   * @param {{ otp: string }} body
   * @returns roleChangeActionToken (short-lived, single-use)
   */
  verifyOtp({ otp }) {
    return backendJson("/admin/role/verify-otp", {
      method: "POST",
      json: { otp: String(otp || "").trim() },
      suppressGlobalServerErrorToast: true,
    });
  },

  /**
   * PATCH /admin/users/:id/role
   * @param {string} userId public external id (USR-* / ORG-* / ADM-*)
   * @param {{ role: "USER"|"ADMIN"|"OWNER", roleChangeActionToken?: string }} body
   */
  updateUserRole(userId, { role, roleChangeActionToken }) {
    const enc = encodeURIComponent(String(userId || "").trim());
    const json = {
      role: String(role || "").trim().toUpperCase(),
    };
    const token = String(roleChangeActionToken || "").trim();
    if (token) json.roleChangeActionToken = token;
    return backendJson(`/admin/users/${enc}/role`, {
      method: "PATCH",
      json,
      suppressGlobalServerErrorToast: true,
    });
  },
};
