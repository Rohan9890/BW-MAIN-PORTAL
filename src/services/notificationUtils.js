/**
 * Normalizes GET /notifications/my paginated and array shapes for UI lists.
 */
export function extractNotificationList(page) {
  if (page == null) return [];
  if (Array.isArray(page)) return page;
  if (Array.isArray(page.content)) return page.content;
  if (Array.isArray(page.items)) return page.items;
  if (Array.isArray(page.data)) return page.data;
  if (Array.isArray(page.records)) return page.records;
  return [];
}

export function resolveNotificationNav(raw) {
  if (!raw || typeof raw !== "object") return null;
  const candidates = [
    raw.link,
    raw.actionUrl,
    raw.deepLink,
    raw.route,
    raw.targetUrl,
    raw.url,
  ];
  for (const c of candidates) {
    const s = String(c || "").trim();
    if (s && s !== "null") return s;
  }
  return null;
}

export function mapNotificationRows(page) {
  const content = extractNotificationList(page);
  return content.map((n) => ({
    id: n.id,
    text: n.title || n.message || n.body || n.text || "Notification",
    time: n.createdAt
      ? new Date(n.createdAt).toLocaleString()
      : n.timestamp
        ? new Date(n.timestamp).toLocaleString()
        : "recent",
    read: Boolean(n.read ?? n.isRead ?? n.readAt),
    navigateTo: resolveNotificationNav(n),
    raw: n,
  }));
}

export function countUnreadInNotificationPage(page) {
  return mapNotificationRows(page).filter((r) => !r.read).length;
}
