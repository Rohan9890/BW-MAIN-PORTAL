/**
 * @deprecated Prefer `ticketsBackend` from `backendApis.js`.
 * Legacy bridge — no mock fallbacks in production.
 */
import { ticketsBackend } from "./backendApis";

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export const ticketsApi = {
  async getTickets(params) {
    const data = await ticketsBackend.my(params);
    const items = normalizeList(data);
    return { items, total: items.length };
  },

  async getTicketById(ticketId) {
    return ticketsBackend.getById(ticketId);
  },

  async createTicket(payload) {
    return ticketsBackend.create(payload);
  },

  async updateTicketStatus(ticketId, status) {
    return ticketsBackend.resolve(ticketId, status);
  },

  async addTicketReply(ticketId, message) {
    return ticketsBackend.reply({
      ticketId,
      id: ticketId,
      message,
      body: message,
    });
  },

  async deleteTicket(_ticketId) {
    throw new Error("Ticket delete is not supported by the Authify API contract.");
  },
};
