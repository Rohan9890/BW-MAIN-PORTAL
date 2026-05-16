import { apiClient } from "./apiClient";
import { backendJson } from "./backendClient";
import { endpoints } from "./endpoints";
import { mockData } from "./mockData";
import { safeServiceCall } from "./serviceUtils";

export const appsApi = {
  async getAllApps() {
    return safeServiceCall({
      request: async () => {
        try {
          const response = await backendJson(endpoints.apps.all, { method: "GET" });
          return response?.data ?? response ?? {};
        } catch {
          const response = await apiClient.get(endpoints.apps.all);
          return response?.data ?? response ?? {};
        }
      },
      fallback: mockData.appCatalog.allApps,
    });
  },

  async getMyApps() {
    return safeServiceCall({
      request: async () => {
        try {
          const response = await backendJson(endpoints.apps.myApps, { method: "GET" });
          return response?.data ?? response ?? {};
        } catch {
          const response = await apiClient.get(endpoints.apps.myApps);
          return response?.data ?? response ?? {};
        }
      },
      fallback: mockData.appCatalog.myApps,
    });
  },

  async getFavorites() {
    return safeServiceCall({
      request: async () => {
        try {
          const response = await backendJson(endpoints.apps.favorites, { method: "GET" });
          return response?.data ?? response ?? {};
        } catch {
          const response = await apiClient.get(endpoints.apps.favorites);
          return response?.data ?? response ?? {};
        }
      },
      fallback: mockData.appCatalog.favorites,
    });
  },

  async toggleSubscription(appId, subscribed) {
    return safeServiceCall({
      request: () =>
        apiClient.patch(endpoints.apps.toggleSubscription(appId), {
          subscribed,
        }),
      fallback: { success: true, appId, subscribed },
    });
  },

  async toggleFavorite(appId, wishlisted) {
    return safeServiceCall({
      request: () =>
        apiClient.patch(endpoints.apps.toggleFavorite(appId), { wishlisted }),
      fallback: { success: true, appId, wishlisted },
    });
  },
};
