import { buildApiRequestUrl } from "../services/apiConfig";

export const APP_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
  SUSPENDED: "SUSPENDED",
};

export const VISIBILITY = {
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
};

function normalizeStatus(raw) {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (s === "ACTIVE" || s === "LIVE" || s === "ENABLED") return APP_STATUS.PUBLISHED;
  if (Object.values(APP_STATUS).includes(s)) return s;
  const low = String(raw ?? "").toLowerCase();
  if (low === "active" || low === "published") return APP_STATUS.PUBLISHED;
  return APP_STATUS.DRAFT;
}

function normalizeVisibility(raw) {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (s === VISIBILITY.PRIVATE) return VISIBILITY.PRIVATE;
  return VISIBILITY.PUBLIC;
}

/**
 * Normalize admin/API app row to a single canonical shape (supports id/appId, name/appName, etc.).
 * @param {object} raw
 * @returns {object | null}
 */
export function normalizeAdminAppRow(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id ?? raw.appId ?? raw.applicationId;
  if (id === undefined || id === null || String(id).trim() === "") return null;

  const name = String(raw.name ?? raw.appName ?? raw.title ?? "App").trim() || "App";
  const slugRaw = String(raw.slug ?? "").trim();
  const slug =
    slugRaw ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `app-${String(id)}`;

  return {
    id: String(id),
    name,
    slug,
    description: String(raw.description ?? raw.appText ?? raw.detail ?? "").trim(),
    logoUrl: String(raw.logoUrl ?? raw.appLogo ?? raw.iconUrl ?? "").trim(),
    bannerUrl: String(raw.bannerUrl ?? raw.banner ?? raw.coverUrl ?? "").trim(),
    category: String(raw.category ?? raw.appType ?? "GENERAL").trim() || "GENERAL",
    status: normalizeStatus(raw.status ?? raw.appStatus),
    visibility: normalizeVisibility(raw.visibility),
    featured: Boolean(raw.featured ?? raw.isFeatured),
    routePath: String(raw.routePath ?? raw.route ?? "").trim(),
    externalUrl: String(raw.externalUrl ?? "").trim(),
    version: String(raw.version ?? "1.0.0").trim() || "1.0.0",
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
    createdBy: String(raw.createdBy ?? raw.createdByUserId ?? raw.ownerId ?? "").trim(),
    downloads: Number(raw.downloads ?? 0) || 0,
    activeUsers: Number(raw.activeUsers ?? raw.activeUserCount ?? 0) || 0,
    /** Legacy single URL field from older APIs */
    appUrl: String(raw.appUrl ?? raw.url ?? "").trim(),
  };
}

/** Prefer external URL, else SPA route, else legacy `appUrl` (for PATCH compatibility). */
export function computeCatalogAppUrlForApi(row) {
  const ext = String(row?.externalUrl ?? "").trim();
  if (ext && /^https?:\/\//i.test(ext)) return ext;
  const rt = String(row?.routePath ?? "").trim();
  if (rt) return rt.startsWith("/") ? rt : `/${rt}`;
  return String(row?.appUrl ?? "").trim();
}

/** Resolve relative media paths against API root for `<img src>`. */
export function resolveAppMediaUrl(url) {
  const u = String(url ?? "").trim();
  if (!u) return "";
  if (/^(https?:|data:|blob:)/i.test(u)) return u;
  if (u.startsWith("/")) return buildApiRequestUrl(u);
  return u;
}

export function unwrapAssetUploadUrl(res) {
  if (res == null) return "";
  const node = res?.data !== undefined ? res.data : res;
  return String(
    node?.url ?? node?.logoUrl ?? node?.bannerUrl ?? node?.fileUrl ?? node?.location ?? "",
  ).trim();
}
