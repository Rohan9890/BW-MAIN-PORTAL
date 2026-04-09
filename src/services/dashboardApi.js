import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";
import { mockData } from "./mockData";
import { safeServiceCall } from "./serviceUtils";
import { apiCall } from "./fetchApi";

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

  /**
   * GET /dashboard/summary/{userId} - Get dashboard summary from backend
   * Requires: userId, Authorization token
   */
  async getSummary(userId) {
    if (!userId) throw new Error("userId is required");
    try {
      return await apiCall(`/dashboard/summary/${userId}`, "GET");
    } catch (error) {
      console.error("Failed to fetch dashboard summary:", error);
      throw error;
    }
  },

  /**
   * GET /dashboard/transactions/{userId} - Get transactions from backend
   * Requires: userId, Authorization token
   */
  async getTransactions(userId) {
    if (!userId) throw new Error("userId is required");
    try {
      return await apiCall(`/dashboard/transactions/${userId}`, "GET");
    } catch (error) {
      console.error("Failed to fetch dashboard transactions:", error);
      throw error;
    }
  },
};
