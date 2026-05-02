import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useBrand } from "../context/BrandContext";
import { getInitials, useAuth } from "../context/AuthContext";
import { notificationsBackend } from "../services/backendApis";
import { mapNotificationRows } from "../services/notificationUtils";
import { showError, showSuccess } from "../services/toast";

export default function DashboardLayout() {
  const { brand, defaultBrand } = useBrand();
  const { profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const path = location.pathname;
  const initials = getInitials(profile?.name || "User");

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      setNotifLoading(true);
      try {
        const page = await notificationsBackend.list({ page: 0, size: 20 });
        if (!isMounted) return;
        const rows = mapNotificationRows(page);
        setNotifications(rows);
        setUnreadCount(rows.filter((r) => !r.read).length);
      } catch (e) {
        if (!isMounted) return;
        // Keep UI usable; show toast on bell open instead.
      } finally {
        if (isMounted) setNotifLoading(false);
      }
    };

    loadNotifications();

    const poll = window.setInterval(() => {
      notificationsBackend
        .list({ page: 0, size: 20 })
        .then((page) => {
          if (!isMounted) return;
          const rows = mapNotificationRows(page);
          setUnreadCount(rows.filter((r) => !r.read).length);
        })
        .catch(() => {});
    }, 30_000);

    return () => {
      isMounted = false;
      window.clearInterval(poll);
    };
  }, []);

  const handleAvatarClick = () => {
    setShowNotifications(false);
    setShowPopup(!showPopup);
  };

  const handleNotificationClick = () => {
    setShowPopup(false);
    setShowNotifications((prev) => {
      const next = !prev;
      if (next) {
        // refresh list on open (fast)
        setNotifLoading(true);
        notificationsBackend
          .list({ page: 0, size: 20 })
          .then((page) => {
            const rows = mapNotificationRows(page);
            setUnreadCount(rows.filter((r) => !r.read).length);
            setNotifications(rows);
          })
          .catch(() => {})
          .finally(() => setNotifLoading(false));
      }
      return next;
    });
  };

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") {
        setShowNotifications(false);
        setShowPopup(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleNotificationItemClick = async (item) => {
    const id = item?.id;
    if (id != null) {
      setNotifications((prev) =>
        prev.map((row) => (row.id === id ? { ...row, read: true } : row)),
      );
      setUnreadCount((c) => Math.max(0, Number(c) - 1));
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

  const handleMarkAllRead = async () => {
    if (!notifications.some((n) => !n.read)) return;
    try {
      await notificationsBackend.readAll();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
      showSuccess("All caught up");
    } catch (e) {
      showError(e?.message || "Could not mark all as read");
    }
  };

  const handleDeleteNotification = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    const hit = notifications.find((n) => n.id === id);
    const wasUnread = Boolean(hit && !hit.read);
    try {
      await notificationsBackend.deleteById(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) setUnreadCount((c) => Math.max(0, Number(c) - 1));
    } catch (err) {
      showError(err?.message || "Could not remove notification");
    }
  };

  const handleOptionClick = (option) => {
    setShowPopup(false);
    if (option === "My Profile") {
      navigate("/profile");
    } else if (option === "Settings") {
      navigate("/settings");
    } else if (option === "Logout") {
      logout();
      navigate("/login");
    }
  };

  const activeLinkStyle = {
    color: "#1d4ed8",
    fontWeight: 700,
    borderBottom: "2px solid #2563eb",
    paddingBottom: 3,
  };

  const linkStyle = {
    color: "#ffffff",
    textDecoration: "none",
    padding: "0 12px",
    fontWeight: 600,
    fontSize: 14,
  };

  return (
    <div
      className="dashboard-root"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f0f6ff 0%, #e8f0fe 50%, #f0f4ff 100%)",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        .nav-link { transition: all 0.2s ease; border-radius: 6px; padding: 5px 12px !important; }
        .nav-link:hover { background: rgba(255,255,255,0.15) !important; color: #fff !important; }
        .avatar-btn:hover { transform: scale(1.06); box-shadow: 0 0 0 3px rgba(37,99,235,0.25) !important; }
        .notif-btn:hover { background: #f1f5f9 !important; border-color: #94a3b8 !important; }
        .popup-btn:hover { background: #f8fafc !important; color: #2563eb !important; }
        .notif-item:hover { background: #f0f6ff !important; }
        html[data-theme='dark'] .dashboard-root {
          background: linear-gradient(160deg, #0b1220 0%, #0f172a 50%, #111827 100%) !important;
        }
        html[data-theme='dark'] .dashboard-header {
          background: linear-gradient(135deg, #0f172a 0%, #111827 100%) !important;
          border-bottom-color: rgba(96,165,250,0.22) !important;
          box-shadow: 0 2px 20px rgba(2,6,23,0.5) !important;
        }
        html[data-theme='dark'] .dashboard-nav {
          background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%) !important;
        }
        html[data-theme='dark'] .notif-btn {
          background: #0f172a !important;
          border-color: #334155 !important;
          color: #e2e8f0 !important;
        }
        html[data-theme='dark'] .popup-btn,
        html[data-theme='dark'] .notif-item {
          color: #e2e8f0 !important;
          background: #0f172a !important;
          border-bottom-color: #1f2937 !important;
        }
        @media (max-width: 768px) {
          h1 { font-size: 16px !important; }
          button { padding: 6px 8px !important; font-size: 12px !important; }
        }
        @media (max-width: 480px) {
          h1 { font-size: 14px !important; }
          button { padding: 5px 6px !important; font-size: 10px !important; }
        }
      `}</style>
      <header
        className="dashboard-header"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
          borderBottom: "1px solid rgba(37, 99, 235, 0.1)",
          boxShadow: "0 2px 20px rgba(37, 99, 235, 0.08)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(10px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            gap: 12,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: 1,
              minWidth: 0,
            }}
          >
            <img
              src={brand.logoUrl || defaultBrand.logoUrl}
              alt={brand.name}
              onError={(e) => {
                e.currentTarget.src = defaultBrand.logoUrl;
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                objectFit: "contain",
                flexShrink: 0,
              }}
            />
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                background: "linear-gradient(135deg, #1e40af, #2563eb)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                letterSpacing: "-0.3px",
              }}
            >
              {brand.name}
            </h1>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div style={{ position: "relative" }}>
              <button
                className="notif-btn"
                onClick={handleNotificationClick}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "1.5px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#1e293b",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  position: "relative",
                  padding: 0,
                  boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
                  transition: "all 0.2s ease",
                }}
                title="Notifications"
                aria-label="Notifications"
                aria-expanded={showNotifications}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 3C9.24 3 7 5.24 7 8V10.59C7 11.12 6.79 11.64 6.41 12.02L5.29 13.14C4.66 13.77 5.11 14.85 6 14.85H18C18.89 14.85 19.34 13.77 18.71 13.14L17.59 12.02C17.21 11.64 17 11.12 17 10.59V8C17 5.24 14.76 3 12 3Z"
                    stroke="#334155"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M9.5 17C9.92 18.16 10.88 19 12 19C13.12 19 14.08 18.16 14.5 17"
                    stroke="#334155"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -3,
                      right: -3,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 999,
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "grid",
                      placeItems: "center",
                      padding: "0 4px",
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    width: 328,
                    background: "#ffffff",
                    border: "1px solid rgba(37,99,235,0.12)",
                    borderRadius: 16,
                    boxShadow:
                      "0 20px 60px rgba(15, 23, 42, 0.18), 0 4px 16px rgba(37,99,235,0.08)",
                    zIndex: 200,
                    overflow: "hidden",
                  }}
                  role="dialog"
                  aria-label="Notifications"
                >
                  <div
                    style={{
                      padding: "14px 16px",
                      borderBottom: "1px solid #f1f5f9",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                      background: "linear-gradient(135deg, #f8fbff, #ffffff)",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #2563eb, #1d4ed8)",
                          display: "inline-block",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <strong
                          style={{
                            fontSize: 14,
                            color: "#0f172a",
                            fontWeight: 800,
                            display: "block",
                          }}
                        >
                          Notifications
                        </strong>
                        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                          {unreadCount ? `${unreadCount} unread` : "You’re all caught up"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleMarkAllRead()}
                      style={{
                        border: "1px solid #dbeafe",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        fontSize: 11,
                        fontWeight: 750,
                        cursor: "pointer",
                        padding: "6px 10px",
                        borderRadius: 10,
                        flexShrink: 0,
                      }}
                    >
                      Mark all read
                    </button>
                  </div>

                  <div style={{ maxHeight: 280, overflowY: "auto" }}>
                    {notifLoading ? (
                      <div style={{ padding: 14, color: "#64748b", fontWeight: 600 }}>
                        Loading…
                      </div>
                    ) : null}
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        className="notif-item"
                        style={{
                          display: "flex",
                          alignItems: "stretch",
                          borderBottom: "1px solid #f1f5f9",
                          background: item.read ? "#fff" : "#f0f6ff",
                          transition: "background 0.15s",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => void handleNotificationItemClick(item)}
                          style={{
                            flex: 1,
                            border: "none",
                            background: "transparent",
                            textAlign: "left",
                            padding: "12px 10px 12px 16px",
                            cursor: "pointer",
                            display: "grid",
                            gap: 4,
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            {!item.read && (
                              <span
                                style={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: "50%",
                                  background: "#2563eb",
                                  flexShrink: 0,
                                  display: "inline-block",
                                }}
                              />
                            )}
                            <span
                              style={{
                                color: "#0f172a",
                                fontSize: 13,
                                fontWeight: item.read ? 500 : 750,
                                lineHeight: 1.4,
                              }}
                            >
                              {item.text}
                            </span>
                          </div>
                          <small
                            style={{
                              color: "#94a3b8",
                              fontSize: 11,
                              paddingLeft: item.read ? 0 : 15,
                              fontWeight: 600,
                            }}
                          >
                            {item.time}
                          </small>
                        </button>
                        <button
                          type="button"
                          aria-label="Delete notification"
                          title="Delete"
                          onClick={(e) => void handleDeleteNotification(e, item.id)}
                          style={{
                            width: 40,
                            flexShrink: 0,
                            border: "none",
                            borderLeft: "1px solid rgba(148,163,184,0.22)",
                            background: "transparent",
                            color: "#94a3b8",
                            cursor: "pointer",
                            fontSize: 16,
                            fontWeight: 700,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {!notifLoading && notifications.length === 0 ? (
                      <div style={{ padding: 18, color: "#64748b", fontWeight: 650, fontSize: 13 }}>
                        No notifications yet.
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
            <div
              className="avatar-btn"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                position: "relative",
                boxShadow: "0 4px 14px rgba(37,99,235,0.4)",
                transition: "all 0.2s ease",
                letterSpacing: "0.5px",
                userSelect: "none",
              }}
              onClick={handleAvatarClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleAvatarClick();
                }
              }}
              aria-label="User menu"
              aria-expanded={showPopup}
            >
              {initials}
              {showPopup && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    background: "#ffffff",
                    border: "1px solid rgba(37,99,235,0.12)",
                    borderRadius: 14,
                    boxShadow:
                      "0 20px 60px rgba(15,23,42,0.18), 0 4px 16px rgba(37,99,235,0.08)",
                    zIndex: 200,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 200,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "14px 16px 12px",
                      borderBottom: "1px solid #f1f5f9",
                      background: "linear-gradient(135deg, #f8fbff, #ffffff)",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 700,
                        fontSize: 12,
                        marginBottom: 8,
                      }}
                    >
                      {initials}
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: 14,
                      }}
                    >
                      {profile?.name || "User"}
                    </div>
                    <div
                      style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}
                    >
                      {profile?.email || ""}
                    </div>
                  </div>
                  <button
                    className="popup-btn"
                    onClick={() => handleOptionClick("My Profile")}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: "11px 16px",
                      textAlign: "left",
                      cursor: "pointer",
                      borderBottom: "1px solid #f8fafc",
                      color: "#334155",
                      fontSize: 13,
                      fontWeight: 500,
                      transition: "all 0.15s",
                    }}
                  >
                    My Profile
                  </button>
                  <button
                    className="popup-btn"
                    onClick={() => handleOptionClick("Settings")}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: "11px 16px",
                      textAlign: "left",
                      cursor: "pointer",
                      borderBottom: "1px solid #f8fafc",
                      color: "#334155",
                      fontSize: 13,
                      fontWeight: 500,
                      transition: "all 0.15s",
                    }}
                  >
                    Settings
                  </button>
                  <button
                    className="popup-btn"
                    onClick={() => handleOptionClick("Logout")}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: "11px 16px",
                      textAlign: "left",
                      cursor: "pointer",
                      color: "#ef4444",
                      fontSize: 13,
                      fontWeight: 600,
                      transition: "all 0.15s",
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="dashboard-nav"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 20px",
            background: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)",
            color: "#fff",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            overflowX: "auto",
            overflowY: "hidden",
            fontSize: 12,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
            width: "100%",
          }}
        >
          <Link
            to="/dashboard"
            style={
              path === "/" || path === "/dashboard"
                ? {
                    color: "#fff",
                    fontWeight: 700,
                    textDecoration: "none",
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: 6,
                    padding: "6px 14px",
                  }
                : {
                    color: "rgba(255,255,255,0.78)",
                    textDecoration: "none",
                    padding: "6px 14px",
                    borderRadius: 6,
                  }
            }
          >
            My Home
          </Link>
          <Link
            to="/all-apps"
            style={
              path === "/all-apps"
                ? {
                    color: "#fff",
                    fontWeight: 700,
                    textDecoration: "none",
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: 6,
                    padding: "6px 14px",
                  }
                : {
                    color: "rgba(255,255,255,0.78)",
                    textDecoration: "none",
                    padding: "6px 14px",
                    borderRadius: 6,
                  }
            }
          >
            All Apps
          </Link>
          <Link
            to="/my-apps"
            style={
              path === "/my-apps"
                ? {
                    color: "#fff",
                    fontWeight: 700,
                    textDecoration: "none",
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: 6,
                    padding: "6px 14px",
                  }
                : {
                    color: "rgba(255,255,255,0.78)",
                    textDecoration: "none",
                    padding: "6px 14px",
                    borderRadius: 6,
                  }
            }
          >
            My Apps
          </Link>
          <Link
            to="/favorites"
            style={
              path === "/favorites"
                ? {
                    color: "#fff",
                    fontWeight: 700,
                    textDecoration: "none",
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: 6,
                    padding: "6px 14px",
                  }
                : {
                    color: "rgba(255,255,255,0.78)",
                    textDecoration: "none",
                    padding: "6px 14px",
                    borderRadius: 6,
                  }
            }
          >
            Favorites
          </Link>
          <Link
            to="/activity"
            style={{
              color: "rgba(255,255,255,0.75)",
              textDecoration: "none",
              padding: "6px 14px",
              borderRadius: 6,
            }}
          >
            Activity
          </Link>
        </div>
      </header>

      <main
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 18,
          padding: "20px 20px",
        }}
      >
        <section
          style={{
            background: "transparent",
            borderRadius: 16,
            overflow: "visible",
          }}
        >
          <div style={{ padding: 0 }}>
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
}
