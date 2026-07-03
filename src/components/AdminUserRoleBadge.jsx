import { toApiRole, resolveAdminUserTypeLabel } from "../utils/adminRoles";

const ROLE_CLASS = {
  USER: "user",
  ORG: "org",
  ADMIN: "admin",
  OWNER: "owner",
};

/**
 * Read-only role pill for table rows and user detail views.
 * Pass `user` for account-type aware USER/ORG labels; `role` alone is a legacy fallback.
 */
export default function AdminUserRoleBadge({ role, user = null, compact = false }) {
  const label = user ? resolveAdminUserTypeLabel(user) : toApiRole(role);
  const slug = ROLE_CLASS[label] || "user";
  return (
    <span
      className={`users-role-badge users-role-badge--${slug}${compact ? " users-role-badge--compact" : ""}`}
    >
      {label}
    </span>
  );
}
