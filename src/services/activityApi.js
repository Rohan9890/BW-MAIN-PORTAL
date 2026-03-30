import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";
import { mockData } from "./mockData";
import { safeServiceCall } from "./serviceUtils";

export const activityApi = {
  async getActivity(params) {
    return safeServiceCall({
      request: () =>
        apiClient.get(endpoints.dashboard.activity, { query: params }),
      fallback: mockData.activity,
    });
  },
};
