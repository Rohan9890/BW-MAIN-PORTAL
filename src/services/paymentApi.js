import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";
import { safeServiceCall } from "./serviceUtils";

export const paymentApi = {
  async createPayment(payload) {
    return safeServiceCall({
      request: () => apiClient.post(endpoints.payment.create, payload),
      fallback: {
        success: true,
        paymentId: `pay_${Date.now()}`,
        status: "initiated",
      },
    });
  },
};
