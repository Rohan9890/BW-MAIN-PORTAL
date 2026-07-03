/** Roles that may access the admin dashboard UI (backend must enforce on every /admin/** API). */
export const ADMIN_PANEL_ROLES = new Set(["ROLE_ADMIN", "ROLE_OWNER"]);

/** Roles allowed to send admin invites (OWNER may invite ADMIN or OWNER). */
export const ADMIN_INVITE_ROLES = new Set(["ROLE_ADMIN", "ROLE_OWNER"]);

export const ADMIN_UNKNOWN_USER_LABEL = "Unknown User";
export const ADMIN_MISSING_FIELD_LABEL = "—";

const BAD_DISPLAY_VALUES = new Set(["null", "undefined", "—", "-", "n/a", "na"]);

function isUsableDisplayValue(value) {
  const t = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return false;
  const low = t.toLowerCase();
  if (BAD_DISPLAY_VALUES.has(low)) return false;
  if (low === "undefined" || low === "null") return false;
  if (/^undefined(\s+undefined)?$/i.test(t)) return false;
  return true;
}

/** Collect root + nested `user` / `profile` / `_raw` nodes from API payloads. */
export function collectUserRecordNodes(raw) {
  if (!raw || typeof raw !== "object") return [];
  const nodes = [raw];
  if (raw.user && typeof raw.user === "object") nodes.push(raw.user);
  if (raw.profile && typeof raw.profile === "object") nodes.push(raw.profile);
  if (raw._raw && typeof raw._raw === "object") {
    nodes.push(raw._raw);
    if (raw._raw.user && typeof raw._raw.user === "object") nodes.push(raw._raw.user);
    if (raw._raw.profile && typeof raw._raw.profile === "object") {
      nodes.push(raw._raw.profile);
    }
  }
  return nodes;
}

function firstUsableFromNodes(nodes, keys) {
  for (const node of nodes) {
    for (const key of keys) {
      const value = node[key];
      if (isUsableDisplayValue(value)) return String(value).trim();
    }
  }
  return "";
}

function readAuthorities(raw) {
  if (!raw || typeof raw !== "object") return [];
  const nodes = collectUserRecordNodes(raw);
  for (const node of nodes) {
    const authorities = node.authorities;
    if (Array.isArray(authorities) && authorities.length) return authorities;
  }
  return [];
}

/** First raw role string before normalization (for DEV audit logs). */
export function extractRawRoleLabel(raw) {
  if (!raw || typeof raw !== "object") return "";
  const nodes = collectUserRecordNodes(raw);
  const direct = firstUsableFromNodes(nodes, [
    "panelRole",
    "role",
    "userRole",
    "adminRole",
  ]);
  if (direct) return direct;

  for (const entry of readAuthorities(raw)) {
    if (typeof entry === "string" && isUsableDisplayValue(entry)) return entry.trim();
    const roleName = entry?.authority ?? entry?.role ?? entry?.name;
    if (isUsableDisplayValue(roleName)) return String(roleName).trim();
  }

  const legacyType = firstUsableFromNodes(nodes, ["type"]);
  if (legacyType && /^(USER|ORG|ADMIN|OWNER|ROLE_)/i.test(legacyType)) {
    return legacyType;
  }
  return "";
}

/**
 * Resolve panel role from root, nested user/profile, or Spring Security authorities.
 * @returns {string} ROLE_USER | ROLE_ORG | ROLE_ADMIN | ROLE_OWNER | ""
 */
export function extractRoleFromRawUser(raw) {
  if (!raw || typeof raw !== "object") return "";

  for (const entry of readAuthorities(raw)) {
    const roleName =
      typeof entry === "string"
        ? entry
        : entry?.authority ?? entry?.role ?? entry?.name;
    const normalized = normalizePanelRole(roleName);
    if (normalized === "ROLE_OWNER" || normalized === "ROLE_ADMIN") {
      return normalized;
    }
  }

  const nodes = collectUserRecordNodes(raw);
  const direct = firstUsableFromNodes(nodes, [
    "panelRole",
    "role",
    "userRole",
    "adminRole",
  ]);
  const fromFields = normalizePanelRole(direct);
  if (fromFields) return fromFields;

  for (const entry of readAuthorities(raw)) {
    const roleName =
      typeof entry === "string"
        ? entry
        : entry?.authority ?? entry?.role ?? entry?.name;
    const normalized = normalizePanelRole(roleName);
    if (normalized) return normalized;
  }

  const legacyType = firstUsableFromNodes(nodes, ["type"]);
  return normalizePanelRole(legacyType);
}

export function extractNameFromRawUser(raw) {
  const nodes = collectUserRecordNodes(raw);
  for (const node of nodes) {
    const partA = node.firstName != null ? String(node.firstName).trim() : "";
    const partB = node.lastName != null ? String(node.lastName).trim() : "";
    const fromParts = [partA, partB].filter(Boolean).join(" ").trim();
    if (isUsableDisplayValue(fromParts)) return fromParts;
  }

  return (
    firstUsableFromNodes(nodes, [
      "fullName",
      "displayName",
      "name",
      "username",
      "userName",
      "contactName",
      "orgName",
      "organizationName",
    ]) || ""
  );
}

export function extractEmailFromRawUser(raw) {
  const nodes = collectUserRecordNodes(raw);
  return (
    firstUsableFromNodes(nodes, [
      "email",
      "userEmail",
      "emailAddress",
      "mail",
    ]) || ""
  );
}

export function extractPhoneFromRawUser(raw) {
  const nodes = collectUserRecordNodes(raw);
  return (
    firstUsableFromNodes(nodes, [
      "phoneNumber",
      "phone",
      "mobile",
      "mobileNumber",
      "contactPhone",
    ]) || ""
  );
}

export function resolveAdminUserDisplayName(raw) {
  return extractNameFromRawUser(raw) || ADMIN_UNKNOWN_USER_LABEL;
}

export function resolveAdminUserEmail(raw) {
  return extractEmailFromRawUser(raw) || ADMIN_MISSING_FIELD_LABEL;
}

export function resolveAdminUserPhone(raw) {
  return extractPhoneFromRawUser(raw) || ADMIN_MISSING_FIELD_LABEL;
}

/** Admin/owner metric cards — always use normalized `panelRole` on rows. */
export function computeAdminUserRoleCounts(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return {
    all: list.length,
    admin: list.filter((u) => u.panelRole === "ROLE_ADMIN").length,
    owner: list.filter((u) => u.panelRole === "ROLE_OWNER").length,
  };
}

/** DEV-only audit for admin users role parsing (safe to ship — no-op in production). */
export function logDevAdminUsersRoleAudit(rows, meta = {}) {
  if (!import.meta.env.DEV) return;
  const list = Array.isArray(rows) ? rows : [];
  const counts = computeAdminUserRoleCounts(list);
  const sample = list.slice(0, 8).map((u) => ({
    id: u.id,
    rawRole: u.rawRole ?? "",
    panelRole: u.panelRole ?? "",
    email: u.email,
    name: u.displayName ?? u.name,
  }));
  // eslint-disable-next-line no-console
  console.debug("[admin-users] role audit", { counts, sample, ...meta });
}

export function normalizePanelRole(value) {
  const s = String(value || "").trim().toUpperCase();
  if (!s) return "";
  if (s.includes("ROLE_OWNER") || s === "OWNER") return "ROLE_OWNER";
  if (s.includes("ROLE_ADMIN") || s === "ADMIN") return "ROLE_ADMIN";
  if (s.includes("ROLE_ORG") || s === "ORG") return "ROLE_ORG";
  if (s.includes("ROLE_USER") || s === "USER") return "ROLE_USER";
  if (s.startsWith("ROLE_")) return s;
  return "";
}

export function canAccessAdminPanel(role) {
  return ADMIN_PANEL_ROLES.has(normalizePanelRole(role));
}

export function canInviteAdmins(role) {
  return ADMIN_INVITE_ROLES.has(normalizePanelRole(role));
}

export function canInviteOwnerRole(inviterRole) {
  return normalizePanelRole(inviterRole) === "ROLE_OWNER";
}

/** Short API/UI role labels for admin role changes (account type ORG is display-only). */
export const PANEL_ROLE_OPTIONS = ["USER", "ADMIN", "OWNER"];

export function toApiRole(value) {
  const normalized = normalizePanelRole(value);
  if (!normalized) return "USER";
  return normalized.replace(/^ROLE_/, "");
}

import { extractAdminUserExternalId, isOrganizationExternalId } from "./userExternalId";

/** True when row represents an organization account (supports legacy USR- org rows). */
export function isOrganizationAccount(user) {
  if (!user || typeof user !== "object") return false;

  if (extractRoleFromRawUser(user) === "ROLE_ORG") return true;
  if (isOrganizationExternalId(extractAdminUserExternalId(user))) return true;

  const nodes = collectUserRecordNodes(user);
  const entity = firstUsableFromNodes(nodes, [
    "entityType",
    "userType",
    "accountType",
  ]).toUpperCase();
  if (
    entity === "ORG" ||
    entity === "ORGANIZATION" ||
    entity === "ORGANISATION"
  ) {
    return true;
  }

  const orgName = firstUsableFromNodes(nodes, [
    "orgName",
    "organizationName",
    "companyName",
  ]);
  return Boolean(orgName);
}

/**
 * Admin users table badge label: USER (individual), ORG (organization), ADMIN, OWNER.
 */
export function resolveAdminUserTypeLabel(user) {
  if (!user || typeof user !== "object") return "USER";
  const panel = user.panelRole ?? extractRoleFromRawUser(user);
  if (panel === "ROLE_ADMIN") return "ADMIN";
  if (panel === "ROLE_OWNER") return "OWNER";
  if (isOrganizationAccount(user)) return "ORG";
  return "USER";
}

export function extractRowPanelRole(user) {
  const normalized =
    user?.panelRole ?? extractRoleFromRawUser(user) ?? "ROLE_USER";
  return toApiRole(normalized);
}

export function isSameUserRow(actorProfile, targetRow) {
  const actorEmail = String(actorProfile?.email || actorProfile?.userEmail || "")
    .trim()
    .toLowerCase();
  const targetEmail = String(targetRow?.email || "")
    .trim()
    .toLowerCase();
  if (actorEmail && targetEmail && actorEmail !== "—" && actorEmail === targetEmail) {
    return true;
  }
  const actorId = String(actorProfile?.userId || actorProfile?.id || "").trim();
  const targetId = String(
    targetRow?.userId || targetRow?.id || targetRow?.user_id || "",
  ).trim();
  return Boolean(actorId && targetId && actorId === targetId);
}

export function countOwnersInRows(rows) {
  if (!Array.isArray(rows)) return 0;
  return rows.filter((row) => extractRowPanelRole(row) === "OWNER").length;
}

export function isLastOwnerTarget(targetRow, allRows) {
  if (extractRowPanelRole(targetRow) !== "OWNER") return false;
  return countOwnersInRows(allRows) <= 1;
}

/**
 * Roles the actor may pick in the dropdown for this target (forbidden options hidden).
 * Always includes the current role when the row is manageable.
 */
export function getAllowedTargetRoles(actorRole, currentRole, options = {}) {
  const { isSelf = false, isLastOwnerTarget = false } = options;
  const actor = normalizePanelRole(actorRole);
  const current = toApiRole(currentRole);

  if (isSelf) return [current];

  if (actor === "ROLE_ADMIN") {
    if (current === "OWNER") return ["OWNER"];
    if (current === "USER") return ["USER", "ADMIN"];
    if (current === "ADMIN") return ["ADMIN", "USER"];
    return [current];
  }

  if (actor === "ROLE_OWNER") {
    if (isLastOwnerTarget && current === "OWNER") return ["OWNER"];
    return [...PANEL_ROLE_OPTIONS];
  }

  return [current];
}

export function isRoleChangeAllowed(actorRole, fromRole, toRole, options = {}) {
  const from = toApiRole(fromRole);
  const to = toApiRole(toRole);
  if (from === to) return false;
  if (options.isSelf) return false;
  const allowed = getAllowedTargetRoles(actorRole, from, options);
  return allowed.includes(to);
}

export function canActorManageUserRole(actorRole, targetRow, allRows, actorProfile) {
  const actor = normalizePanelRole(actorRole);
  if (!ADMIN_PANEL_ROLES.has(actor)) return false;
  if (isSameUserRow(actorProfile, targetRow)) return false;
  if (actor === "ROLE_ADMIN" && extractRowPanelRole(targetRow) === "OWNER") {
    return false;
  }
  if (isLastOwnerTarget(targetRow, allRows)) return false;
  const current = extractRowPanelRole(targetRow);
  const allowed = getAllowedTargetRoles(actorRole, current, {
    isSelf: false,
    isLastOwnerTarget: isLastOwnerTarget(targetRow, allRows),
  });
  return allowed.length > 1;
}

export function getRoleDropdownDisabledReason(
  actorRole,
  targetRow,
  allRows,
  actorProfile,
) {
  if (isSameUserRow(actorProfile, targetRow)) {
    return "You cannot change your own role";
  }
  if (
    normalizePanelRole(actorRole) === "ROLE_ADMIN" &&
    extractRowPanelRole(targetRow) === "OWNER"
  ) {
    return "Only owners can change owner accounts";
  }
  if (isLastOwnerTarget(targetRow, allRows)) {
    return "The last owner cannot be demoted";
  }
  if (!canActorManageUserRole(actorRole, targetRow, allRows, actorProfile)) {
    return "Role change not permitted";
  }
  return "";
}

export function canActorDeactivateUser(actorRole, targetRow, allRows, actorProfile) {
  const actor = normalizePanelRole(actorRole);
  if (!ADMIN_PANEL_ROLES.has(actor)) return false;
  if (isSameUserRow(actorProfile, targetRow)) return false;
  if (actor === "ROLE_ADMIN" && extractRowPanelRole(targetRow) === "OWNER") {
    return false;
  }
  if (isLastOwnerTarget(targetRow, allRows)) return false;
  return true;
}

export function getDeactivateDisabledReason(
  actorRole,
  targetRow,
  allRows,
  actorProfile,
) {
  if (isSameUserRow(actorProfile, targetRow)) {
    return "You cannot deactivate your own account";
  }
  if (
    normalizePanelRole(actorRole) === "ROLE_ADMIN" &&
    extractRowPanelRole(targetRow) === "OWNER"
  ) {
    return "Only owners can deactivate owner accounts";
  }
  if (isLastOwnerTarget(targetRow, allRows)) {
    return "The last owner cannot be deactivated";
  }
  if (!canActorDeactivateUser(actorRole, targetRow, allRows, actorProfile)) {
    return "Deactivation not permitted";
  }
  return "";
}

export function getRoleChangeConfirmation(fromRole, toRole, displayName) {
  const name = String(displayName || "this user").trim() || "this user";
  const from = toApiRole(fromRole);
  const to = toApiRole(toRole);
  if (to === "OWNER") {
    return `Promoting ${name} to OWNER grants full platform ownership, including inviting owners and changing all roles.`;
  }
  if (to === "ADMIN") {
    return `Promoting ${name} to ADMIN grants dashboard management access.`;
  }
  if (to === "USER" && (from === "ADMIN" || from === "OWNER")) {
    return `Demoting ${name} to USER removes admin dashboard access.`;
  }
  return `Change ${name}'s role from ${from} to ${to}?`;
}
