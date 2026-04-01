import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../services";
import { mockData } from "../services/mockData";
import { showSuccess, showError } from "../services/toast";

// ── Default fallbacks sourced from centralised mock data ──────────────────────
const DEFAULT_STATS = mockData.admin.stats;
const DEFAULT_APPS = mockData.admin.apps;
const DEFAULT_PAYMENTS = mockData.admin.payments;
const DEFAULT_TICKETS = mockData.admin.tickets;
const DEFAULT_ACTIVITY_FEED = mockData.admin.activityFeed;
const DEFAULT_USER_GROWTH = mockData.admin.userGrowth;
const DEFAULT_USERS = mockData.admin.users;

// ── Pure helper utilities ─────────────────────────────────────────────────────

export function normalizeTicketItem(ticket, index = 0) {
  const subject = ticket.subject || ticket.title || "Untitled Ticket";
  return {
    id: ticket.id || `TK-${index + 1}`,
    userName: ticket.userName || ticket.user || "Unknown User",
    userEmail: ticket.userEmail || "user@example.com",
    subject,
    description: ticket.description || subject,
    status: ["Open", "Pending", "Resolved"].includes(ticket.status)
      ? ticket.status
      : ticket.status === "New"
        ? "Open"
        : "Pending",
    priority: ["Low", "Medium", "High"].includes(ticket.priority)
      ? ticket.priority
      : "Medium",
    date: ticket.date || new Date().toISOString().slice(0, 10),
    conversation: Array.isArray(ticket.conversation) ? ticket.conversation : [],
  };
}

function normalizeApp(item, index) {
  return {
    id: item.id || `${item.name || "app"}-${index}`,
    name: item.name || "Untitled App",
    description:
      item.description ||
      `${item.category || "General"}${item.owner ? ` • ${item.owner}` : ""}`,
    logoUrl: item.logoUrl || "",
    status: item.status || (item.health === "Healthy" ? "Active" : "Draft"),
  };
}

function buildKycFromUsers(users, prevStatusMap = new Map()) {
  return users
    .filter((user) => user.role === "User")
    .map((user, index) => ({
      id: `KYC-${2200 + index}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      submittedAt: user.joinedOn,
      documentType: index % 2 === 0 ? "Aadhaar" : "PAN",
      status: prevStatusMap.get(user.id) || "Pending",
    }));
}

function buildInitialNotifications(feed) {
  return feed.map((item, index) => ({
    id: `${item.time}-${index}`,
    title: item.event,
    meta: item.meta,
    time: item.time,
    read: index > 1,
  }));
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useAdminDashboard
 *
 * Owns all server state for the admin dashboard:
 *   - Initial data fetch (dashboard overview, users, tickets)
 *   - Derived state that reflects server data (kycRequests, notificationItems, uploadedApps)
 *   - Computed aggregate stats (userCountStats, kycStats, ticketStats)
 *   - All mutation handlers that call the API then update local state optimistically
 *
 * The component layer receives this data and is responsible only for:
 *   - UI-only state (search text, filter selects, pagination, open modals)
 *   - Filtered / paginated views derived from data + UI state
 *   - Event wiring between user interactions and these handlers
 */
export function useAdminDashboard() {
  // ── Loading / error state ──────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Server state ─────────────────────────────────────────────────────────────
  const [adminStats, setAdminStats] = useState(DEFAULT_STATS);
  const [apps, setApps] = useState(DEFAULT_APPS);
  const [payments, setPayments] = useState(DEFAULT_PAYMENTS);
  const [tickets, setTickets] = useState(() =>
    DEFAULT_TICKETS.map(normalizeTicketItem),
  );
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [activityFeed, setActivityFeed] = useState(DEFAULT_ACTIVITY_FEED);
  const [userGrowth, setUserGrowth] = useState(DEFAULT_USER_GROWTH);
  const [users, setUsers] = useState(DEFAULT_USERS);

  // ── Derived server state ──────────────────────────────────────────────────────
  const [uploadedApps, setUploadedApps] = useState([]);
  const [appsInitialized, setAppsInitialized] = useState(false);
  const [kycRequests, setKycRequests] = useState(() =>
    buildKycFromUsers(DEFAULT_USERS),
  );
  const [notificationItems, setNotificationItems] = useState(() =>
    buildInitialNotifications(DEFAULT_ACTIVITY_FEED),
  );

  // ── Initial data fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function loadAdminData() {
      setLoading(true);
      setError(null);

      try {
        const [dashboardData, usersData, ticketsData] = await Promise.all([
          adminApi.getDashboardData(),
          adminApi.getUsers(),
          adminApi.getTickets(),
        ]);

        if (!isMounted) return;

        if (dashboardData?.stats) setAdminStats(dashboardData.stats);
        if (dashboardData?.apps) setApps(dashboardData.apps);
        if (dashboardData?.payments) setPayments(dashboardData.payments);
        if (dashboardData?.activityFeed)
          setActivityFeed(dashboardData.activityFeed);
        if (dashboardData?.userGrowth) setUserGrowth(dashboardData.userGrowth);

        const ticketsFromDashboard = Array.isArray(dashboardData?.tickets)
          ? dashboardData.tickets
          : [];
        const ticketsFromApi = Array.isArray(ticketsData?.items)
          ? ticketsData.items
          : [];
        const effectiveTickets =
          ticketsFromApi.length > 0 ? ticketsFromApi : ticketsFromDashboard;
        if (effectiveTickets.length) {
          setTickets(effectiveTickets.map(normalizeTicketItem));
        }

        const fetchedUsers = Array.isArray(usersData?.items)
          ? usersData.items
          : null;
        if (fetchedUsers && fetchedUsers.length) {
          setUsers(fetchedUsers);
        }
      } catch (err) {
        console.error("AdminDashboard error:", err);
        if (isMounted) {
          setError(err?.message || "Something went wrong");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          if (typeof setTicketsLoading === "function") {
            setTicketsLoading(false);
          }
        }
      }
    }

    loadAdminData();
    return () => {
      isMounted = false;
    };
  }, []);

  // ── Sync uploadedApps from apps once after initial fetch ─────────────────────
  const normalizedApps = useMemo(() => apps.map(normalizeApp), [apps]);

  useEffect(() => {
    if (!appsInitialized && normalizedApps.length) {
      setUploadedApps(normalizedApps);
      setAppsInitialized(true);
    }
  }, [appsInitialized, normalizedApps]);

  // ── Sync kycRequests whenever users list changes ──────────────────────────────
  useEffect(() => {
    setKycRequests((prev) => {
      const statusByUserId = new Map(
        prev.map((request) => [request.userId, request.status]),
      );
      return buildKycFromUsers(users, statusByUserId);
    });
  }, [users]);

  // ── Sync notificationItems whenever activityFeed changes ─────────────────────
  useEffect(() => {
    setNotificationItems((prev) =>
      activityFeed.map((item, index) => {
        const id = `${item.time}-${index}`;
        const existing = prev.find((entry) => entry.id === id);
        return {
          id,
          title: item.event,
          meta: item.meta,
          time: item.time,
          read: existing ? existing.read : index > 1,
        };
      }),
    );
  }, [activityFeed]);

  // ── Computed aggregate stats ──────────────────────────────────────────────────
  const userCountStats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.status === "Active").length,
      inactive: users.filter((u) => u.status === "Inactive").length,
      pending: users.filter((u) => u.status === "Pending").length,
    }),
    [users],
  );

  const kycStats = useMemo(
    () => ({
      total: kycRequests.length,
      pending: kycRequests.filter((r) => r.status === "Pending").length,
      approved: kycRequests.filter((r) => r.status === "Approved").length,
      rejected: kycRequests.filter((r) => r.status === "Rejected").length,
      needInfo: kycRequests.filter((r) => r.status === "Need Info").length,
    }),
    [kycRequests],
  );

  const ticketStats = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((t) => t.status === "Open").length,
      pending: tickets.filter((t) => t.status === "Pending").length,
      resolved: tickets.filter((t) => t.status === "Resolved").length,
    }),
    [tickets],
  );

  // ── Mutation handlers ─────────────────────────────────────────────────────────

  const updateUserStatus = async (userId) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const nextStatus = target.status === "Active" ? "Inactive" : "Active";
    try {
      await adminApi.updateUserStatus(userId, nextStatus);
      setUsers((prev) =>
        prev.map((u) =>
          u.id !== userId
            ? u
            : { ...u, status: nextStatus, isActive: nextStatus === "Active" },
        ),
      );
      showSuccess("User status updated successfully");
    } catch (err) {
      showError(err?.message || "Failed to update user status");
    }
  };

  /**
   * Fetches users from the API for CSV export.
   * Returns the array on success, or null so the caller can fall back to local data.
   */
  const fetchExportUsers = async (params) => {
    const rows = await adminApi.exportUsers(params);
    return Array.isArray(rows) && rows.length ? rows : null;
  };

  const updateKycStatus = async (requestId, nextStatus) => {
    try {
      await adminApi.updateKycStatus(requestId, nextStatus);
      setKycRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: nextStatus } : r,
        ),
      );
      showSuccess("KYC status updated successfully");
    } catch (err) {
      showError(err?.message || "Failed to update KYC status");
    }
  };

  const updateTicketStatus = async (ticketId, nextStatus) => {
    try {
      await adminApi.updateTicketStatus(ticketId, nextStatus);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: nextStatus } : t)),
      );
      showSuccess("Ticket status updated successfully");
    } catch (err) {
      showError(err?.message || "Failed to update ticket status");
    }
  };

  /**
   * Appends an admin reply to the ticket's conversation both locally and via the API.
   * @param {object} ticket - The full ticket object.
   * @param {string} message - Plain text reply content.
   */
  const sendTicketReply = async (ticket, message) => {
    const newMessage = {
      id: `admin-${Date.now()}`,
      sender: "admin",
      text: message,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    try {
      await adminApi.addTicketReply(ticket.id, newMessage);
      setTickets((prev) =>
        prev.map((t) =>
          t.id !== ticket.id
            ? t
            : { ...t, conversation: [...t.conversation, newMessage] },
        ),
      );
      showSuccess("Reply sent successfully");
    } catch (err) {
      showError(err?.message || "Failed to send reply");
    }
  };

  const createApp = async (payload) => {
    const newApp = {
      id: `APP-${Date.now()}`,
      name: payload.name,
      description: payload.description,
      logoUrl: payload.logoUrl,
      status: "Active",
    };
    try {
      await adminApi.createApp(newApp);
      setUploadedApps((prev) => [newApp, ...prev]);
      showSuccess("App created successfully");
    } catch (err) {
      showError(err?.message || "Failed to create app");
    }
  };

  const updateApp = async (appId, payload) => {
    try {
      await adminApi.updateApp(appId, payload);
      setUploadedApps((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, ...payload } : a)),
      );
      showSuccess("App updated successfully");
    } catch (err) {
      showError(err?.message || "Failed to update app");
    }
  };

  const deleteApp = async (appId) => {
    try {
      await adminApi.deleteApp(appId);
      setUploadedApps((prev) => prev.filter((a) => a.id !== appId));
      showSuccess("App deleted successfully");
    } catch (err) {
      showError(err?.message || "Failed to delete app");
    }
  };

  const markNotificationRead = (id) => {
    setNotificationItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  };

  const markAllNotificationsRead = () => {
    setNotificationItems((prev) =>
      prev.map((item) => ({ ...item, read: true })),
    );
  };

  // ── Public API ────────────────────────────────────────────────────────────────
  return {
    // Loading / error
    loading,
    error,

    // Server state
    adminStats,
    payments,
    tickets,
    ticketsLoading,
    activityFeed,
    userGrowth,
    users,
    uploadedApps,
    kycRequests,
    notificationItems,

    // Computed stats
    userCountStats,
    kycStats,
    ticketStats,

    // Mutations
    updateUserStatus,
    fetchExportUsers,
    updateKycStatus,
    updateTicketStatus,
    sendTicketReply,
    createApp,
    updateApp,
    deleteApp,
    markNotificationRead,
    markAllNotificationsRead,
  };
}
