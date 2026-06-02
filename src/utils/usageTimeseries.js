import { extractApiArrayAndMeta, peelRepeatedApiEnvelope } from "./apiEnvelope";

/** @param {string} range */
export function usageIntervalForRange(range) {
  return range === "24h" ? "hour" : "day";
}

function pickUsageMetric(row) {
  if (!row || typeof row !== "object") return 0;
  const candidates = [
    row.usage,
    row.usageCount,
    row.usage_count,
    row.count,
    row.value,
    row.total,
    row.opens,
    row.openCount,
    row.hits,
    row.sessions,
    row.metric,
  ];
  for (const c of candidates) {
    const num = Number(c);
    if (Number.isFinite(num)) return num;
  }
  return 0;
}

/** Unwrap GET /dashboard/app-usage-timeseries list shapes (envelope + nested keys). */
function extractUsageTimeseriesPoints(body) {
  if (body == null) return [];
  const primary = extractApiArrayAndMeta(body);
  if (primary.items.length) return primary.items;

  const peeled = peelRepeatedApiEnvelope(body);
  if (peeled && typeof peeled === "object" && !Array.isArray(peeled)) {
    const r = /** @type {Record<string, unknown>} */ (peeled);
    for (const key of [
      "timeseries",
      "timeSeries",
      "analytics",
      "usage",
      "usageData",
      "values",
      "chartData",
      "data",
    ]) {
      if (Array.isArray(r[key])) return r[key];
    }
  }

  const legacy = body?.data !== undefined ? body.data : body;
  if (Array.isArray(legacy)) return legacy;
  if (legacy && typeof legacy === "object") {
    const r = /** @type {Record<string, unknown>} */ (legacy);
    for (const key of ["points", "series", "buckets", "timeseries", "items"]) {
      if (Array.isArray(r[key])) return r[key];
    }
  }
  return [];
}

/**
 * @param {string | number | Date} rawTime
 * @param {"hour" | "day"} granularity
 */
export function formatUsageAxisTime(rawTime, granularity) {
  if (rawTime == null || rawTime === "") return "";
  const d = new Date(rawTime);
  if (Number.isNaN(d.getTime())) return String(rawTime);

  if (granularity === "hour") {
    if (d.getMinutes() === 0 && d.getSeconds() === 0) {
      return d.toLocaleString("en-US", { hour: "numeric", hour12: true });
    }
    return d.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return d.toLocaleString("en-US", { month: "short", day: "numeric" });
}

export function formatUsageCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? "");
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

/** GET /dashboard/app-usage-timeseries — points for Recharts */
export function normalizeUsageTimeseriesPayload(body, granularity = "day") {
  const raw = extractUsageTimeseriesPoints(body);
  if (!raw.length) return [];

  return raw.map((row, i) => {
    const rawTime =
      row?.bucket ??
      row?.time ??
      row?.timestamp ??
      row?.at ??
      row?.date ??
      row?.periodStart ??
      row?.periodEnd ??
      row?.startDate ??
      row?.endDate ??
      row?.day;
    const usage = pickUsageMetric(row);
    let timeLabel = String(row?.label ?? row?.timeLabel ?? "").trim();
    if (!timeLabel && rawTime) {
      timeLabel = formatUsageAxisTime(rawTime, granularity);
    }
    if (!timeLabel) timeLabel = `T${i + 1}`;
    return { timeLabel, usage, rawTime: rawTime != null ? String(rawTime) : `i-${i}` };
  });
}
