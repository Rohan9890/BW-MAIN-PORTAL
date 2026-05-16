import { backendJson, backendMultipart } from "./backendClient";
import { adminApi } from "./adminApi";
import { mockData } from "./mockData";

const IS_DEV = import.meta.env.DEV;

function isAuthError(err) {
  return err?.status === 401 || err?.status === 403;
}

function isNetworkOrOffline(err) {
  const s = err?.status;
  if (s === 0 || s === null || s === undefined) return true;
  if (typeof s === "number" && s >= 500) return true;
  const msg = String(err?.message || "").toLowerCase();
  return msg.includes("network") || msg.includes("failed to fetch") || msg.includes("timeout");
}

function unwrapArray(res) {
  if (Array.isArray(res)) return res;
  const data = res?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(res?.tickets)) return res.tickets;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.content)) return res.content;
  if (Array.isArray(res?.results)) return res.results;
  if (data && typeof data === "object") {
    if (Array.isArray(data.tickets)) return data.tickets;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.content)) return data.content;
    if (Array.isArray(data.results)) return data.results;
  }
  return [];
}

function toFiniteNumber(value, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    if (cleaned === "") return fallback;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : fallback;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Walk `.data` chain + common nested stats blobs in **outer → inner** order.
 * KPI values must prefer the **first** (shallowest) layer that defines the key,
 * so a nested `data` object cannot overwrite correct dashboard totals with
 * unrelated list totals (e.g. totalElements / page metadata mis-labeled as totalUsers).
 */
function collectSummaryInspectionLayers(raw) {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return [];
  /** @type {object[]} */
  const layers = [];
  let node = raw;
  for (let i = 0; i < 5; i += 1) {
    if (!node || typeof node !== "object" || Array.isArray(node)) break;
    layers.push(node);
    for (const sk of ["statsSummary", "stats", "summary"]) {
      const sub = node[sk];
      if (sub && typeof sub === "object" && !Array.isArray(sub)) layers.push(sub);
    }
    const inner = node.data;
    if (inner == null || typeof inner !== "object" || Array.isArray(inner)) break;
    node = inner;
  }
  return layers;
}

/** First layer (outer-first) that actually defines `key` on the object (own or inherited). */
function pickFirstPresentKpi(layers, key) {
  for (let i = 0; i < layers.length; i += 1) {
    const layer = layers[i];
    if (!layer || typeof layer !== "object") continue;
    if (!Object.prototype.hasOwnProperty.call(layer, key)) continue;
    const v = layer[key];
    if (v === undefined || v === null || v === "") continue;
    return { value: v, layerIndex: i };
  }
  return { value: undefined, layerIndex: -1 };
}

/** First layer (outer-first) with a **positive finite** numeric value for `key`; else first present (incl. 0). */
function pickBestCountKpi(layers, key) {
  let firstAny = pickFirstPresentKpi(layers, key);
  for (let i = 0; i < layers.length; i += 1) {
    const layer = layers[i];
    if (!layer || typeof layer !== "object") continue;
    if (!Object.prototype.hasOwnProperty.call(layer, key)) continue;
    const v = layer[key];
    if (v === undefined || v === null || v === "") continue;
    const n = toFiniteNumber(v, NaN);
    if (Number.isFinite(n) && n > 0) return { value: v, layerIndex: i };
  }
  return firstAny;
}

function buildSummaryFlatFromLayers(layers) {
  /** @type {Record<string, unknown>} */
  const flat = {};
  for (const key of ["totalUsers", "totalApps", "openTickets", "activeUsers"]) {
    const { value } = pickFirstPresentKpi(layers, key);
    if (value !== undefined) flat[key] = value;
  }
  const vHit = pickBestCountKpi(layers, "verifiedUsers");
  if (vHit.value !== undefined) flat.verifiedUsers = vHit.value;
  return flat;
}

function logDashboardSummaryKpiAuditDev({ res, unwrapInput, layers, flat, normalized, usedFallback }) {
  if (!IS_DEV) return;
  const provenance = {};
  for (const key of ["totalUsers", "totalApps", "openTickets", "activeUsers", "verifiedUsers"]) {
    const hit =
      key === "verifiedUsers" ? pickBestCountKpi(layers, key) : pickFirstPresentKpi(layers, key);
    provenance[key] =
      hit.value === undefined
        ? "(absent on all inspected layers)"
        : `layers[${hit.layerIndex}].${key} = ${JSON.stringify(hit.value)}${
            key === "verifiedUsers" ? " (positive-first)" : " (shallow-first)"
          }`;
  }
  // eslint-disable-next-line no-console
  console.groupCollapsed("[DASHBOARD_SUMMARY_AUDIT]");
  // eslint-disable-next-line no-console
  console.log("1) post-envelope `res` from backendJson(/admin/dashboard/summary)", res);
  // eslint-disable-next-line no-console
  console.log("2) unwrap input (res?.data ?? res)", unwrapInput);
  // eslint-disable-next-line no-console
  console.log("3) inspection layers (outer → inner; stats blobs inlined)", layers);
  // eslint-disable-next-line no-console
  console.log("4) flat KPI picks fed into normalizeSummaryNumbers()", flat);
  // eslint-disable-next-line no-console
  console.log("5) field provenance (per-key pick rule)", provenance);
  // eslint-disable-next-line no-console
  console.log("6) normalized summary → AdminDashboard cards", normalized);
  // eslint-disable-next-line no-console
  console.log("7) DEV legacy adminApi/mock fallback used?", Boolean(usedFallback));
  // eslint-disable-next-line no-console
  console.groupEnd();
}

/**
 * `activeUsers ?? verifiedUsers` fails when backend sends `activeUsers: 0` as a placeholder
 * while `verifiedUsers` holds the real verified/active count — `??` keeps 0.
 * Prefer verified when active is numerically zero but verified is positive.
 */
function resolveDashboardActiveUsers(p) {
  const a = p.activeUsers;
  const v = p.verifiedUsers;
  const hasA = a !== undefined && a !== null && a !== "";
  const hasV = v !== undefined && v !== null && v !== "";
  const numA = hasA ? toFiniteNumber(a, NaN) : NaN;
  const numV = hasV ? toFiniteNumber(v, NaN) : NaN;
  if (!hasA && hasV && Number.isFinite(numV)) return numV;
  if (hasA && Number.isFinite(numA) && numA === 0 && hasV && Number.isFinite(numV) && numV > 0) return numV;
  if (hasA && Number.isFinite(numA)) return numA;
  if (hasV && Number.isFinite(numV)) return numV;
  return 0;
}

function normalizeSummaryNumbers(payload) {
  const p = payload && typeof payload === "object" ? payload : {};
  return {
    totalUsers: toFiniteNumber(p.totalUsers, 0),
    activeUsers: resolveDashboardActiveUsers(p),
    totalApps: toFiniteNumber(p.totalApps, 0),
    openTickets: toFiniteNumber(p.openTickets, 0),
  };
}

async function withRetryOnce(fn, meta) {
  try {
    return await fn();
  } catch (err) {
    console.warn("[adminDashboardApi] request failed (retrying once)", meta, err);
    return await fn();
  }
}

export const adminDashboardApi = {
  async getSummary() {
    try {
      const res = await withRetryOnce(
        () =>
          backendJson("/admin/dashboard/summary", {
            method: "GET",
            suppressGlobalServerErrorToast: true,
          }),
        { endpoint: "/admin/dashboard/summary" },
      );
      const unwrapInput = res?.data ?? res ?? {};
      const layers = collectSummaryInspectionLayers(unwrapInput);
      const flat = buildSummaryFlatFromLayers(layers);
      const normalized = normalizeSummaryNumbers(flat);
      logDashboardSummaryKpiAuditDev({
        res,
        unwrapInput,
        layers,
        flat,
        normalized,
        usedFallback: false,
      });
      return normalized;
    } catch (err) {
      console.warn("[adminDashboardApi] getSummary failed", err);
      if (isAuthError(err)) {
        throw err;
      }
      if (!IS_DEV) throw err;
      if (!isNetworkOrOffline(err)) throw err;
      const fallback = await adminApi.getDashboardData().catch(() => null);
      const raw = fallback?.data?.statsSummary ?? fallback?.statsSummary ?? fallback ?? {};
      const unwrapInput = raw?.data ?? raw ?? {};
      const layers = collectSummaryInspectionLayers(unwrapInput);
      const flat = buildSummaryFlatFromLayers(layers);
      const normalized = normalizeSummaryNumbers(flat);
      logDashboardSummaryKpiAuditDev({
        res: raw,
        unwrapInput,
        layers,
        flat,
        normalized,
        usedFallback: true,
      });
      return normalized;
    }
  },

  async getUserGrowth() {
    try {
      const res = await withRetryOnce(
        () =>
          backendJson("/admin/users/growth", {
            method: "GET",
            suppressGlobalServerErrorToast: true,
          }),
        { endpoint: "/admin/users/growth" },
      );
      return unwrapArray(res);
    } catch (err) {
      console.warn("[adminDashboardApi] getUserGrowth failed", err);
      if (isAuthError(err)) {
        throw err;
      }
      if (!IS_DEV) throw err;
      if (!isNetworkOrOffline(err)) throw err;
      const fallback = await adminApi.getDashboardData().catch(() => null);
      const maybe = fallback?.data?.userGrowth ?? fallback?.userGrowth ?? null;
      return Array.isArray(maybe) ? maybe : IS_DEV ? (mockData?.admin?.userGrowth ?? []) : [];
    }
  },

  async getActivity() {
    try {
      const res = await withRetryOnce(
        () =>
          backendJson("/admin/activity", {
            method: "GET",
            suppressGlobalServerErrorToast: true,
          }),
        { endpoint: "/admin/activity" },
      );
      return unwrapArray(res);
    } catch (err) {
      console.warn("[adminDashboardApi] getActivity failed", err);
      if (isAuthError(err)) {
        throw err;
      }
      if (!IS_DEV) throw err;
      if (!isNetworkOrOffline(err)) throw err;
      const fallback = await adminApi.getDashboardData().catch(() => null);
      const maybe = fallback?.data?.activityFeed ?? fallback?.activityFeed ?? null;
      return Array.isArray(maybe) ? maybe : IS_DEV ? (mockData?.admin?.activityFeed ?? []) : [];
    }
  },

  /**
   * GET /admin/users — paginated/search params passed through when backend supports them.
   * Response may be a bare array or wrapped in `data` / Spring `content` / `items`.
   */
  async listUsers(query = {}) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        qs.set(k, String(v));
      }
    });
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    const res = await backendJson(`/admin/users${suffix}`, {
      method: "GET",
      suppressGlobalServerErrorToast: true,
    });
    if (Array.isArray(res)) return res;
    const data = res?.data ?? res;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.items)) return data.items;
    return unwrapArray(res);
  },

  async getRecentUsers() {
    try {
      const res = await withRetryOnce(
        () =>
          backendJson("/admin/users/recent?limit=5", {
            method: "GET",
            suppressGlobalServerErrorToast: true,
          }),
        { endpoint: "/admin/users/recent?limit=5" },
      );
      return unwrapArray(res);
    } catch (err) {
      console.warn("[adminDashboardApi] getRecentUsers failed", err);
      if (isAuthError(err)) {
        throw err;
      }
      if (!IS_DEV) throw err;
      if (!isNetworkOrOffline(err)) throw err;
      const fallback = await adminApi.getUsers({ limit: 5 }).catch(() => null);
      const items = fallback?.data?.items ?? fallback?.items ?? null;
      return Array.isArray(items) ? items.slice(0, 5) : IS_DEV ? (mockData?.admin?.users?.slice(0, 5) ?? []) : [];
    }
  },

  async getOpenTickets() {
    try {
      const response = await withRetryOnce(
        () =>
          backendJson("/admin/tickets?status=OPEN", {
            method: "GET",
            suppressGlobalServerErrorToast: true,
          }),
        { endpoint: "/admin/tickets?status=OPEN" },
      );
      const parsedTickets = unwrapArray(response);
      return parsedTickets;
    } catch (err) {
      console.warn("[adminDashboardApi] getOpenTickets failed", err);
      if (isAuthError(err)) {
        throw err;
      }
      // Production-safe: never fall back to mock tickets; surface the real error instead.
      throw err;
    }
  },

  /**
   * GET /admin/tickets?status=<STATUS>
   * Supported statuses are backend-defined (OPEN / PENDING / RESOLVED).
   */
  async getTicketsByStatus(status) {
    const st = String(status || "").trim().toUpperCase();
    const qs = new URLSearchParams();
    if (st) qs.set("status", st);
    const endpoint = `/admin/tickets?${qs.toString()}`;
    const res = await backendJson(endpoint, {
      method: "GET",
      suppressGlobalServerErrorToast: true,
    });
    const list = unwrapArray(res);
    return list;
  },

  /** PATCH /admin/tickets/:id — body: { status: "RESOLVED" } */
  async patchTicketStatus(id, status) {
    return backendJson(`/admin/tickets/${id}`, {
      method: "PATCH",
      json: { status: String(status || "").toUpperCase() },
      suppressGlobalServerErrorToast: true,
    });
  },

  async resolveTicket(id) {
    return this.patchTicketStatus(id, "RESOLVED");
  },

  /**
   * Ticket detail for inbox view.
   * Backend already supports: GET /tickets/:id (works for admin too if session has admin role).
   * We intentionally do NOT introduce a new backend dependency or change auth/RBAC flow.
   */
  async getTicketById(id) {
    const tid = encodeURIComponent(String(id));
    const res = await backendJson(`/tickets/${tid}`, {
      method: "GET",
      suppressGlobalServerErrorToast: true,
    });
    return res ?? null;
  },

  /**
   * Reply as admin. Uses POST `/tickets/{ticketId}/reply` (same contract as `ticketsBackend.reply`).
   */
  async replyToTicket(payload) {
    const p = payload && typeof payload === "object" ? payload : {};
    const tid = p.ticketId ?? p.id;
    if (tid == null || String(tid).trim() === "") {
      throw new Error("Reply requires ticketId or id in the payload");
    }
    const path = `/tickets/${encodeURIComponent(String(tid))}/reply`;
    const res = await backendJson(path, {
      method: "POST",
      json: p,
      suppressGlobalServerErrorToast: true,
    });
    return res ?? null;
  },

  // ── KYC (real backend only) ────────────────────────────────────────────────
  async getKycAll() {
    return unwrapArray(
      await backendJson("/admin/kyc/all", {
        method: "GET",
        suppressGlobalServerErrorToast: true,
      }),
    );
  },
  async getKycPending() {
    return unwrapArray(
      await backendJson("/admin/kyc/pending", {
        method: "GET",
        suppressGlobalServerErrorToast: true,
      }),
    );
  },
  async verifyKyc(id) {
    return backendJson(`/admin/kyc/verify/${encodeURIComponent(String(id))}`, {
      method: "PUT",
      json: {},
      suppressGlobalServerErrorToast: true,
    });
  },
  /** Optional rejection context (reason) when backend supports JSON body and/or `?reason=` (Authify). */
  async rejectKyc(id, body = {}) {
    const idEnc = encodeURIComponent(String(id));
    const reasonRaw =
      (typeof body?.reason === "string" && body.reason.trim()) ||
      (typeof body?.rejectionReason === "string" && body.rejectionReason.trim()) ||
      "";
    const qs = reasonRaw ? `?${new URLSearchParams({ reason: reasonRaw }).toString()}` : "";
    return backendJson(`/admin/kyc/reject/${idEnc}${qs}`, {
      method: "PUT",
      json: body && typeof body === "object" ? body : {},
      suppressGlobalServerErrorToast: true,
    });
  },
  /**
   * PATCH status for moderation workflows (REUPLOAD_REQUIRED, UNDER_REVIEW, etc.).
   * Requires backend route `PATCH /admin/kyc/:id/status` — graceful failure if not deployed.
   */
  async patchKycApplicationStatus(id, payload) {
    return backendJson(`/admin/kyc/${encodeURIComponent(String(id))}/status`, {
      method: "PATCH",
      json: payload && typeof payload === "object" ? payload : {},
      suppressGlobalServerErrorToast: true,
    });
  },
  /** Optional detail fetch when backend exposes `GET /admin/kyc/:id`. */
  async getKycDetail(id) {
    return backendJson(`/admin/kyc/${encodeURIComponent(String(id))}`, {
      method: "GET",
      suppressGlobalServerErrorToast: true,
    });
  },

  // ── Admin apps catalog (requires backend routes under `/admin/apps`) ───────
  async listAdminApps(query) {
    return unwrapArray(
      await backendJson("/admin/apps", {
        method: "GET",
        query: query && typeof query === "object" ? query : undefined,
        suppressGlobalServerErrorToast: true,
      }),
    );
  },
  async createAdminApp(body) {
    return backendJson("/admin/apps", {
      method: "POST",
      json: body && typeof body === "object" ? body : {},
      suppressGlobalServerErrorToast: true,
    });
  },
  async updateAdminApp(id, body) {
    return backendJson(`/admin/apps/${encodeURIComponent(String(id))}`, {
      method: "PATCH",
      json: body && typeof body === "object" ? body : {},
      suppressGlobalServerErrorToast: true,
    });
  },
  async deleteAdminApp(id) {
    return backendJson(`/admin/apps/${encodeURIComponent(String(id))}`, {
      method: "DELETE",
      suppressGlobalServerErrorToast: true,
    });
  },
  /**
   * Multipart asset upload. Expected form fields: `logo` and/or `banner` (File parts).
   * Backend: `POST /admin/apps/:id/assets`
   */
  async uploadAdminAppAssets(id, formData) {
    return backendMultipart(`/admin/apps/${encodeURIComponent(String(id))}/assets`, formData, {
      method: "POST",
      suppressGlobalServerErrorToast: true,
    });
  },
};

