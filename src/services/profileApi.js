import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";
import { mockData } from "./mockData";
import { safeServiceCall } from "./serviceUtils";
import { apiCall } from "./fetchApi";

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

  /**
   * GET /profile - Get user profile from backend
   * Requires: Authorization token
   */
  async getProfileFromBackend() {
    try {
      return await apiCall("/profile", "GET");
    } catch (error) {
      console.error("Failed to fetch user profile from backend:", error);
      throw error;
    }
  },
};
