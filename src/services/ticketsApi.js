import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";
import { mockData } from "./mockData";
import { cloneDeep, safeServiceCall } from "./serviceUtils";

export const ticketsApi = {
  async getTickets(params) {
    return safeServiceCall({
      request: () => apiClient.get(endpoints.tickets.all, { query: params }),
      fallback: {
        items: cloneDeep(mockData.admin.tickets),
        total: mockData.admin.tickets.length,
      },
    });
  },

  async getTicketById(ticketId) {
    return safeServiceCall({
      request: () => apiClient.get(endpoints.tickets.byId(ticketId)),
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
