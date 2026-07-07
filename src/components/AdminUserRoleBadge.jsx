import { toApiRole, resolveAdminUserTypeLabel } from "../utils/adminRoles";
import {
  resolveAccountTypeLabel,
  resolveStaffRoleLabel,
} from "../utils/adminUserDto";

const ROLE_CLASS = {
  USER: "user",
  ORG: "org",
  ADMIN: "admin",
  OWNER: "owner",
};

/**
 * Read-only badge for admin user tables.
 * @param {"account"|"staff"|"auto"} variant
 *   - account: USER/ORG only (users table Type column)
 *   - staff: ADMIN/OWNER (admins/owners tables)
 *   - auto: legacy resolveAdminUserTypeLabel
 */
export default function AdminUserRoleBadge({
  role,
  user = null,
  compact = false,
  variant = "auto",
}) {
  let label;
  if (user) {
    if (variant === "account") label = resolveAccountTypeLabel(user);
    else if (variant === "staff") label = resolveStaffRoleLabel(user);
    else label = resolveAdminUserTypeLabel(user);
  } else {
    label = toApiRole(role);
  }
  const slug = ROLE_CLASS[label] || "user";
  return (
    <span
      className={`users-role-badge users-role-badge--${slug}${compact ? " users-role-badge--compact" : ""}`}
    >
      {label}
    </span>
  );
}
