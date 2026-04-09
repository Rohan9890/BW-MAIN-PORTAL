import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";
import { safeServiceCall } from "./serviceUtils";
import { upsertRegisteredUser } from "./registrationStore";
import {
  loginWithEmailPassword,
  verifyOtpLogin,
  registerUser,
  clearAuth as clearAuthStorage,
} from "./fetchApi";

export const authApi = {
  /**
   * Register a new user via the production backend.
   * Payload shape: { name, email, phoneNumber, password, aadhaarNumber, panNumber }
   */
  async register(payload) {
    try {
      return await registerUser(payload);
    } catch (error) {
      throw {
        message: error?.message || "Failed to register user",
        status: error?.status,
        originalError: error,
      };
    }
  },

  /**
   * Trigger OTP generation — backend does NOT return a token here.
   * Payload: { email, password }
   */
  async login(payload) {
    try {
      const res = await loginWithEmailPassword(payload.email, payload.password);

      if (res?.message !== "OTP sent successfully") {
        throw new Error(res?.message || "Unable to send OTP");
      }

      return {
        success: true,
        message: res.message,
      };
    } catch (error) {
      throw {
        message: error?.message || "Failed to send OTP",
        status: error?.status,
        originalError: error,
      };
    }
  },

  /**
   * Verify OTP after login — backend returns the JWT token here.
   * Payload: { email, otp }
   */
  async verifyOtp({ email, otp }) {
    try {
      const res = await verifyOtpLogin(email, otp);

      const token = res?.token || res?.data?.token;
      const userId = res?.userId || res?.data?.userId;

      if (!token || !userId) {
        throw new Error("Invalid response: missing token or userId");
      }

      localStorage.setItem("ui-access-token", token);
      localStorage.setItem("userId", userId);

      return {
        token,
        userId,
        success: true,
      };
    } catch (error) {
      throw {
        message: error?.message || "Failed to verify OTP",
        status: error?.status,
        originalError: error,
      };
    }
  },

  async registerIndividual(payload) {
    return safeServiceCall({
      request: () => apiClient.post(endpoints.auth.registerIndividual, payload),
      fallback: (() => {
        // TODO: connect to backend API
        const normalizedEmail = String(payload?.email || "")
          .trim()
          .toLowerCase();
        const nextUser = {
          id: `USR-${Date.now().toString().slice(-6)}`,
          name: payload?.fullName || "New User",
          email: normalizedEmail,
          role: "User",
          joinedOn: "Today",
          status: "Active",
          isActive: true,
          phone: payload?.phone || "",
        };
        upsertRegisteredUser(nextUser);
        return {
          success: true,
          message: "Individual registration submitted",
          user: nextUser,
        };
      })(),
    });
  },

  /**
   * Clear authentication data
   */
  clearAuth() {
    clearAuthStorage();
  },
  async registerOrganization(payload) {
    return safeServiceCall({
      request: () =>
        apiClient.post(endpoints.auth.registerOrganization, payload),
      fallback: {
        ...(function () {
          // TODO: connect to backend API
          const normalizedEmail = String(payload?.email || "")
            .trim()
            .toLowerCase();
          const nextUser = {
            id: `USR-${Date.now().toString().slice(-6)}`,
            name: payload?.orgName || "New Organization",
            email: normalizedEmail,
            role: "User",
            joinedOn: "Today",
            status: "Active",
            isActive: true,
            phone: payload?.phone || "",
          };
          upsertRegisteredUser(nextUser);
          return { user: nextUser };
        })(),
        success: true,
        message: "Organization registration submitted",
      },
    });
  },
};
