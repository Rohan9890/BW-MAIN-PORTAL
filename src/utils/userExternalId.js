/** External user id prefixes supported by backend (legacy + org rollout). */
export const EXTERNAL_USER_ID_RE = /^(USR|ADM|ORG)-/i;

export function isExternalUserId(value) {
  return EXTERNAL_USER_ID_RE.test(String(value ?? "").trim());
}

export function isOrganizationExternalId(value) {
  return /^ORG-/i.test(String(value ?? "").trim());
}

/**
 * Extract public external id (USR-*, ADM-*, ORG-*) from admin/user payloads.
 * @param {object} user
 * @returns {string}
 */
export function extractAdminUserExternalId(user) {
  if (!user || typeof user !== "object") return "";
  const raw = user._raw && typeof user._raw === "object" ? user._raw : user;
  const sources = [user, raw, user.user, raw.user, user.profile, raw.profile].filter(
    (item) => item && typeof item === "object",
  );
  const keys = [
    "userId",
    "user_id",
    "publicUserId",
    "externalUserId",
    "externalId",
  ];
  for (const src of sources) {
    for (const key of keys) {
      const s = String(src[key] ?? "").trim();
      if (s && isExternalUserId(s)) return s;
    }
    const idValue = String(src.id ?? "").trim();
    if (isExternalUserId(idValue)) return idValue;
  }
  return "";
}
