import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const path = location.pathname;

  const handleAvatarClick = () => {
    setShowPopup(!showPopup);
  };

  const handleOptionClick = (option) => {
    setShowPopup(false);
    if (option === "My Profile") {
      navigate("/profile");
    } else if (option === "Settings") {
      navigate("/settings");
    } else if (option === "Billing / Subscription") {
      navigate("/billing");
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
    <div style={{ minHeight: "100vh", background: "#eaf3ff" }}>
      <style>{`
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
        style={{
          backgroundColor: "#f8fcff",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
            }}
          >
            <img
              src="/logo.png"
              alt="Company logo"
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
                fontSize: 22,
                color: "#0f172a",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Bold and Wise
            </h1>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <button
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Upgrade Plan
            </button>
            <button
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Upload
            </button>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "#2563eb",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                cursor: "pointer",
                position: "relative",
              }}
              onClick={handleAvatarClick}
            >
              JK
              {showPopup && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    background: "white",
                    border: "1px solid #ccc",
                    borderRadius: 8,
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    zIndex: 10,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 150,
                  }}
                >
                  <button
                    onClick={() => handleOptionClick("My Profile")}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "10px 15px",
                      textAlign: "left",
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    My Profile
                  </button>
                  <button
                    onClick={() => handleOptionClick("Settings")}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "10px 15px",
                      textAlign: "left",
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => handleOptionClick("Billing / Subscription")}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "10px 15px",
                      textAlign: "left",
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    Billing / Subscription
                  </button>
                  <button
                    onClick={() => handleOptionClick("Logout")}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "10px 15px",
                      textAlign: "left",
                      cursor: "pointer",
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
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 16px",
            background: "#1d4ed8",
            color: "#fff",
            borderTop: "1px solid #2563eb",
            overflowX: "auto",
            overflowY: "hidden",
            fontSize: 13,
          }}
        >
          <Link
            to="/dashboard"
            style={
              path === "/" || path === "/dashboard"
                ? {
                    color: "#fff",
                    fontWeight: 700,
                    textDecoration: "underline",
                  }
                : { color: "#dbeafe", textDecoration: "none" }
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
                    textDecoration: "underline",
                  }
                : { color: "#dbeafe", textDecoration: "none" }
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
                    textDecoration: "underline",
                  }
                : { color: "#dbeafe", textDecoration: "none" }
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
                    textDecoration: "underline",
                  }
                : { color: "#dbeafe", textDecoration: "none" }
            }
          >
            Favorites
          </Link>
          <Link
            to="/activity"
            style={{ color: "#dbeafe", textDecoration: "none" }}
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
          padding: "18px 16px",
        }}
      >
        <section
          style={{
            background: "#f8fcff",
            borderRadius: 14,
            boxShadow: "0 5px 20px rgba(15, 23, 42,0.05)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: 14 }}>
            <Outlet />
          </div>
        </section>

      </main>
    </div>
  );
}

