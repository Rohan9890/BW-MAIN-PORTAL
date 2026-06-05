import { apiClient } from "./apiClient";
import { ticketsBackend } from "./backendApis";
import { backendJson } from "./backendClient";
import { endpoints } from "./endpoints";
import { mockData } from "./mockData";
import { cloneDeep, safeServiceCall, USE_MOCK_API } from "./serviceUtils";
import { getRegisteredUsers } from "./registrationStore";
const IS_DEV = import.meta.env.DEV;

function isAuthError(err) {
  return err?.status === 401 || err?.status === 403;
}

function isNetworkOrOffline(err) {
  const s = err?.status;
  if (s === 0 || s === null || s === undefined) return true;
  if (typeof s === "number" && s >= 500) return true;
  const msg = String(err?.message || "").toLowerCase();
  return msg.includes("network") || msg.includes("failed to fetch") || msg.includes("timeout");
}

export const adminApi = {
  async getDashboardData() {
    const fallback = {
      stats: mockData.admin.stats,
      apps: mockData.admin.apps,
      payments: mockData.admin.payments,
      tickets: mockData.admin.tickets,
      activityFeed: mockData.admin.activityFeed,
      userGrowth: mockData.admin.userGrowth,
    };
    if (USE_MOCK_API) return cloneDeep(fallback);
    try {
      return await apiClient.get(endpoints.admin.dashboard);
    } catch (err) {
      if (isAuthError(err)) {
        return { stats: [], apps: [], payments: [], tickets: [], activityFeed: [], userGrowth: [] };
      }
      if (IS_DEV && isNetworkOrOffline(err)) return cloneDeep(fallback);
      throw err;
    }
  },

  async getUsers(params) {
    const fallback = (() => {
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
    })();
    if (USE_MOCK_API) return cloneDeep(fallback);
    try {
      return await apiClient.get(endpoints.admin.users, { query: params });
    } catch (err) {
      if (isAuthError(err)) {
        return { items: [], total: 0 };
      }
      if (IS_DEV && isNetworkOrOffline(err)) return cloneDeep(fallback);
      throw err;
    }
  },

  async updateUserStatus(userId, status) {
    return safeServiceCall({
      request: () =>
        apiClient.patch(endpoints.admin.userStatus(userId), { status }),
      fallback: { success: true, userId, status },
    });
  },

  async exportUsers(params) {
    const fallback = cloneDeep(mockData.admin.users);
    if (USE_MOCK_API) return cloneDeep(fallback);
    try {
      return await apiClient.get(`${endpoints.admin.users}/export`, { query: params });
    } catch (err) {
      if (isAuthError(err)) {
        return [];
      }
      if (IS_DEV && isNetworkOrOffline(err)) return cloneDeep(fallback);
      throw err;
    }
  },

  async updateKycStatus(requestId, status) {
    return safeServiceCall({
      request: () =>
        apiClient.patch(endpoints.admin.kycStatus(requestId), { status }),
      fallback: { success: true, id: requestId, status },
    });
  },

  async getTickets(params) {
    const fallback = {
      items: cloneDeep(mockData.admin.tickets),
      total: mockData.admin.tickets.length,
    };
    if (USE_MOCK_API) return cloneDeep(fallback);
    try {
      return await apiClient.get(endpoints.admin.tickets, { query: params });
    } catch (err) {
      if (isAuthError(err)) {
        return { items: [], total: 0 };
      }
      if (IS_DEV && isNetworkOrOffline(err)) return cloneDeep(fallback);
      throw err;
    }
  },

  async updateTicketStatus(ticketId, status) {
    return safeServiceCall({
      request: () =>
        backendJson(`/tickets/status/${encodeURIComponent(String(ticketId))}`, {
          method: "PUT",
          json: { status: String(status || "").toUpperCase() },
        }),
      fallback: { success: true, id: ticketId, status },
    });
  },

  async addTicketReply(ticketId, message) {
    return safeServiceCall({
      request: () =>
        ticketsBackend.reply({
          ticketId,
          id: ticketId,
          message,
          body: message,
        }),
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
