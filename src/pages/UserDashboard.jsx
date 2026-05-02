import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useId,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBrand } from "../context/BrandContext";
import { getGreetingFirstName, getInitials, useAuth } from "../context/AuthContext";
import { dashboardApi } from "../services";
import {
  activityBackend,
  notificationsBackend,
  ticketsBackend,
} from "../services/backendApis";
import { mapNotificationRows } from "../services/notificationUtils";
import { showError, showSuccess } from "../services/toast";
import "./UserDashboard.css";

const DASHBOARD_TXN_PAGE_SIZE = 80;
const DASHBOARD_POLL_MS = 60_000;
const DASHBOARD_AUTOREFRESH_ENABLED =
  import.meta.env.VITE_DASHBOARD_AUTOREFRESH !== "false";
const IS_DEV = import.meta.env.DEV;

// React 18 StrictMode (dev) mounts → runs effects → unmounts → mounts again.
// To avoid duplicate network calls on the initial dashboard entry, we de-dupe
// the *first* load within a short window, but keep refresh/poll behavior intact.
let _dashboardInitialLoadPromise = null;
let _dashboardInitialLoadStartedAt = 0;
const DASHBOARD_INITIAL_DEDUPE_MS = 1200;

async function fetchDashboardInitialBundle() {
  const results = await Promise.allSettled([
    dashboardApi.getSummary(),
    dashboardApi.getTransactions(0, DASHBOARD_TXN_PAGE_SIZE),
    ticketsBackend.my(),
    activityBackend.list({ page: 0, size: 10 }),
  ]);
  return results;
}

function getInitialDashboardBundleDeduped() {
  const now = Date.now();
  if (
    _dashboardInitialLoadPromise &&
    now - _dashboardInitialLoadStartedAt < DASHBOARD_INITIAL_DEDUPE_MS
  ) {
    return _dashboardInitialLoadPromise;
  }
  _dashboardInitialLoadStartedAt = now;
  _dashboardInitialLoadPromise = fetchDashboardInitialBundle().finally(() => {
    // Keep it around briefly for StrictMode remount, then allow real reloads.
    window.setTimeout(() => {
      _dashboardInitialLoadPromise = null;
      _dashboardInitialLoadStartedAt = 0;
    }, DASHBOARD_INITIAL_DEDUPE_MS);
  });
  return _dashboardInitialLoadPromise;
}

const NAV_ITEMS = [
  { label: "Home", path: "/dashboard" },
  { label: "All Apps", path: "/all-apps" },
  { label: "My Apps", path: "/my-apps" },
  { label: "Favorites", path: "/favorites" },
  { label: "Activity", path: "/activity" },
];

/** Placeholder until a “recent apps” API exists */
const RECENT_APPS = [];

const WHATS_NEW = [
  { icon: "📋", text: "New Feature: API usage insights added" },
  { icon: "⚡", text: "Improved dashboard performance for faster loading" },
  { icon: "✅", text: "Bug Fixes: Billing and invoicing issues resolved" },
];

function formatInr(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatTxnAmount(amount, type) {
  const n = Number(amount);
  const mag = Math.abs(Number.isFinite(n) ? n : 0);
  const formatted = formatInr(mag);
  const t = String(type || "").toUpperCase();
  if (t === "DEBIT") return `−${formatted}`;
  if (t === "CREDIT") return `+${formatted}`;
  return formatted;
}

function mapApiTxnStatus(apiStatus) {
  const u = String(apiStatus || "").toUpperCase();
  if (u === "SUCCESS") return "Paid";
  if (u === "FAILED" || u === "FAILURE") return "Failed";
  if (u === "PENDING") return "Pending";
  if (!apiStatus) return "Pending";
  const s = String(apiStatus);
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function formatTxnDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function rejectionMessage(reason, fallback) {
  if (reason && typeof reason === "object" && reason.message) {
    return String(reason.message);
  }
  if (reason instanceof Error) return reason.message;
  return fallback;
}

/**
 * Best-effort total count from tickets list API (shape varies by backend).
 * Returns null if no reliable total was found.
 */
function extractTicketsListTotal(payload) {
  if (payload == null) return null;
  const r = payload?.data !== undefined ? payload.data : payload;

  const candidates = [
    r?.total,
    r?.totalElements,
    r?.totalItems,
    r?.count,
    r?.page?.totalElements,
    r?.meta?.total,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n >= 0) return n;
  }

  if (Array.isArray(r?.content) && typeof r?.totalElements === "number") {
    const n = Number(r.totalElements);
    if (Number.isFinite(n)) return n;
  }

  return null;
}

/** Recent ticket rows from list API (shape varies by backend). */
function extractTicketsListContent(payload) {
  if (payload == null) return [];
  const r = payload?.data !== undefined ? payload.data : payload;
  if (Array.isArray(r)) return r;
  if (Array.isArray(r?.content)) return r.content;
  if (Array.isArray(r?.items)) return r.items;
  if (Array.isArray(r?.records)) return r.records;
  return [];
}

function localDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function ticketActivitySortAt(tk) {
  const raw = tk?.updatedAt ?? tk?.createdAt ?? tk?.date;
  if (!raw) return 0;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : 0;
}

function mapTicketStatusForPill(raw) {
  const u = String(raw || "").toLowerCase();
  if (u === "open") return "Open";
  if (u === "failed") return "Failed";
  if (u === "pending" || u.includes("progress")) return "Pending";
  if (u === "resolved" || u === "closed") return "Paid";
  return "Pending";
}

function mapActivityApiRow(a, idx, pageIndex = 0) {
  const title =
    String(a?.title || a?.event || a?.action || a?.message || a?.description || "").trim() ||
    "Activity";
  const ts = a?.timestamp || a?.createdAt || a?.at || a?.time;
  const sortAt = ts ? new Date(ts).getTime() : 0;
  const time = ts ? formatTxnDate(ts) : "—";
  const type = String(a?.type || a?.category || "update").toLowerCase();
  let status = "info";
  if (type.includes("payment") || type.includes("success")) status = "Paid";
  else if (type.includes("login")) status = "Open";
  else if (type.includes("error") || type.includes("fail")) status = "Failed";
  return {
    key: `srv-act-${a?.id ?? `${pageIndex}-${idx}`}`,
    text: title,
    time,
    status,
    sortAt: Number.isFinite(sortAt) ? sortAt : 0,
  };
}

function normalizeActivityFeedPayload(payload) {
  if (payload == null) return [];
  const r = payload?.data !== undefined ? payload.data : payload;
  if (Array.isArray(r)) return r;
  if (Array.isArray(r?.content)) return r.content;
  if (Array.isArray(r?.items)) return r.items;
  return [];
}

/**
 * Last 7 local days, transaction counts per day from loaded dashboard transactions.
 */
function buildDailyTransactionSeries(transactions, dayCount = 7) {
  const labels = [];
  const keys = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = dayCount - 1; i >= 0; i -= 1) {
    const d = new Date(start);
    d.setDate(d.getDate() - i);
    keys.push(localDateKey(d));
    labels.push(d.toLocaleDateString("en-IN", { weekday: "short" }));
  }
  const counts = keys.map(() => 0);
  let totalHits = 0;
  for (const txn of transactions) {
    const ms = txn.sortAt;
    if (!Number.isFinite(ms) || ms <= 0) continue;
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    const k = localDateKey(d);
    const idx = keys.indexOf(k);
    if (idx >= 0) {
      counts[idx] += 1;
      totalHits += 1;
    }
  }
  const maxCount = Math.max(...counts, 1);
  const span = Math.max(dayCount - 1, 1);
  const xs = counts.map((_, i) => 6 + (i * (348 / span)));
  const ys = counts.map((c) => {
    const t = maxCount <= 0 ? 0 : c / maxCount;
    return 88 - Math.round(t * 72);
  });
  const linePoints = xs.map((x, i) => `${x},${ys[i]}`).join(" ");
  const lastX = xs[xs.length - 1] ?? 6;
  const areaPoints = `${linePoints} ${lastX},100 6,100`;
  const hitPoints = counts.map((count, i) => ({
    x: xs[i],
    y: ys[i],
    count,
    label: labels[i],
    dateKey: keys[i],
  }));
  return {
    labels,
    counts,
    maxCount,
    totalHits,
    linePoints,
    areaPoints,
    hitPoints,
  };
}

function formatChartSlotDate(dateKey) {
  if (!dateKey || typeof dateKey !== "string") return "";
  const d = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function downloadTransactionsCsv(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return;
  const esc = (cell) => {
    const s = String(cell ?? "");
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = ["Title", "DateTime", "Amount", "Status"];
  const lines = [
    header.join(","),
    ...rows.map((t) =>
      [esc(t.id), esc(t.time), esc(t.amount), esc(t.status)].join(","),
    ),
  ];
  const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function formatLastUpdatedLabel(updatedAtMs) {
  if (updatedAtMs == null || !Number.isFinite(updatedAtMs)) return null;
  const sec = Math.max(0, Math.floor((Date.now() - updatedAtMs) / 1000));
  if (sec < 60) {
    const unit = sec === 1 ? "sec" : "secs";
    return `Last updated ${sec} ${unit} ago`;
  }
  const min = Math.floor(sec / 60);
  if (min < 60) {
    const unit = min === 1 ? "min" : "mins";
    return `Last updated ${min} ${unit} ago`;
  }
  const hr = Math.floor(min / 60);
  const unit = hr === 1 ? "hr" : "hrs";
  return `Last updated ${hr} ${unit} ago`;
}

function mapApiTransactionToListItem(row, index = 0) {
  const status = mapApiTxnStatus(row?.status);
  const failed = status === "Failed";
  const title =
    (row?.paymentDescription && String(row.paymentDescription).trim()) ||
    `Transaction #${row?.id ?? ""}`;
  const sortAt = row?.paymentDate
    ? new Date(row.paymentDate).getTime()
    : NaN;
  return {
    rowKey: `${row?.id ?? `idx-${index}`}-${row?.paymentDate ?? ""}`,
    id: title,
    time: formatTxnDate(row?.paymentDate),
    amount: formatTxnAmount(row?.amount, row?.type),
    status,
    sortAt: Number.isFinite(sortAt) ? sortAt : 0,
    iconBg: failed ? "#fff7ed" : "#eff6ff",
    iconColor: failed ? "#f97316" : "#3b82f6",
    _searchExtra: [row?.paymentMethod, row?.paymentSource, row?.type, row?.id]
      .filter(Boolean)
      .join(" "),
  };
}

function InvoiceIcon({ bg, color }) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        background: bg,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M8 7h8M8 11h8M8 15h4" />
      </svg>
    </div>
  );
}

function AppGridIcon({ bg, color }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: bg,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="8" height="8" rx="2" />
        <rect x="13" y="3" width="8" height="8" rx="2" />
        <rect x="3" y="13" width="8" height="8" rx="2" />
        <rect x="13" y="13" width="8" height="8" rx="2" />
      </svg>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="ud-chart-wrap ud-chart-wrap--skeleton" aria-hidden>
      <div className="ud-y-labels ud-y-labels--skeleton">
        <span className="ud-chart-sk-y" />
        <span className="ud-chart-sk-y" />
        <span className="ud-chart-sk-y" />
        <span className="ud-chart-sk-y" />
      </div>
      <div className="ud-chart-body ud-chart-body--skeleton">
        <div className="ud-chart-skeleton-bars">
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={`csk-${i}`}
              className="ud-chart-skeleton-bar"
              style={{ animationDelay: `${i * 0.07}s` }}
            />
          ))}
        </div>
        <div className="ud-x-labels ud-x-labels--skeleton">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={`xsk-${i}`} className="ud-chart-sk-x" />
          ))}
        </div>
      </div>
    </div>
  );
}

function TxnListSkeletonRows({ count = 6 }) {
  return Array.from({ length: count }, (_, i) => (
    <li
      key={`txn-sk-${i}`}
      className="ud-txn-item ud-txn-item--skeleton"
      aria-busy="true"
    >
      <div className="ud-txn-sk-icon" />
      <div className="ud-txn-sk-col">
        <span className="ud-txn-sk-line ud-txn-sk-line--wide" />
        <span className="ud-txn-sk-line ud-txn-sk-line--narrow" />
      </div>
      <div className="ud-txn-sk-side">
        <span className="ud-txn-sk-line ud-txn-sk-line--amt" />
        <span className="ud-txn-sk-pill" />
      </div>
    </li>
  ));
}

function ActivitySkeletonRows({ count = 6 }) {
  return Array.from({ length: count }, (_, i) => (
    <li
      key={`ra-sk-${i}`}
      className="ud-ra-item ud-ra-item--skeleton"
      aria-busy="true"
    >
      <span className="ud-act-dot ud-act-dot--skeleton" />
      <div className="ud-ra-body ud-ra-body--skeleton">
        <span className="ud-ra-sk-line ud-ra-sk-line--long" />
      </div>
      <span className="ud-ra-sk-line ud-ra-sk-line--time" />
    </li>
  ));
}

function AppsGridSkeleton() {
  return Array.from({ length: 4 }, (_, i) => (
    <div
      key={`app-sk-${i}`}
      className="ud-app-entry ud-app-entry--skeleton"
      aria-busy="true"
    >
      <div className="ud-app-sk-icon" />
      <div className="ud-app-sk-meta">
        <span className="ud-app-sk-line ud-app-sk-line--title" />
        <span className="ud-app-sk-line ud-app-sk-line--sub" />
      </div>
      <span className="ud-app-sk-btn" />
    </div>
  ));
}

function UsageChart({ series }) {
  const uid = useId().replace(/:/g, "");
  const gradId = `udGrad-${uid}`;
  const [tipIdx, setTipIdx] = useState(null);
  const { labels, maxCount, linePoints, areaPoints, hitPoints = [] } = series;
  const yTop = maxCount;
  const yMid = Math.max(0, Math.ceil((maxCount * 2) / 3));
  const yLow = Math.max(0, Math.ceil(maxCount / 3));
  const tip = tipIdx != null ? hitPoints[tipIdx] : null;

  return (
    <div
      className="ud-chart-wrap ud-chart-wrap--interactive"
      onMouseLeave={() => setTipIdx(null)}
    >
      <div className="ud-y-labels">
        <span>{yTop}</span>
        <span>{yMid}</span>
        <span>{yLow}</span>
        <span>0</span>
      </div>
      <div className="ud-chart-body">
        <svg
          viewBox="0 0 360 100"
          preserveAspectRatio="none"
          className={`ud-chart-svg${tipIdx != null ? " ud-chart-svg--hover" : ""}`}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill={`url(#${gradId})`} />
          <polyline
            points={linePoints}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ud-chart-line"
          />
          {hitPoints.map((p, i) => (
            <g key={`pt-${p.dateKey}-${i}`}>
              {tipIdx === i ? (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill="#fff"
                  stroke="#2563eb"
                  strokeWidth="2"
                  className="ud-chart-point-ring"
                />
              ) : null}
              <circle
                cx={p.x}
                cy={p.y}
                r="14"
                fill="transparent"
                className="ud-chart-hit"
                onMouseEnter={() => setTipIdx(i)}
                tabIndex={-1}
                aria-hidden
              />
            </g>
          ))}
        </svg>
        {tip ? (
          <div className="ud-chart-tooltip" role="tooltip">
            <span className="ud-chart-tooltip-day">{tip.label}</span>
            <span className="ud-chart-tooltip-date">
              {formatChartSlotDate(tip.dateKey)}
            </span>
            <span className="ud-chart-tooltip-count">
              {tip.count} transaction{tip.count === 1 ? "" : "s"}
            </span>
          </div>
        ) : null}
        <div className="ud-x-labels">
          {labels.map((lab, i) => (
            <span key={`${lab}-${i}`}>{lab}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const [search, setSearch] = useState("");
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [serverActivity, setServerActivity] = useState([]);
  const avatarRef = useRef(null);
  const notifRef = useRef(null);
  const { brand, defaultBrand } = useBrand();
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionsPage, setTransactionsPage] = useState(0);
  const [transactionsTotalPages, setTransactionsTotalPages] = useState(1);
  const [transactionsTotalElements, setTransactionsTotalElements] = useState(0);
  const [transactionsLastPage, setTransactionsLastPage] = useState(true);
  const [transactionsPageLoading, setTransactionsPageLoading] = useState(false);
  const [ticketsListTotal, setTicketsListTotal] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [dashboardRefreshing, setDashboardRefreshing] = useState(true);
  const [initialDashboardLoadDone, setInitialDashboardLoadDone] =
    useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [lastDashboardUpdatedAt, setLastDashboardUpdatedAt] = useState(null);
  const [lastUpdatedTick, setLastUpdatedTick] = useState(0);
  const dashboardRequestIdRef = useRef(0);
  const initialDashboardLoadDoneRef = useRef(false);
  const query = search.trim().toLowerCase();

  const loadDashboardData = useCallback(async (options = {}) => {
    const { silent = false } = options;
    const requestId = ++dashboardRequestIdRef.current;
    const isRefresh = initialDashboardLoadDoneRef.current;
    setDashboardRefreshing(true);
    if (!isRefresh) {
      setTicketsListTotal(null);
      setRecentTickets([]);
      setServerActivity([]);
    }

    const results =
      IS_DEV && !isRefresh
        ? await getInitialDashboardBundleDeduped()
        : await fetchDashboardInitialBundle();

    if (requestId !== dashboardRequestIdRef.current) return;

    const [summaryR, txnR, ticketsR, activityR] = results;
    const errors = [];

    if (summaryR.status === "fulfilled") {
      const body = summaryR.value;
      setSummary(body ?? null);
    } else {
      if (!isRefresh) {
        setSummary(null);
      }
      errors.push(
        rejectionMessage(
          summaryR.reason,
          "Could not load dashboard summary.",
        ),
      );
    }

    if (txnR.status === "fulfilled") {
      const body = txnR.value;
      const page = body;
      const content = Array.isArray(page?.content) ? page.content : [];
      setTransactionsPage(0);
      setTransactionsTotalPages(Number(page?.totalPages) || 1);
      setTransactionsTotalElements(Number(page?.totalElements) || 0);
      setTransactionsLastPage(Boolean(page?.last));
      setTransactions(
        content.map((row, i) => mapApiTransactionToListItem(row, i)),
      );
    } else {
      if (!isRefresh) {
        setTransactions([]);
        setTransactionsPage(0);
        setTransactionsTotalPages(1);
        setTransactionsTotalElements(0);
        setTransactionsLastPage(true);
      }
      errors.push(
        rejectionMessage(txnR.reason, "Could not load transactions."),
      );
    }

    if (ticketsR.status === "fulfilled") {
      const extracted = extractTicketsListTotal(ticketsR.value);
      setTicketsListTotal(extracted);
      setRecentTickets(extractTicketsListContent(ticketsR.value));
    } else {
      if (!isRefresh) {
        setTicketsListTotal(null);
        setRecentTickets([]);
      }
      errors.push(
        rejectionMessage(ticketsR.reason, "Could not load ticket count."),
      );
    }

    if (activityR.status === "fulfilled") {
      const rawList = normalizeActivityFeedPayload(activityR.value);
      setServerActivity(
        rawList.map((row, idx) => mapActivityApiRow(row, idx, 0)),
      );
    } else {
      if (!isRefresh) setServerActivity([]);
      errors.push(
        rejectionMessage(activityR.reason, "Could not load activity feed."),
      );
    }

    if (requestId !== dashboardRequestIdRef.current) return;

    const errorText = errors.filter(Boolean).join(" ");
    setDashboardError(errorText);

    if (isRefresh && !errorText && !silent) {
      showSuccess("Dashboard refreshed");
    }

    if (!errorText) {
      setLastDashboardUpdatedAt(Date.now());
    }

    if (!initialDashboardLoadDoneRef.current) {
      initialDashboardLoadDoneRef.current = true;
      setInitialDashboardLoadDone(true);
    }
    setDashboardRefreshing(false);
  }, []);

  const loadTransactionsPage = useCallback(async (nextPage) => {
    const pageIndex = Math.max(0, Number(nextPage) || 0);
    const requestId = ++dashboardRequestIdRef.current;
    setTransactionsPageLoading(true);
    setDashboardError("");

    try {
      const page = await dashboardApi.getTransactions(
        pageIndex,
        DASHBOARD_TXN_PAGE_SIZE,
      );
      if (requestId !== dashboardRequestIdRef.current) return;
      if (!page) return;
      const content = Array.isArray(page?.content) ? page.content : [];
      setTransactionsPage(pageIndex);
      setTransactionsTotalPages(Number(page?.totalPages) || 1);
      setTransactionsTotalElements(Number(page?.totalElements) || 0);
      setTransactionsLastPage(Boolean(page?.last));
      setTransactions(
        content.map((row, i) => mapApiTransactionToListItem(row, i)),
      );
    } catch (err) {
      if (requestId !== dashboardRequestIdRef.current) return;
      setDashboardError(rejectionMessage(err, "Could not load transactions."));
    } finally {
      if (requestId === dashboardRequestIdRef.current) {
        setTransactionsPageLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    return () => {
      dashboardRequestIdRef.current += 1;
    };
  }, [loadDashboardData]);

  useEffect(() => {
    if (lastDashboardUpdatedAt == null) return undefined;
    const id = window.setInterval(
      () => setLastUpdatedTick((n) => n + 1),
      1000,
    );
    return () => clearInterval(id);
  }, [lastDashboardUpdatedAt]);

  useEffect(() => {
    if (!DASHBOARD_AUTOREFRESH_ENABLED || !initialDashboardLoadDone) {
      return undefined;
    }

    let intervalId = null;

    const clearPoll = () => {
      if (intervalId != null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const startPollIfVisible = () => {
      clearPoll();
      if (document.visibilityState !== "visible") return;
      intervalId = window.setInterval(() => {
        if (document.visibilityState === "visible") {
          loadDashboardData({ silent: true });
        }
      }, DASHBOARD_POLL_MS);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        clearPoll();
      } else {
        startPollIfVisible();
      }
    };

    startPollIfVisible();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearPoll();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [initialDashboardLoadDone, loadDashboardData]);

  const showDashboardSkeleton =
    dashboardRefreshing && !initialDashboardLoadDone;
  const showRetrySpinner =
    dashboardRefreshing && initialDashboardLoadDone;
  const showTxnSkeleton = showDashboardSkeleton || transactionsPageLoading;

  const lastUpdatedLabel = useMemo(
    () => formatLastUpdatedLabel(lastDashboardUpdatedAt),
    [lastDashboardUpdatedAt, lastUpdatedTick],
  );

  const totalApps = Number(summary?.totalApps) || 0;
  const activeSubscriptions = Number(summary?.activeSubscriptions) || 0;
  const totalTransactions = Number(summary?.totalTransactions ?? 0) || 0;
  const referralCount = Number(summary?.referralCount ?? 0) || 0;
  const totalSpent = Number(summary?.totalSpent ?? 0) || 0;
  const kycStatus = String(summary?.kycStatus || "").toUpperCase() || "PENDING";
  const ticketsKpiCount = useMemo(() => {
    if (ticketsListTotal === null || ticketsListTotal === undefined) {
      return null;
    }
    const n = Number(ticketsListTotal);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }, [ticketsListTotal]);

  const txChartSeries = useMemo(
    () => buildDailyTransactionSeries(transactions),
    [transactions],
  );

  const activityItems = useMemo(() => {
    if (Array.isArray(serverActivity) && serverActivity.length > 0) {
      return [...serverActivity].sort((a, b) => b.sortAt - a.sortAt).slice(0, 14);
    }
    const fromTx = transactions.map((txn) => ({
      key: `tx-${txn.rowKey}`,
      text: txn.id,
      time: txn.time,
      status: txn.status,
      sortAt: txn.sortAt || 0,
    }));
    const fromTk = recentTickets.map((tk, i) => {
      const subj = String(tk?.subject || tk?.title || "Ticket").trim();
      const short = subj.length > 72 ? `${subj.slice(0, 72)}…` : subj;
      const st = ticketActivitySortAt(tk);
      return {
        key: `tk-${tk?.id ?? i}-${st}`,
        text: `Ticket · ${short}`,
        time: formatTxnDate(tk?.updatedAt ?? tk?.createdAt ?? tk?.date ?? null),
        status: mapTicketStatusForPill(tk?.status),
        sortAt: st,
      };
    });
    return [...fromTx, ...fromTk]
      .sort((a, b) => b.sortAt - a.sortAt)
      .slice(0, 14);
  }, [serverActivity, transactions, recentTickets]);

  const filteredRecentApps = query
    ? RECENT_APPS.filter((app) =>
        `${app.name} ${app.time}`.toLowerCase().includes(query),
      )
    : RECENT_APPS;

  const filteredTransactions = query
    ? transactions.filter((item) =>
        `${item.id} ${item.time} ${item.amount} ${item.status} ${item._searchExtra || ""}`
          .toLowerCase()
          .includes(query),
      )
    : transactions;

  const filteredActivity = useMemo(() => {
    if (!query) return activityItems;
    return activityItems.filter((item) =>
      `${item.text} ${item.time} ${item.status || ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [activityItems, query]);

  const handleExportTransactionsCsv = useCallback(() => {
    if (filteredTransactions.length === 0) return;
    downloadTransactionsCsv(filteredTransactions);
    showSuccess("CSV exported (visible rows only)");
  }, [filteredTransactions]);

  // Close popups when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setShowAvatarMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  const loadHeaderNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const page = await notificationsBackend.list({ page: 0, size: 20 });
      setNotifications(mapNotificationRows(page));
    } catch {
      // Keep bell usable without noisy toasts on transient failures.
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHeaderNotifications();
  }, [loadHeaderNotifications]);

  const handleUdMarkAllRead = async () => {
    if (!notifications.some((n) => !n.read)) return;
    try {
      await notificationsBackend.readAll();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showSuccess("All caught up");
    } catch (e) {
      showError(e?.message || "Could not mark all as read");
    }
  };

  const handleUdDeleteNotif = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await notificationsBackend.deleteById(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      showError(err?.message || "Could not remove notification");
    }
  };

  const handleUdNotifNavigate = async (item) => {
    const id = item?.id;
    if (id != null) {
      setNotifications((prev) =>
        prev.map((row) => (row.id === id ? { ...row, read: true } : row)),
      );
      try {
        await notificationsBackend.markRead(id);
      } catch (e) {
        showError(e?.message || "Failed to mark as read");
      }
    }
    setShowNotifications(false);
    const target = item?.navigateTo;
    if (target && /^https?:\/\//i.test(target)) {
      window.open(target, "_blank", "noopener,noreferrer");
      return;
    }
    if (target && String(target).startsWith("/")) {
      navigate(target);
      return;
    }
    navigate("/activity");
  };

  return (
    <div className="ud-page">
      {/* ── COMPANY HEADER ── */}
      <header className="ud-header">
        <div className="ud-header-brand">
          <img
            src={brand.logoUrl || defaultBrand.logoUrl}
            alt={brand.name}
            className="ud-header-logo"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <span className="ud-header-name">
            {brand.name || defaultBrand.name}
          </span>
        </div>
        <div className="ud-header-actions">
          {/* Notification Bell */}
          <div className="ud-notif-wrap" ref={notifRef}>
            <button
              className="ud-hbtn ud-notif-btn"
              title="Notifications"
              onClick={() => {
                setShowAvatarMenu(false);
                setShowNotifications((v) => {
                  const next = !v;
                  if (next) void loadHeaderNotifications();
                  return next;
                });
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {notifications.filter((n) => !n.read).length > 0 && (
                <span className="ud-notif-badge">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="ud-notif-popup">
                <div className="ud-notif-popup-header">
                  <span className="ud-notif-popup-title">Notifications</span>
                  {notifications.length > 0 && notifications.some((n) => !n.read) ? (
                    <button
                      type="button"
                      className="ud-notif-mark-all"
                      onClick={() => void handleUdMarkAllRead()}
                      disabled={notifLoading}
                    >
                      Mark all read
                    </button>
                  ) : null}
                </div>
                {notifLoading && notifications.length === 0 ? (
                  <div className="ud-notif-placeholder">
                    <p className="ud-notif-placeholder-title">Loading…</p>
                  </div>
                ) : null}
                {!notifLoading && notifications.length === 0 ? (
                  <div className="ud-notif-placeholder">
                    <p className="ud-notif-placeholder-title">
                      No notifications yet
                    </p>
                    <p className="ud-notif-placeholder-sub">
                      Updates from your account will appear here.
                    </p>
                  </div>
                ) : null}
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`ud-notif-item ud-notif-item--row${
                      notif.read ? " ud-notif-item--read" : ""
                    }`}
                    style={{ display: "flex", alignItems: "stretch" }}
                  >
                    <button
                      type="button"
                      className="ud-notif-main"
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        padding: "10px 8px 10px 12px",
                      }}
                      onClick={() => void handleUdNotifNavigate(notif)}
                    >
                      <span className="ud-notif-dot" />
                      <div className="ud-notif-body">
                        <p className="ud-notif-text">{notif.text}</p>
                        <small className="ud-notif-time">{notif.time}</small>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="ud-notif-dismiss"
                      title="Delete"
                      aria-label="Delete notification"
                      onClick={(e) => void handleUdDeleteNotif(e, notif.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Avatar with popup */}
          <div className="ud-avatar-wrap" ref={avatarRef}>
            <button
              className="ud-header-avatar"
              onClick={() => setShowAvatarMenu((v) => !v)}
              title="Account"
            >
              {getInitials(profile?.name || "User")}
            </button>
            {showAvatarMenu && (
              <div className="ud-avatar-popup">
                <button
                  className="ud-popup-item"
                  onClick={() => {
                    setShowAvatarMenu(false);
                    navigate("/profile");
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
                  </svg>
                  Profile
                </button>
                <button
                  className="ud-popup-item"
                  onClick={() => {
                    setShowAvatarMenu(false);
                    navigate("/settings");
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Settings
                </button>
                <div className="ud-popup-divider" />
                <button
                  className="ud-popup-item ud-popup-logout"
                  onClick={() => {
                    setShowAvatarMenu(false);
                    logout();
                    navigate("/login");
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── BLUE NAVBAR ── */}
      <nav className="ud-navbar">
        <div className="ud-navbar-inner">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`ud-nav-link${location.pathname === item.path ? " ud-nav-active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── DASHBOARD GREETING BAR ── */}
      <div className="ud-top-bar">
        <div className="ud-greeting">
          <h1>
            Good Morning, {getGreetingFirstName(profile) || "there"} 👋
          </h1>
          <p>Here's a quick overview of your account.</p>
          {lastUpdatedLabel ? (
            <p className="ud-dash-last-updated">{lastUpdatedLabel}</p>
          ) : null}
          {dashboardError ? (
            <div className="ud-dash-error-row">
              <p className="ud-empty-state ud-dash-error-text">
                {dashboardError}
              </p>
              <button
                type="button"
                className="ud-btn-outline ud-dash-retry-btn"
                onClick={() => loadDashboardData({ silent: false })}
                disabled={dashboardRefreshing}
              >
                {showRetrySpinner ? (
                  <span className="ud-dash-retry-spinner" aria-hidden />
                ) : null}
                Retry
              </button>
            </div>
          ) : null}
        </div>
        <div className="ud-search-wrap">
          <svg
            className="ud-si"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="ud-search-field"
            placeholder="Search apps, subscriptions, tickets, invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── BODY BENTO GRID ── */}
      <div className="ud-body ud-body--bento">
        <div
          className="ud-stats-strip ud-bento-kpi"
          aria-busy={dashboardRefreshing}
        >
            <button
              className="ud-stat ud-stat-action"
              type="button"
              onClick={() => navigate("/all-apps")}
            >
              <p>
                {showDashboardSkeleton ? (
                  <span className="ud-stat-skeleton-line" />
                ) : (
                  "All Apps"
                )}
              </p>
              <h2>
                {showDashboardSkeleton ? (
                  <span className="ud-stat-skeleton-line ud-stat-skeleton-line--value" />
                ) : (
                  `${totalApps} ${totalApps === 1 ? "App" : "Apps"}`
                )}
              </h2>
            </button>
            <button
              className="ud-stat ud-stat-action"
              type="button"
              onClick={() => navigate("/my-apps")}
            >
              <p>
                {showDashboardSkeleton ? (
                  <span className="ud-stat-skeleton-line ud-stat-skeleton-line--label-wide" />
                ) : (
                  "Active Subscriptions"
                )}
              </p>
              <h2>
                {showDashboardSkeleton ? (
                  <span className="ud-stat-skeleton-line ud-stat-skeleton-line--value" />
                ) : (
                  `${activeSubscriptions} Subscribed`
                )}
              </h2>
            </button>
            <div className="ud-stat">
              <p>
                {showDashboardSkeleton ? (
                  <span className="ud-stat-skeleton-line" />
                ) : (
                  "My Tickets"
                )}
              </p>
              <h2>
                {showDashboardSkeleton ? (
                  <span className="ud-stat-skeleton-line ud-stat-skeleton-line--value" />
                ) : ticketsKpiCount !== null ? (
                  String(ticketsKpiCount)
                ) : (
                  <span
                    className="ud-stat-kpi-na"
                    title="Ticket count unavailable from server"
                  >
                    —
                  </span>
                )}
              </h2>
            </div>
        </div>

        <div
          className="ud-card ud-usage-card ud-bento-chart"
          aria-busy={showDashboardSkeleton}
        >
            <div className="ud-usage-head">
              <h3 className="ud-card-h" style={{ margin: 0 }}>
                Usage Overview
              </h3>
              <div className="ud-usage-pills">
                <span>Last 7 days · from transactions</span>
              </div>
            </div>
            {showDashboardSkeleton ? (
              <ChartSkeleton />
            ) : (
              <UsageChart series={txChartSeries} />
            )}
            <div className="ud-chart-legend">
              <div>
                <span className="ud-ldot ud-ldot-blue" />
                {showDashboardSkeleton
                  ? "Loading chart…"
                  : `${txChartSeries.totalHits} transaction${txChartSeries.totalHits === 1 ? "" : "s"} in window`}
              </div>
              <div>
                <span className="ud-ldot ud-ldot-teal" />
                {`Daily count · up to ${DASHBOARD_TXN_PAGE_SIZE} loaded`}
              </div>
            </div>
          </div>

        <div
          className="ud-card ud-bento-txn"
          aria-busy={showDashboardSkeleton}
        >
            <div className="ud-txn-card-head">
              <h3 className="ud-card-h" style={{ margin: 0 }}>
                Transaction History
              </h3>
              <button
                type="button"
                className="ud-btn-outline ud-txn-export-btn"
                disabled={
                  showDashboardSkeleton || filteredTransactions.length === 0
                }
                onClick={handleExportTransactionsCsv}
              >
                Export CSV
              </button>
            </div>
            <ul className="ud-txn-list ud-bento-txn-list">
              {showTxnSkeleton ? <TxnListSkeletonRows count={6} /> : null}
              {!showDashboardSkeleton && filteredTransactions.length === 0 ? (
                <li className="ud-empty-state ud-empty-state--stack" role="status">
                  <span className="ud-empty-state-title">
                    {query ? "No matching transactions" : "No transactions yet"}
                  </span>
                  <span className="ud-empty-state-sub">
                    {query
                      ? "Try a different search term or clear the field to see all loaded payments."
                      : "When payments post, they will appear here. This list reflects your account only — nothing is fabricated."}
                  </span>
                </li>
              ) : null}
              {!showDashboardSkeleton &&
                filteredTransactions.map((txn) => (
                  <li className="ud-txn-item" key={txn.rowKey}>
                    <InvoiceIcon bg={txn.iconBg} color={txn.iconColor} />
                    <div className="ud-txn-info">
                      <p>{txn.id}</p>
                      <small>{txn.time}</small>
                    </div>
                    <div className="ud-txn-right">
                      <p className={txn.status === "Failed" ? "ud-fail-amt" : ""}>
                        {txn.amount}
                      </p>
                      <span
                        className={`ud-pill ud-pill-${txn.status.toLowerCase()}`}
                      >
                        {txn.status}
                      </span>
                    </div>
                  </li>
                ))}
            </ul>

            {!showDashboardSkeleton && transactionsTotalPages > 1 ? (
              <div className="ud-txn-pagination" role="navigation" aria-label="Transactions pagination">
                <button
                  type="button"
                  className="ud-btn-outline ud-txn-page-btn"
                  onClick={() => loadTransactionsPage(transactionsPage - 1)}
                  disabled={transactionsPageLoading || transactionsPage <= 0}
                >
                  Prev
                </button>
                <div className="ud-txn-page-meta" aria-live="polite">
                  <span className="ud-txn-page-meta-strong">
                    Page {transactionsPage + 1} of {transactionsTotalPages}
                  </span>
                  <span className="ud-txn-page-meta-sub">
                    {transactionsTotalElements} total
                  </span>
                </div>
                <button
                  type="button"
                  className="ud-btn-outline ud-txn-page-btn"
                  onClick={() => loadTransactionsPage(transactionsPage + 1)}
                  disabled={transactionsPageLoading || transactionsLastPage}
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>

        <div className="ud-bento-midrow">
          <div className="ud-bento-midcol ud-bento-midcol--stack">
            <div
              className="ud-card ud-recent-apps-card ud-bento-apps"
              aria-busy={showDashboardSkeleton}
            >
              <h3 className="ud-card-h">Recently Accessed Apps</h3>
              <div className="ud-apps-grid">
                {showDashboardSkeleton ? <AppsGridSkeleton /> : null}
                {!showDashboardSkeleton && filteredRecentApps.length === 0 ? (
                  <p
                    className="ud-empty-state ud-empty-state--stack ud-empty-state--block"
                    role="status"
                  >
                    <span className="ud-empty-state-title">
                      {query ? "No apps match your search" : "No apps to show"}
                    </span>
                    <span className="ud-empty-state-sub">
                      {query
                        ? "Clear the search or try another app name."
                        : "Recently opened apps will list here when available from your workspace."}
                    </span>
                  </p>
                ) : null}
                {!showDashboardSkeleton &&
                  filteredRecentApps.map((app, i) => (
                  <div className="ud-app-entry" key={i}>
                    <AppGridIcon bg={app.iconBg} color={app.iconColor} />
                    <div className="ud-app-meta">
                      <p>{app.name}</p>
                      <small>{app.time}</small>
                    </div>
                    <button
                      className="ud-btn-open"
                      onClick={() => navigate("/all-apps")}
                    >
                      Open
                    </button>
                  </div>
                  ))}
              </div>
            </div>
            <div className="ud-action-strip ud-bento-actions">
              <div className="ud-action-card">
                <h3>Complete KYC</h3>
                <p>Verify your identity for access</p>
                <button
                  className="ud-btn-blue"
                  onClick={() => navigate("/profile")}
                >
                  Start
                </button>
              </div>
              <div className="ud-action-card">
                <h3>Account Settings</h3>
                <p>Manage your account preferences</p>
                <button
                  className="ud-btn-blue"
                  onClick={() => navigate("/settings")}
                >
                  Go to Settings
                </button>
              </div>
            </div>
          </div>

          <div className="ud-bento-midcol ud-bento-midcol--stack">
            <div
              className="ud-card ud-bento-activity"
              aria-busy={showDashboardSkeleton}
            >
              <div className="ud-ra-head">
                <h3 className="ud-card-h" style={{ margin: 0 }}>
                  Recent Activity
                </h3>
                <span className="ud-muted-xs">From GET /activity (falls back to transactions & tickets)</span>
              </div>
              <ul className="ud-ra-list">
                {showDashboardSkeleton ? (
                  <ActivitySkeletonRows count={6} />
                ) : null}
                {!showDashboardSkeleton && filteredActivity.length === 0 ? (
                  <li
                    className="ud-empty-state ud-empty-state--stack"
                    role="status"
                  >
                    <span className="ud-empty-state-title">
                      {query ? "No matching activity" : "No recent activity yet"}
                    </span>
                    <span className="ud-empty-state-sub">
                      {query
                        ? "Broaden your search to include more keywords."
                        : "Payments and tickets from the loaded lists above will surface here automatically."}
                    </span>
                  </li>
                ) : null}
                {!showDashboardSkeleton &&
                  filteredActivity.map((item) => (
                  <li className="ud-ra-item" key={item.key}>
                    <span className="ud-act-dot" />
                    <div className="ud-ra-body">
                      <span>{item.text}</span>
                      {item.status && (
                        <span
                          className={`ud-pill ud-pill-${item.status.toLowerCase()}`}
                        >
                          {item.status}
                        </span>
                      )}
                    </div>
                    <span className="ud-muted-xs" style={{ flexShrink: 0 }}>
                      {item.time}
                    </span>
                  </li>
                  ))}
              </ul>
            </div>

            <div className="ud-card ud-bento-whatsnew">
              <div className="ud-wn-head">
                <div className="ud-wn-title">
                  <h3>What's New</h3>
                  <span className="ud-new-badge">New</span>
                  <span>🚀</span>
                </div>
                <button className="ud-btn-outline">View All Updates</button>
              </div>
              <ul className="ud-wn-list">
                {WHATS_NEW.map((item, i) => (
                  <li key={i}>
                    <span className="ud-wn-ico">{item.icon}</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="ud-card ud-bento-support">
          <h3 className="ud-card-h">Support</h3>
          <p className="ud-support-soon-banner" style={{ marginBottom: 10 }}>
            Get help, track tickets, and share updates with our support team.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="ud-btn-outline"
              onClick={() => navigate("/support/chat")}
            >
              My tickets
            </button>
            <button
              type="button"
              className="ud-btn-primary"
              onClick={() => navigate("/support/ticket")}
            >
              Raise ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
