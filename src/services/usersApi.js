import { apiClient } from "./apiClient";
import { backendJson } from "./backendClient";
import { endpoints } from "./endpoints";
import { mockData } from "./mockData";
import { cloneDeep, safeServiceCall } from "./serviceUtils";

export const usersApi = {
  async getUsers(params) {
    return safeServiceCall({
      request: async () => {
        try {
          const response = await backendJson(endpoints.users.list, {
            method: "GET",
            query: params,
          });
          return response?.data ?? response ?? {};
        } catch {
          const response = await apiClient.get(endpoints.users.list, { query: params });
          return response?.data ?? response ?? {};
        }
      },
      fallback: {
        items: cloneDeep(mockData.admin.users),
        total: mockData.admin.users.length,
      },
    });
  },

  async getUserById(userId) {
    return safeServiceCall({
      request: async () => {
        try {
          const response = await backendJson(endpoints.users.byId(userId), { method: "GET" });
          return response?.data ?? response ?? {};
        } catch {
          const response = await apiClient.get(endpoints.users.byId(userId));
          return response?.data ?? response ?? {};
        }
      },
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
