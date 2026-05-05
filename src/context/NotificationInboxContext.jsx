import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { notificationsBackend } from "../services/backendApis";
import { invalidateDashboardData } from "../services/dashboardInvalidate";
import { mapNotificationRows } from "../services/notificationUtils";
import { withRetryOnce } from "../services/withRetryOnce";
import { showError, showSuccess } from "../services/toast";

const QUIET = { suppressGlobalServerErrorToast: true };
const INBOX_CACHE_TTL_MS = 45_000;
const POLL_MS = 30_000;

const NotificationInboxContext = createContext(null);

export function NotificationInboxProvider({ children }) {
  const { token } = useAuth();
  const mountedRef = useRef(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");
  const cacheRef = useRef({ at: 0, rows: null });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const computeUnread = useCallback((rows) => rows.filter((r) => !r.read).length, []);

  const refresh = useCallback(
    async (options = {}) => {
      const { force = false, silent = false } = options;
      if (!token) {
        if (!mountedRef.current) return;
        setNotifications([]);
        setUnreadCount(0);
        setError("");
        cacheRef.current = { at: 0, rows: null };
        return;
      }

      const now = Date.now();
      if (
        !force &&
        cacheRef.current.rows &&
        now - cacheRef.current.at < INBOX_CACHE_TTL_MS
      ) {
        if (!mountedRef.current) return;
        setNotifications(cacheRef.current.rows);
        setUnreadCount(computeUnread(cacheRef.current.rows));
        setError("");
        return;
      }

      if (!silent) setLoading(true);
      setError("");
      setRetrying(false);
      try {
        const page = await withRetryOnce(
          () => notificationsBackend.list({ page: 0, size: 20, ...QUIET }),
          { onRetrying: () => {
              if (mountedRef.current) setRetrying(true);
            },
          },
        );
        if (!mountedRef.current) return;
        const rows = mapNotificationRows(page);
        cacheRef.current = { at: Date.now(), rows };
        setNotifications(rows);
        setUnreadCount(computeUnread(rows));
      } catch (e) {
        if (!mountedRef.current) return;
        const msg = e?.message || "Could not load notifications.";
        setError(msg);
        if (!cacheRef.current.rows?.length) {
          setNotifications([]);
          setUnreadCount(0);
        }
      } finally {
        if (mountedRef.current) {
          setRetrying(false);
          setLoading(false);
        }
      }
    },
    [token, computeUnread],
  );

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      setError("");
      cacheRef.current = { at: 0, rows: null };
      return undefined;
    }
    void refresh({ silent: true });
    return undefined;
  }, [token, refresh]);

  useEffect(() => {
    if (!token) return undefined;
    let intervalId = null;
    const tick = () => {
      if (document.visibilityState === "visible") {
        void refresh({ silent: true, force: true });
      }
    };
    const stop = () => {
      if (intervalId != null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };
    const start = () => {
      stop();
      if (document.visibilityState !== "visible") return;
      intervalId = window.setInterval(tick, POLL_MS);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") stop();
      else start();
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [token, refresh]);

  const markOneRead = useCallback(
    async (id) => {
      if (id == null) return;
      let wasUnread = false;
      setNotifications((prev) => {
        wasUnread = prev.some((row) => row.id === id && !row.read);
        return prev.map((row) => (row.id === id ? { ...row, read: true } : row));
      });
      if (wasUnread) setUnreadCount((c) => Math.max(0, Number(c) - 1));
      try {
        await notificationsBackend.markRead(id);
        invalidateDashboardData("notification-mark-read");
      } catch (e) {
        showError(e?.message || "Failed to mark as read");
        void refresh({ force: true, silent: true });
      }
    },
    [refresh],
  );

  const deleteOne = useCallback(
    async (id) => {
      let wasUnread = false;
      setNotifications((prev) => {
        const hit = prev.find((n) => n.id === id);
        wasUnread = Boolean(hit && !hit.read);
        return prev.filter((n) => n.id !== id);
      });
      if (wasUnread) setUnreadCount((c) => Math.max(0, Number(c) - 1));
      try {
        await notificationsBackend.deleteById(id);
        invalidateDashboardData("notification-delete");
      } catch (err) {
        showError(err?.message || "Could not remove notification");
        void refresh({ force: true, silent: true });
      }
    },
    [refresh],
  );

  const markAllRead = useCallback(async () => {
    if (!notifications.some((n) => !n.read)) return;
    try {
      await notificationsBackend.readAll();
      setNotifications((prev) => {
        const next = prev.map((item) => ({ ...item, read: true }));
        cacheRef.current = { at: Date.now(), rows: next };
        return next;
      });
      setUnreadCount(0);
      invalidateDashboardData("notification-read-all");
      showSuccess("All caught up");
    } catch (e) {
      showError(e?.message || "Could not mark all as read");
    }
  }, [notifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      retrying,
      error,
      refresh,
      markOneRead,
      deleteOne,
      markAllRead,
    }),
    [
      notifications,
      unreadCount,
      loading,
      retrying,
      error,
      refresh,
      markOneRead,
      deleteOne,
      markAllRead,
    ],
  );

  return (
    <NotificationInboxContext.Provider value={value}>
      {children}
    </NotificationInboxContext.Provider>
  );
}

export function useNotificationInbox() {
  const ctx = useContext(NotificationInboxContext);
  if (!ctx) {
    throw new Error("useNotificationInbox must be used within NotificationInboxProvider");
  }
  return ctx;
}
