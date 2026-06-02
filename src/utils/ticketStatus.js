const CANONICAL = /** @type {const} */ ({
  OPEN: "OPEN",
  PENDING: "PENDING",
  RESOLVED: "RESOLVED",
});

function norm(raw) {
  return String(raw ?? "").trim().toUpperCase();
}

/**
 * Normalize any backend/UI variant into canonical status:
 * `OPEN` | `PENDING` | `RESOLVED`
 *
 * Accepts: Open/open/OPEN, Pending/pending/PENDING, Resolved/resolved/RESOLVED, Closed/CLOSED.
 */
export function normalizeTicketStatus(raw) {
  const v = norm(raw);
  if (!v) return CANONICAL.OPEN;

  if (v === "OPEN" || v === "NEW") return CANONICAL.OPEN;
  if (v === "PENDING" || v === "IN_PROGRESS" || v === "INPROGRESS") return CANONICAL.PENDING;
  if (v === "RESOLVED" || v === "CLOSED" || v === "DONE") return CANONICAL.RESOLVED;

  return CANONICAL.OPEN;
}

export function getTicketStatusLabel(status) {
  const s = normalizeTicketStatus(status);
  if (s === CANONICAL.RESOLVED) return "Resolved";
  if (s === CANONICAL.PENDING) return "Pending";
  return "Open";
}

/**
 * Returns a compact tone token for consistent pills/badges.
 * - open: blue
 * - pending: amber
 * - resolved: green
 */
export function getTicketStatusTone(status) {
  const s = normalizeTicketStatus(status);
  if (s === CANONICAL.RESOLVED) return "success";
  if (s === CANONICAL.PENDING) return "warning";
  return "info";
}

export function getTicketStatusPillStyle(status) {
  const tone = getTicketStatusTone(status);
  if (tone === "success") {
    return { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" };
  }
  if (tone === "warning") {
    return { background: "#fef9c3", color: "#854d0e", border: "1px solid #fde68a" };
  }
  return { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" };
}

