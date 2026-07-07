/**
 * Canonical admin user DTO normalization — single source for admin table/modal rows.
 * Rollout-safe: supports legacy (`status`, `referredByUserId`) and new (`userStatus`, `referredBy`, `pendingEmail`) shapes.
 */
import { extractAdminUserExternalId } from "./userExternalId";
import {
  extractRawRoleLabel,
  extractRoleFromRawUser,
  isOrganizationAccount,
  resolveAdminUserDisplayName,
  resolveAdminUserEmail,
  resolveAdminUserPhone,
  resolveAdminUserTypeLabel,
} from "./adminRoles";
import { extractReferredByFromUser } from "./referralDisplay";

const MISSING = "—";

function toStringSafe(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  const s = String(value).trim();
  return s || fallback;
}

/** Public id for PATCH/GET `/admin/users/{id}` — never prefer numeric DB ids when external id exists. */
export function pickAdminUserPatchId(user) {
  if (!user) return "";
  const external = extractAdminUserExternalId(user);
  if (external) return external;
  const userId = String(user.userId ?? "").trim();
  if (userId && userId !== MISSING) return userId;
  return String(user.id ?? "").trim();
}

/** Pending email from API row or update response (rollout-safe). */
export function extractPendingEmail(raw) {
  if (!raw || typeof raw !== "object") return "";
  const nodes = [raw, raw._raw, raw.user, raw.profile].filter(
    (n) => n && typeof n === "object",
  );
  for (const node of nodes) {
    for (const key of ["pendingEmail", "pending_email", "emailPending"]) {
      const s = String(node[key] ?? "").trim();
      if (s && s !== MISSING) return s;
    }
  }
  return "";
}

/** Account status meta — prefers `userStatus`, falls back to legacy `status`. */
export function normalizeUserStatusMeta(user) {
  if (!user || typeof user !== "object") {
    return { key: "UNKNOWN", label: "Unknown", pillClass: "unknown" };
  }
  const locked =
    user.locked === true ||
    user.isLocked === true ||
    user.accountLocked === true;
  if (locked) {
    return { key: "SUSPENDED", label: "Suspended", pillClass: "suspended" };
  }

  const sRaw =
    user.userStatus ??
    user.status ??
    user.accountStatus ??
    user.user?.userStatus ??
    user.profile?.userStatus;
  if (sRaw !== undefined && sRaw !== null && String(sRaw).trim()) {
    const u = String(sRaw).trim().toUpperCase();
    if (u === "ACTIVE" || u === "ENABLED" || u === "ACTIVATED") {
      return { key: "ACTIVE", label: "Active", pillClass: "active" };
    }
    if (u === "INACTIVE" || u === "DISABLED" || u === "DEACTIVATED") {
      return { key: "INACTIVE", label: "Inactive", pillClass: "inactive" };
    }
    if (u === "BLOCKED" || u === "BANNED") {
      return { key: "BLOCKED", label: "Blocked", pillClass: "blocked" };
    }
    if (u === "SUSPENDED") {
      return { key: "SUSPENDED", label: "Suspended", pillClass: "suspended" };
    }
    if (u === "PENDING") {
      return { key: "PENDING", label: "Pending", pillClass: "pending" };
    }
  }

  if (user.isActive === true) {
    return { key: "ACTIVE", label: "Active", pillClass: "active" };
  }
  if (user.isActive === false) {
    return { key: "INACTIVE", label: "Inactive", pillClass: "inactive" };
  }
  if (user.enabled === true) {
    return { key: "ACTIVE", label: "Active", pillClass: "active" };
  }
  if (user.enabled === false) {
    return { key: "INACTIVE", label: "Inactive", pillClass: "inactive" };
  }
  return { key: "UNKNOWN", label: "Unknown", pillClass: "unknown" };
}

/**
 * Users-table Type column: USER or ORG only (never ADMIN/OWNER).
 */
export function resolveAccountTypeLabel(user) {
  if (!user || typeof user !== "object") return "USER";
  if (isOrganizationAccount(user)) return "ORG";
  return "USER";
}

/** Staff role label for Admins/Owners tables: ADMIN or OWNER. */
export function resolveStaffRoleLabel(user) {
  const panel = user?.panelRole ?? extractRoleFromRawUser(user);
  if (panel === "ROLE_OWNER") return "OWNER";
  if (panel === "ROLE_ADMIN") return "ADMIN";
  return resolveAdminUserTypeLabel(user);
}

export function hasPendingEmailVerification(user) {
  return Boolean(extractPendingEmail(user));
}

/** Default resend cooldown aligned with backend OTP rate limits. */
export const EMAIL_OTP_COOLDOWN_SECONDS = 60;

/** Parse POST /admin/users/request-email-change (or legacy PATCH) response. */
export function parseEmailChangeRequestResponse(res, { newEmail = "" } = {}) {
  const body = res?.data && typeof res.data === "object" ? res.data : res;
  const success = body?.success !== false;
  const pendingEmail =
    extractPendingEmail(body) || String(newEmail || "").trim();
  const verificationSent =
    body?.verificationSent === true ||
    body?.emailVerificationSent === true ||
    body?.pendingVerification === true ||
    (success && Boolean(pendingEmail));
  const message = String(body?.message ?? "").trim();

  return {
    success,
    verificationSent,
    pendingEmail,
    message: message || "OTP sent successfully.",
  };
}

/** Parse PATCH /admin/users/:id response for legacy email verification rollout. */
export function parseAdminUserUpdateResponse(res, { emailChanged = false } = {}) {
  const body = res?.data && typeof res.data === "object" ? res.data : res;
  const verificationSent =
    body?.verificationSent === true ||
    body?.emailVerificationSent === true ||
    body?.pendingVerification === true;
  const pendingEmail = extractPendingEmail(body);
  const message = String(body?.message ?? "").trim();
  const directEmail = String(body?.email ?? "").trim();

  if (verificationSent && pendingEmail) {
    return {
      kind: "email_verification_pending",
      verificationSent: true,
      pendingEmail,
      message: message || "Verification mail sent",
      phoneUpdated: true,
    };
  }

  if (emailChanged && directEmail && !verificationSent) {
    return {
      kind: "email_updated_direct",
      verificationSent: false,
      pendingEmail: "",
      email: directEmail,
      message: message || "Email updated",
      phoneUpdated: true,
    };
  }

  return {
    kind: "profile_updated",
    verificationSent: false,
    pendingEmail: pendingEmail || "",
    email: directEmail || "",
    message: message || "User updated",
    phoneUpdated: true,
  };
}

function readCreatedAtMs(user) {
  const raw =
    user?.createdAt ??
    user?.joinedOn ??
    user?.registeredAt ??
    user?.created_at ??
    user?._raw?.createdAt;
  if (!raw) return -Infinity;
  const ms = Date.parse(String(raw));
  return Number.isFinite(ms) ? ms : -Infinity;
}

/** Newest-first until backend confirms default sort. */
export function sortUsersByCreatedAtDesc(rows) {
  const list = Array.isArray(rows) ? [...rows] : [];
  list.sort((a, b) => readCreatedAtMs(b) - readCreatedAtMs(a));
  return list;
}

/**
 * Normalize a raw admin API user into a table row.
 * @param {object} user
 * @param {{ formatJoinedDate?: (v: unknown) => string, pickKycPill?: (u: object) => object, pickOptionalTicketCount?: (u: object) => number|null, pickTicketsNavQueryParts?: (u: object) => object }} helpers
 */
export function normalizeAdminUserRow(user, helpers = {}) {
  const {
    formatJoinedDate = (v) => (v ? String(v) : "—"),
    pickKycPill = () => ({ key: "unknown", label: "—", className: "unknown" }),
    pickOptionalTicketCount = () => null,
    pickTicketsNavQueryParts = () => ({ enabled: false, q: "" }),
  } = helpers;

  const externalUserId = extractAdminUserExternalId(user);
  const listId = toStringSafe(user?.id ?? user?.userId, "").trim();
  const id = listId || externalUserId || "";

  const fullName = resolveAdminUserDisplayName(user);
  const email = resolveAdminUserEmail(user);
  const phone = resolveAdminUserPhone(user);
  const rawRole = extractRawRoleLabel(user);
  const panelRole = extractRoleFromRawUser(user) || "ROLE_USER";
  const pendingEmail = extractPendingEmail(user);

  const joinedRaw =
    user?.joinedOn ?? user?.createdAt ?? user?.registeredAt ?? "";
  const joinedOnDisplay = formatJoinedDate(joinedRaw);
  const kycPill = pickKycPill(user);
  const statusMeta = normalizeUserStatusMeta(user);
  const ticketCount = pickOptionalTicketCount(user);
  const ticketsNav = pickTicketsNavQueryParts(user);
  const referredBy = extractReferredByFromUser(user);
  const accountTypeLabel = resolveAccountTypeLabel({ ...user, panelRole });
  const staffRoleLabel = resolveStaffRoleLabel({ ...user, panelRole });

  return {
    ...user,
    id:
      id ||
      (email !== MISSING ? email : "") ||
      fullName ||
      (typeof crypto !== "undefined" && crypto.randomUUID?.()) ||
      `u_${Math.random()}`,
    userId:
      externalUserId ||
      toStringSafe(user?.userId ?? user?.user_id, "").trim() ||
      id,
    displayName: fullName,
    name: fullName,
    fullName,
    email,
    phone,
    pendingEmail,
    emailVerificationPending: Boolean(pendingEmail),
    joinedOnDisplay,
    joinedOn: joinedOnDisplay,
    createdAt: joinedRaw,
    kycPill,
    statusMeta,
    status: statusMeta.label,
    ticketCount,
    ticketsNav,
    rawRole,
    panelRole,
    accountTypeLabel,
    staffRoleLabel,
    typeLabel: accountTypeLabel,
    referredBy,
    referredByUserId: referredBy,
    _raw: user,
  };
}

/** Summary KPI counts — prefers backend summary fields, falls back to list lengths. */
export function resolveUserAudienceCounts(summary, fallbacks = {}) {
  const toCount = (v, fb) => {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) return n;
    const f = Number(fallbacks[fb]);
    return Number.isFinite(f) && f >= 0 ? f : 0;
  };
  return {
    users: toCount(
      summary?.totalUserAccounts ??
        summary?.userAccounts ??
        summary?.totalUsers,
      "users",
    ),
    admins: toCount(summary?.adminCount ?? summary?.totalAdmins, "admins"),
    owners: toCount(summary?.ownerCount ?? summary?.totalOwners, "owners"),
  };
}
