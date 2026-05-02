export const settingsApi = {
  async getSettings() {
    // Backend endpoint not confirmed stable; disabled to avoid 500s.
    return null;
  },

  async updateSettings(payload) {
    void payload;
    // Disabled until backend confirms /settings/me contract.
    return null;
  },
};
