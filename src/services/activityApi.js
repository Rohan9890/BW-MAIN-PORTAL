import { activityBackend } from "./backendApis";

export const activityApi = {
  async getActivity(params) {
    return activityBackend.list(params ?? { page: 0, size: 10 });
  },
};
