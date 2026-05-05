/** @param {string} range */
export function usageIntervalForRange(range) {
  return range === "24h" ? "hour" : "day";
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
  if (body == null) return [];
  const r = body?.data !== undefined ? body.data : body;
  const raw = Array.isArray(r)
    ? r
    : Array.isArray(r?.points)
      ? r.points
      : Array.isArray(r?.series)
        ? r.series
        : Array.isArray(r?.buckets)
          ? r.buckets
          : [];
  return raw.map((row, i) => {
    const rawTime =
      row?.bucket ?? row?.time ?? row?.timestamp ?? row?.at ?? row?.date ?? row?.periodStart;
    const rawUsage = row?.usage ?? row?.count ?? row?.value ?? row?.total ?? 0;
    const num = Number(rawUsage);
    const usage = Number.isFinite(num) ? num : 0;
    let timeLabel = String(row?.label ?? "").trim();
    if (!timeLabel && rawTime) {
      timeLabel = formatUsageAxisTime(rawTime, granularity);
    }
    if (!timeLabel) timeLabel = `T${i + 1}`;
    return { timeLabel, usage, rawTime: rawTime != null ? String(rawTime) : `i-${i}` };
  });
}
