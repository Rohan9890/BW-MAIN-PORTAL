import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useBrand } from "../context/BrandContext";
import { dashboardApi } from "../services";

export default function DashboardLayout() {
  const { brand, defaultBrand } = useBrand();
  const location = useLocation();
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const path = location.pathname;
  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      const activities = await dashboardApi.getActivitySummary();
      if (!isMounted) return;

      const mapped = Array.isArray(activities)
        ? activities.slice(0, 5).map((item, index) => ({
            id: item.id || index + 1,
            text: item.title,
            time: item.timestamp || "recent",
            read: index > 1,
          }))
        : [];

      setNotifications(mapped);
    };

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAvatarClick = () => {
    setShowNotifications(false);
    setShowPopup(!showPopup);
  };

  const handleNotificationClick = () => {
    setShowPopup(false);
    setShowNotifications((prev) => !prev);
  };

  const handleNotificationItemClick = (id) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
    setShowNotifications(false);
    navigate("/activity");
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleOptionClick = (option) => {
    setShowPopup(false);
    if (option === "My Profile") {
      navigate("/profile");
    } else if (option === "Settings") {
      navigate("/settings");
    } else if (option === "Logout") {
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
                    width: 300,
                    background: "#ffffff",
                    border: "1px solid rgba(37,99,235,0.12)",
                    borderRadius: 14,
                    boxShadow:
                      "0 20px 60px rgba(15, 23, 42, 0.18), 0 4px 16px rgba(37,99,235,0.08)",
                    zIndex: 200,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "14px 16px",
                      borderBottom: "1px solid #f1f5f9",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "linear-gradient(135deg, #f8fbff, #ffffff)",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #2563eb, #1d4ed8)",
                          display: "inline-block",
                        }}
                      />
                      <strong
                        style={{
                          fontSize: 14,
                          color: "#0f172a",
                          fontWeight: 700,
                        }}
                      >
                        Notifications
                      </strong>
                    </div>
                    <button
                      onClick={handleMarkAllRead}
                      style={{
                        border: "1px solid #dbeafe",
                        background: "#eff6ff",
                        color: "#2563eb",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: "3px 10px",
                        borderRadius: 6,
                      }}
                    >
                      Mark all read
                    </button>
                  </div>

                  <div style={{ maxHeight: 220, overflowY: "auto" }}>
                    {notifications.map((item) => (
                      <button
                        key={item.id}
                        className="notif-item"
                        onClick={() => handleNotificationItemClick(item.id)}
                        style={{
                          width: "100%",
                          border: "none",
                          background: item.read ? "#fff" : "#f0f6ff",
                          borderBottom: "1px solid #f1f5f9",
                          textAlign: "left",
                          padding: "12px 16px",
                          cursor: "pointer",
                          display: "grid",
                          gap: 4,
                          transition: "background 0.15s",
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
                              fontWeight: item.read ? 500 : 700,
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
                          }}
                        >
                          {item.time}
                        </small>
                      </button>
                    ))}
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
            >
              JK
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
                      JK
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: 14,
                      }}
                    >
                      Rohan Kumar
                    </div>
                    <div
                      style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}
                    >
                      rohan@example.com
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
