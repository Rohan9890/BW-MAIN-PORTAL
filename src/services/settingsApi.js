import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";
import { mockData } from "./mockData";
import { safeServiceCall } from "./serviceUtils";

export const settingsApi = {
  async getSettings() {
    return safeServiceCall({
      request: () => apiClient.get(endpoints.settings.me),
      fallback: mockData.settings,
    });
  },

  async updateSettings(payload) {
    return safeServiceCall({
      request: () => apiClient.put(endpoints.settings.me, payload),
      fallback: { success: true, settings: payload },
    });
  },
};
