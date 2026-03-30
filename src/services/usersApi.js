import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";
import { mockData } from "./mockData";
import { cloneDeep, safeServiceCall } from "./serviceUtils";

export const usersApi = {
  async getUsers(params) {
    return safeServiceCall({
      request: () => apiClient.get(endpoints.users.list, { query: params }),
      fallback: {
        items: cloneDeep(mockData.admin.users),
        total: mockData.admin.users.length,
      },
    });
  },

  async getUserById(userId) {
    return safeServiceCall({
      request: () => apiClient.get(endpoints.users.byId(userId)),
      fallback:
        cloneDeep(mockData.admin.users.find((item) => item.id === userId)) ||
        null,
    });
  },

  async updateUser(userId, payload) {
    return safeServiceCall({
      request: () => apiClient.put(endpoints.users.byId(userId), payload),
      fallback: {
        success: true,
        user: {
          id: userId,
          ...payload,
        },
      },
    });
  },

  async createUser(payload) {
    return safeServiceCall({
      request: () => apiClient.post(endpoints.users.list, payload),
      fallback: {
        success: true,
        user: {
          id: payload.id || `USR-${Date.now()}`,
          ...payload,
        },
      },
    });
  },

  async deleteUser(userId) {
    return safeServiceCall({
      request: () => apiClient.delete(endpoints.users.byId(userId)),
      fallback: { success: true, id: userId },
    });
  },
};
