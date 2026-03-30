import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";
import { mockData } from "./mockData";
import { safeServiceCall } from "./serviceUtils";

export const plansApi = {
  async getPlans() {
    return safeServiceCall({
      request: () => apiClient.get(endpoints.plans.all),
      fallback: mockData.plans,
    });
  },
};
