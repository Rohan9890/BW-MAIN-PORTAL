/**
 * @deprecated Prefer `profileBackend` from `backendApis.js` (canonical `GET/PUT /profile`).
 */
import { profileBackend } from "./backendApis";

export const profileApi = {
  getMyProfile() {
    return profileBackend.getProfile();
  },

  updateMyProfile(payload) {
    return profileBackend.updateProfile(payload);
  },

  uploadProfilePhoto(file) {
    return profileBackend.uploadPhoto(file);
  },

  getProfileFromBackend() {
    return profileBackend.getProfile();
  },
};
