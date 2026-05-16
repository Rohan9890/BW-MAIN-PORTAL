import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function normalizeRole(value) {
  const r = String(value || "").trim().toUpperCase();
  return r || "";
}

function pickSafeRedirectForRole(currentRole) {
  const r = normalizeRole(currentRole);
  if (r === "ROLE_ADMIN") return "/admin";
  if (r === "ROLE_USER") return "/dashboard";
  return "/login";
}

export default function ProtectedRoute({ children, requiredRole, disallowRole }) {
  const { token, role, logout, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
        Loading...
      </div>
    );
  }

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ message: "Please login to continue", from: location.pathname }}
      />
    );
  }

  const current = normalizeRole(role);
  const expected = normalizeRole(requiredRole);
  const disallowed = normalizeRole(disallowRole);

  /**
   * Defensive fallback: token exists but role missing/corrupt.
   * Prefer a clean logout so we don't render the wrong dashboard/profile.
   * Must not call `logout()` during render — it updates `AuthProvider` state and
   * triggers "Cannot update a component while rendering a different component".
   */
  const invalidSessionNeedsLogout =
    !authLoading &&
    Boolean(token) &&
    !current &&
    Boolean(expected || disallowed);

  useEffect(() => {
    if (!invalidSessionNeedsLogout) return;
    if (typeof logout === "function") logout();
  }, [invalidSessionNeedsLogout, logout]);

  if (invalidSessionNeedsLogout) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ message: "Session invalid. Please login again." }}
      />
    );
  }

  // Disallow always wins.
  if (disallowed && current === disallowed) {
    const to = pickSafeRedirectForRole(current);
    if (location.pathname !== to) {
      return (
        <Navigate
          to={to}
          replace
          state={{ message: "You do not have access to that page." }}
        />
      );
    }
  }

  if (expected && current !== expected) {
    const to = pickSafeRedirectForRole(current);
    // Prevent infinite redirects by never navigating to the same path.
    if (location.pathname !== to) {
      return (
        <Navigate
          to={to}
          replace
          state={{ message: "You do not have access to that page." }}
        />
      );
    }
    // If we're already at the redirect target (should be rare), show a safe fallback.
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
        Access restricted.
      </div>
    );
  }

  return children;
}

