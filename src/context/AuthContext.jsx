import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { setLogoutHandler } from "../services/apiClient";
import { profileBackend } from "../services/backendApis";
import { invalidateDashboardBundleCache } from "../services/dashboardBundleCache";
import { cancelDebouncedDashboardInvalidate } from "../services/dashboardInvalidate";
import { invalidateRecentAppsCache } from "../services/recentAppsCache";
import { invalidateUsageTimeseriesCache } from "../services/usageTimeseriesCache";

const TOKEN_KEY = "ui-access-token";
const USER_ID_KEY = "userId";
const PROFILE_KEY = "ui-profile";

const AuthContext = createContext(null);

export function getInitials(name) {
  const value = String(name || "").trim();
  if (!value) return "U";
  const parts = value.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const second = parts.length > 1 ? parts[1]?.[0] || "" : "";
  return (first + second).toUpperCase();
}

/**
 * Coalesce common API shapes so UI can rely on `name` / `email`.
 * (e.g. backend returns fullName but not name)
 */
export function normalizeProfilePayload(data) {
  if (!data || typeof data !== "object") return data;

  let merged = { ...data };
  if (data.profile && typeof data.profile === "object") {
    const p = data.profile;
    merged = {
      ...merged,
      ...p,
      kyc: p.kyc ?? merged.kyc ?? data.kyc,
    };
  }

  const nestedUser =
    merged.user && typeof merged.user === "object" ? merged.user : null;
  const fromParts = [merged.firstName, merged.lastName].filter(Boolean).join(" ").trim();
  const coalescedName = String(
    merged.name ||
      merged.fullName ||
      merged.full_name ||
      fromParts ||
      merged.userName ||
      nestedUser?.name ||
      "",
  ).trim();
  const coalescedEmail = String(
    merged.email || nestedUser?.email || merged.userEmail || "",
  ).trim();
  const phoneRaw =
    merged.phoneNumber ??
    merged.phone ??
    merged.mobile ??
    merged.mobileNumber ??
    nestedUser?.phoneNumber ??
    "";
  const coalescedPhone = String(phoneRaw || "").trim();

  const nestedKyc =
    merged.kyc && typeof merged.kyc === "object" ? merged.kyc : null;

  return {
    ...merged,
    ...(coalescedName ? { name: coalescedName } : {}),
    ...(coalescedEmail ? { email: coalescedEmail } : {}),
    ...(coalescedPhone ? { phoneNumber: coalescedPhone } : {}),
    ...(nestedKyc ? { kyc: nestedKyc } : {}),
  };
}

/**
 * Greeting token: profile.name → nested user.name → email local-part → "" (caller shows "there").
 */
export function getGreetingFirstName(profile) {
  const n = String(profile?.name || "").trim();
  if (n) return n.split(/\s+/)[0];
  const u = String(profile?.user?.name || "").trim();
  if (u) return u.split(/\s+/)[0];
  const e = String(profile?.email || "").trim();
  if (e) return e.split("@")[0];
  return "";
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
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(() => {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    try {
      return normalizeProfilePayload(JSON.parse(raw));
    } catch {
      return null;
    }
  });
  const [initializing, setInitializing] = useState(true);

  const token = window.localStorage.getItem(TOKEN_KEY) || "";

  const writeProfile = (nextProfile) => {
    if (!nextProfile) {
      window.localStorage.removeItem(PROFILE_KEY);
      return;
    }
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
  };

  const hydrateProfile = async () => {
    const currentToken = window.localStorage.getItem(TOKEN_KEY);
    if (!currentToken) {
      setProfile(null);
      writeProfile(null);
      return null;
    }
    const data = await profileBackend.getProfile();
    const next = data ? normalizeProfilePayload(data) : null;
    setProfile(next);
    writeProfile(next);
    return next;
  };

  const onLoginSuccess = async ({ token: nextToken, userId }) => {
    const trimmed = typeof nextToken === "string" ? nextToken.trim() : nextToken;
    if (trimmed) window.localStorage.setItem(TOKEN_KEY, trimmed);
    if (userId) window.localStorage.setItem(USER_ID_KEY, String(userId));
    cancelDebouncedDashboardInvalidate();
    invalidateDashboardBundleCache();
    invalidateRecentAppsCache();
    invalidateUsageTimeseriesCache();
    await hydrateProfile();
  };

  const updateUser = (patch) => {
    setProfile((prev) => {
      const next = normalizeProfilePayload({
        ...(prev || {}),
        ...(patch || {}),
      });
      writeProfile(next);
      return next;
    });
  };

  const logout = () => {
    cancelDebouncedDashboardInvalidate();
    invalidateDashboardBundleCache();
    invalidateRecentAppsCache();
    invalidateUsageTimeseriesCache();
    setProfile(null);
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_ID_KEY);
    window.localStorage.removeItem(PROFILE_KEY);
  };

  useEffect(() => {
    setLogoutHandler(logout);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await hydrateProfile();
      } catch {
        // If token exists but profile fetch fails, keep UI usable; pages can show errors.
      } finally {
        if (active) setInitializing(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      token,
      profile,
      initializing,
      hydrateProfile,
      onLoginSuccess,
      updateProfile: updateUser,
      logout,
    }),
    [token, profile, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
