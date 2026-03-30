import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";
import { safeServiceCall } from "./serviceUtils";

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
      fallback: { success: true, message: "Individual registration submitted" },
    });
  },

  async registerOrganization(payload) {
    return safeServiceCall({
      request: () =>
        apiClient.post(endpoints.auth.registerOrganization, payload),
      fallback: {
        success: true,
        message: "Organization registration submitted",
      },
    });
  },
};
