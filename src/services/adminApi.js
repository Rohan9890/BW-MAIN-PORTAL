import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";
import { mockData } from "./mockData";
import { cloneDeep, safeServiceCall } from "./serviceUtils";
import { getRegisteredUsers } from "./registrationStore";

export const adminApi = {
  async getDashboardData() {
    return safeServiceCall({
      request: () => apiClient.get(endpoints.admin.dashboard),
      fallback: {
        stats: mockData.admin.stats,
        apps: mockData.admin.apps,
        payments: mockData.admin.payments,
        tickets: mockData.admin.tickets,
        activityFeed: mockData.admin.activityFeed,
        userGrowth: mockData.admin.userGrowth,
      },
    });
  },

  async getUsers(params) {
    return safeServiceCall({
      request: () => apiClient.get(endpoints.admin.users, { query: params }),
      fallback: (() => {
        const stored = getRegisteredUsers();
        const base = cloneDeep(mockData.admin.users) || [];
        const mergedByEmail = new Map(
          base
            .filter((u) => u?.email)
            .map((u) => [String(u.email).toLowerCase(), u]),
        );
        stored
          .filter((u) => u?.email)
          .forEach((u) => {
            const key = String(u.email).toLowerCase();
            mergedByEmail.set(key, u);
          });
        const items = Array.from(mergedByEmail.values());
        return { items, total: items.length };
      })(),
    });
  },

  async updateUserStatus(userId, status) {
    return safeServiceCall({
      request: () =>
        apiClient.patch(endpoints.admin.userStatus(userId), { status }),
      fallback: { success: true, userId, status },
    });
  },

  async exportUsers(params) {
    return safeServiceCall({
      request: () =>
        apiClient.get(`${endpoints.admin.users}/export`, { query: params }),
      fallback: cloneDeep(mockData.admin.users),
    });
  },

  async updateKycStatus(requestId, status) {
    return safeServiceCall({
      request: () =>
        apiClient.patch(endpoints.admin.kycStatus(requestId), { status }),
      fallback: { success: true, id: requestId, status },
    });
  },

  async getTickets(params) {
    return safeServiceCall({
      request: () => apiClient.get(endpoints.admin.tickets, { query: params }),
      fallback: {
        items: cloneDeep(mockData.admin.tickets),
        total: mockData.admin.tickets.length,
      },
    });
  },

  async updateTicketStatus(ticketId, status) {
    return safeServiceCall({
      request: () =>
        apiClient.patch(endpoints.admin.ticketStatus(ticketId), { status }),
      fallback: { success: true, id: ticketId, status },
    });
  },

  async addTicketReply(ticketId, message) {
    return safeServiceCall({
      request: () =>
        apiClient.post(endpoints.admin.ticketReply(ticketId), message),
      fallback: {
        success: true,
        ticketId,
        message,
      },
    });
  },

  async createApp(payload) {
    return safeServiceCall({
      request: () => apiClient.post(endpoints.admin.apps, payload),
      fallback: {
        success: true,
        app: {
          id: payload.id || `app-${Date.now()}`,
          ...payload,
        },
      },
    });
  },

  async updateApp(appId, payload) {
    return safeServiceCall({
      request: () => apiClient.put(endpoints.admin.appById(appId), payload),
      fallback: {
        success: true,
        app: {
          id: appId,
          ...payload,
        },
      },
    });
  },

  async deleteApp(appId) {
    return safeServiceCall({
      request: () => apiClient.delete(endpoints.admin.appById(appId)),
      fallback: { success: true, id: appId },
    });
  },
};
