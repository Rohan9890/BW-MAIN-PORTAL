import { apiClient } from "./apiClient";
import { backendJson } from "./backendClient";
import { endpoints } from "./endpoints";
import { mockData } from "./mockData";
import { cloneDeep, safeServiceCall } from "./serviceUtils";

export const ticketsApi = {
  async getTickets(params) {
    return safeServiceCall({
      request: async () => {
        try {
          const response = await backendJson(endpoints.tickets.all, {
            method: "GET",
            query: params,
          });
          return response?.data ?? response ?? {};
        } catch {
          const response = await apiClient.get(endpoints.tickets.all, { query: params });
          return response?.data ?? response ?? {};
        }
      },
      fallback: {
        items: cloneDeep(mockData.admin.tickets),
        total: mockData.admin.tickets.length,
      },
    });
  },

  async getTicketById(ticketId) {
    return safeServiceCall({
      request: async () => {
        try {
          const response = await backendJson(endpoints.tickets.byId(ticketId), { method: "GET" });
          return response?.data ?? response ?? {};
        } catch {
          const response = await apiClient.get(endpoints.tickets.byId(ticketId));
          return response?.data ?? response ?? {};
        }
      },
      fallback:
        cloneDeep(
          mockData.admin.tickets.find((item) => item.id === ticketId),
        ) || null,
    });
  },

  async createTicket(payload) {
    return safeServiceCall({
      request: () => apiClient.post(endpoints.tickets.create, payload),
      fallback: {
        success: true,
        ticket: {
          id: payload.id || `TK-${Date.now()}`,
          ...payload,
        },
      },
    });
  },

  async updateTicketStatus(ticketId, status) {
    return safeServiceCall({
      request: () =>
        apiClient.put(endpoints.tickets.updateStatus(ticketId), { status }),
      fallback: { success: true, id: ticketId, status },
    });
  },

  async addTicketReply(ticketId, message) {
    return safeServiceCall({
      request: () =>
        apiClient.post(endpoints.tickets.reply(ticketId), { message, body: message }),
      fallback: { success: true, ticketId, message },
    });
  },

  async deleteTicket(ticketId) {
    return safeServiceCall({
      request: () => apiClient.delete(endpoints.tickets.byId(ticketId)),
      fallback: { success: true, id: ticketId },
    });
  },
};
