import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";
import { mockData } from "./mockData";
import { safeServiceCall } from "./serviceUtils";

export const profileApi = {
  async getMyProfile() {
    return safeServiceCall({
      request: () => apiClient.get(endpoints.profile.me),
      fallback: mockData.profile,
    });
  },

  async updateMyProfile(payload) {
    return safeServiceCall({
      request: () => apiClient.put(endpoints.profile.update, payload),
      fallback: { success: true, profile: payload },
    });
  },

  async uploadProfilePhoto(photoBase64) {
    return safeServiceCall({
      request: () =>
        apiClient.post(endpoints.profile.uploadPhoto, { photo: photoBase64 }),
      fallback: { success: true, photoUrl: photoBase64 },
    });
  },
};
