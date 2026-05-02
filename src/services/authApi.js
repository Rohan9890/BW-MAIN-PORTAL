import {
  loginWithEmailPassword,
  verifyOtpLogin,
  registerUser,
  clearAuth as clearAuthStorage,
} from "./fetchApi";

export const authApi = {
  // ================= REGISTER =================
  async register(formData) {
    try {
      // ✅ MUST BE FORMDATA
      return await registerUser(formData);
    } catch (error) {
      throw {
        message: error?.message || "Registration failed",
        status: error?.status,
      };
    }
  },

  // ================= LOGIN (SEND OTP) =================
  async login({ email, password }) {
    try {
      const res = await loginWithEmailPassword(email, password);

      return {
        success: true,
        message: res?.message || "OTP sent",
      };
    } catch (error) {
      let msg = error?.message || "Login failed";

      if (msg.toLowerCase().includes("verify")) {
        msg = "Please verify your email first";
      }

      throw { message: msg };
    }
  },

  // ================= VERIFY OTP =================
  async verifyOtp({ email, otp }) {
    try {
      const res = await verifyOtpLogin(email, otp);

      const token = res?.accessToken || res?.token || res?.data?.token || "";

      const userId = res?.userId || res?.data?.userId || "";

      if (!token) throw new Error("Token missing");

      localStorage.setItem("ui-access-token", token);
      if (userId) localStorage.setItem("userId", userId);

      return { token, userId };
    } catch (error) {
      throw { message: error?.message || "OTP verification failed" };
    }
  },

  // ================= CLEAR =================
  clearAuth() {
    clearAuthStorage();
  },
};
