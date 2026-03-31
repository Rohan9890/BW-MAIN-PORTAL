import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getRegisteredUsers } from "../services/registrationStore";

const TOKEN_KEY = "ui-access-token";
const USER_KEY = "ui-auth-user";

const AuthContext = createContext(null);

export function getInitials(name) {
  const value = String(name || "").trim();
  if (!value) return "U";
  const parts = value.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const second = parts.length > 1 ? parts[1]?.[0] || "" : "";
  return (first + second).toUpperCase();
}

function titleCaseFromIdentifier(identifier) {
  const raw = String(identifier || "")
    .trim()
    .replace(/@.*/, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim();
  if (!raw) return "Demo User";

  return raw
    .split(" ")
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function readInitialUser() {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(USER_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function writeUser(nextUser) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
}

function normalizeRole(role) {
  // Role should be stored consistently as "admin" / "user".
  const r = String(role || "")
    .trim()
    .toLowerCase();
  return r === "admin" ? "admin" : "user";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readInitialUser());

  useEffect(() => {
    // Keep state in sync if another tab updates localStorage.
    const onStorage = (e) => {
      if (e.key !== USER_KEY) return;
      setUser(readInitialUser());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isAuthenticated = !!user;

  const persistAuth = (nextUser) => {
    // TODO: connect to backend API
    // For now we simulate a token so the rest of the app can keep working.
    const token = `mock-token-${Date.now().toString(36)}`;
    window.localStorage.setItem(TOKEN_KEY, token);
    writeUser(nextUser);
    setUser(nextUser);
  };

  const loginWithEmail = async ({ email, role }) => {
    // TODO: connect to backend API
    const normalized = String(email || "").trim().toLowerCase();
    const stored = getRegisteredUsers().find(
      (u) => String(u?.email || "").trim().toLowerCase() === normalized,
    );
    const nextRole = normalizeRole(role);
    const nextUser = {
      name: stored?.name || titleCaseFromIdentifier(normalized),
      email: normalized,
      role: nextRole,
      phone: stored?.phone || undefined,
    };
    persistAuth(nextUser);
    return nextUser;
  };

  const loginWithGoogle = async ({ role }) => {
    // TODO: connect to backend API
    const nextRole = normalizeRole(role);
    const nextUser = {
      name: nextRole === "admin" ? "Admin Google User" : "Google User",
      email:
        nextRole === "admin"
          ? "admin.google@example.com"
          : "user.google@example.com",
      role: nextRole,
    };
    persistAuth(nextUser);
    return nextUser;
  };

  const loginWithPhoneOtp = async ({ phone, otp, role }) => {
    // TODO: connect to backend API
    const nextRole = normalizeRole(role);
    const digits = String(phone || "").replace(/\D/g, "");
    const stored = getRegisteredUsers().find(
      (u) => String(u?.phone || "").replace(/\D/g, "") === digits,
    );
    const nextUser = {
      name: stored?.name || (digits ? `User ${digits.slice(-4)}` : "OTP User"),
      email:
        nextRole === "admin"
          ? `admin.${digits.slice(-4) || "otp"}@example.com`
          : `user.${digits.slice(-4) || "otp"}@example.com`,
      role: nextRole,
      phone: digits,
      // keep otp off the user object intentionally
    };
    if (stored?.email) {
      nextUser.email = stored.email.toLowerCase();
    }
    persistAuth(nextUser);
    return nextUser;
  };

  const updateUser = (patch) => {
    // TODO: connect to backend API
    setUser((prev) => {
      const next = { ...(prev || {}), ...(patch || {}) };
      writeUser(next);
      return next;
    });
  };

  const logout = () => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      loginWithEmail,
      loginWithGoogle,
      loginWithPhoneOtp,
      updateUser,
      logout,
    }),
    [user, isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

