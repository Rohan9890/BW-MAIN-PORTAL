import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";
import { mockData } from "./mockData";
import { safeServiceCall } from "./serviceUtils";

export const dashboardApi = {
  async getHomeData() {
    return safeServiceCall({
      request: () => apiClient.get(endpoints.dashboard.home),
      fallback: mockData.home,
    });
  },

  async getActivitySummary() {
    return safeServiceCall({
      request: () => apiClient.get(endpoints.dashboard.activity),
      fallback: mockData.activity,
    });
  },
};
