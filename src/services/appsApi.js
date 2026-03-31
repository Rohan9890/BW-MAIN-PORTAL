import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";
import { mockData } from "./mockData";
import { safeServiceCall } from "./serviceUtils";

export const appsApi = {
  async getAllApps() {
    return safeServiceCall({
      request: () => apiClient.get(endpoints.apps.all),
      fallback: mockData.appCatalog.allApps,
    });
  },

  async getMyApps() {
    return safeServiceCall({
      request: () => apiClient.get(endpoints.apps.myApps),
      fallback: mockData.appCatalog.myApps,
    });
  },

  async getFavorites() {
    return safeServiceCall({
      request: () => apiClient.get(endpoints.apps.favorites),
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
