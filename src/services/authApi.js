import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";
import { safeServiceCall } from "./serviceUtils";
import { upsertRegisteredUser } from "./registrationStore";

export const authApi = {
  async login(payload) {
    return safeServiceCall({
      request: () => apiClient.post(endpoints.auth.login, payload),
      fallback: {
        token: "mock-token",
        user: { id: "u-1", name: "Demo User", role: "User" },
      },
    });
  },

  async registerIndividual(payload) {
    return safeServiceCall({
      request: () => apiClient.post(endpoints.auth.registerIndividual, payload),
      fallback: (() => {
        // TODO: connect to backend API
        const normalizedEmail = String(payload?.email || "")
          .trim()
          .toLowerCase();
        const nextUser = {
          id: `USR-${Date.now().toString().slice(-6)}`,
          name: payload?.fullName || "New User",
          email: normalizedEmail,
          role: "User",
          joinedOn: "Today",
          status: "Active",
          isActive: true,
          phone: payload?.phone || "",
        };
        upsertRegisteredUser(nextUser);
        return {
          success: true,
          message: "Individual registration submitted",
          user: nextUser,
        };
      })(),
    });
  },

  async registerOrganization(payload) {
    return safeServiceCall({
      request: () =>
        apiClient.post(endpoints.auth.registerOrganization, payload),
      fallback: {
        ...(function () {
          // TODO: connect to backend API
          const normalizedEmail = String(payload?.email || "")
            .trim()
            .toLowerCase();
          const nextUser = {
            id: `USR-${Date.now().toString().slice(-6)}`,
            name: payload?.orgName || "New Organization",
            email: normalizedEmail,
            role: "User",
            joinedOn: "Today",
            status: "Active",
            isActive: true,
            phone: payload?.phone || "",
          };
          upsertRegisteredUser(nextUser);
          return { user: nextUser };
        })(),
        success: true,
        message: "Organization registration submitted",
      },
    });
  },
};
