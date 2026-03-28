import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showKYCAlert, setShowKYCAlert] = useState(false);

  // Mock data
  const stats = [
    { label: "Active Apps", value: 5, icon: "⚙️" },
    { label: "Active Subscriptions", value: 3, icon: "📊" },
    { label: "My Tickets", value: 8, icon: "🎫" },
  ];

  const usageData = [
    { date: "Mon", usage: 40 },
    { date: "Tue", usage: 65 },
    { date: "Wed", usage: 45 },
    { date: "Thu", usage: 80 },
    { date: "Fri", usage: 55 },
    { date: "Sat", usage: 70 },
    { date: "Sun", usage: 50 },
  ];

  const transactions = [
    { id: 1, type: "Subscription", amount: 49.99, date: "2024-05-15", status: "Completed" },
    { id: 2, type: "One-time Payment", amount: 99.99, date: "2024-05-12", status: "Completed" },
    { id: 3, type: "Refund", amount: -29.99, date: "2024-05-10", status: "Completed" },
    { id: 4, type: "Subscription", amount: 49.99, date: "2024-05-08", status: "Pending" },
  ];

  const whatsnew = [
    { title: "API Insights", desc: "Get deeper insights into your API usage patterns" },
    { title: "Performance Improvements", desc: "20% faster dashboard loading times" },
    { title: "Bug Fixes", desc: "Fixed critical issues with payment processing" },
  ];

  const recentApps = [
    { id: 1, name: "Charge Management", icon: "💳" },
    { id: 2, name: "Analytics", icon: "📈" },
    { id: 3, name: "User Management", icon: "👥" },
    { id: 4, name: "Reports", icon: "📄" },
    { id: 5, name: "Settings", icon: "⚙️" },
    { id: 6, name: "Support", icon: "🆘" },
  ];

  const activities = [
    { id: 1, action: "Subscribed to Charge Management", time: "2 hours ago", status: "Success" },
    { id: 2, action: "Updated API keys", time: "5 hours ago", status: "Success" },
    { id: 3, action: "Attempted payment", time: "1 day ago", status: "Failed" },
    { id: 4, action: "Completed KYC verification", time: "2 days ago", status: "Success" },
  ];

  const handleOpenApp = (appName) => {
    alert(`Opening ${appName}...`);
  };

  const handleCompleteKYC = () => {
    setShowKYCAlert(true);
    setTimeout(() => setShowKYCAlert(false), 3000);
  };

  const handleChatSupport = () => {
    alert("Chat support coming soon! For now, please contact support@boldandwise.com");
  };

  const handleRaiseTicket = () => {
    alert("Redirecting to support ticket form...");
  };

  const maxUsage = Math.max(...usageData.map(d => d.usage));
  
  const getStatusColor = (status) => {
    if (status === "Success") return "#10b981";
    if (status === "Failed") return "#ef4444";
    return "#f59e0b";
  };

  const getStatusDot = (status) => {
    const colors = {
      Success: "#10b981",
      Failed: "#ef4444",
      Pending: "#f59e0b",
      Completed: "#10b981",
    };
    return colors[status] || "#64748b";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .apps-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .actions-grid { grid-template-columns: 1fr !important; }
          .whatsnew-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .apps-grid { grid-template-columns: 1fr !important; }
          .search-input { font-size: 14px !important; }
        }
      `}</style>

      {showKYCAlert && (
        <div style={{
          background: "#d1fae5",
          border: "1px solid #6ee7b7",
          borderRadius: 8,
          padding: 12,
          color: "#065f46",
          fontSize: 14,
        }}>
          ✓ KYC document submitted successfully. Verification in progress...
        </div>
      )}

      {/* Search Bar */}
      <div style={{
        display: "flex",
        gap: 8,
      }}>
        <input
          type="text"
          placeholder="Search apps, subscriptions, tickets, invoices..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 14px",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            fontSize: 14,
            color: "#0f172a",
          }}
        />
        <button style={{
          padding: "10px 16px",
          backgroundColor: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 600,
        }}>
          Search
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 14,
      }}>
        {stats.map((stat, idx) => (
          <div key={idx} style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 16,
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
            <p style={{ fontSize: 28, fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>
              {stat.value}
            </p>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="actions-grid" style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 14,
      }}>
        <button onClick={handleCompleteKYC} style={{
          background: "#fff",
          border: "2px solid #fbbf24",
          borderRadius: 12,
          padding: 16,
          cursor: "pointer",
          textAlign: "left",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => e.target.style.background = "#fffbeb"}
        onMouseLeave={(e) => e.target.style.background = "#fff"}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
          <p style={{ margin: "0 0 4px", color: "#0f172a", fontWeight: 700 }}>Complete KYC</p>
          <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Verify your account to unlock all features</p>
        </button>
        <button onClick={() => navigate("/settings")} style={{
          background: "#fff",
          border: "2px solid #a5f3fc",
          borderRadius: 12,
          padding: 16,
          cursor: "pointer",
          textAlign: "left",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => e.target.style.background = "#ecf9ff"}
        onMouseLeave={(e) => e.target.style.background = "#fff"}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>⚙️</div>
          <p style={{ margin: "0 0 4px", color: "#0f172a", fontWeight: 700 }}>Account Settings</p>
          <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Manage your account preferences</p>
        </button>
      </div>

      {/* Usage Overview Chart */}
      <div style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
      }}>
        <h3 style={{ margin: "0 0 14px", color: "#0f172a", fontSize: 16, fontWeight: 700 }}>
          Usage Overview 📊
        </h3>
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          height: 120,
          paddingTop: 10,
        }}>
          {usageData.map((data, idx) => (
            <div key={idx} style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}>
              <div style={{
                width: "100%",
                height: (data.usage / maxUsage) * 100 + "px",
                backgroundColor: "#2563eb",
                borderRadius: "4px 4px 0 0",
                opacity: 0.8,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => e.target.style.opacity = "1"}
              onMouseLeave={(e) => e.target.style.opacity = "0.8"}
              title={`${data.usage}%`}
              />
              <small style={{ fontSize: 11, color: "#64748b" }}>{data.date}</small>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
      }}>
        <h3 style={{ margin: "0 0 14px", color: "#0f172a", fontSize: 16, fontWeight: 700 }}>
          Transaction History 💰
        </h3>
        <div style={{ display: "grid", gap: 10 }}>
          {transactions.map((tx) => (
            <div key={tx.id} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 12,
              backgroundColor: "#f8fafc",
              borderRadius: 8,
              borderLeft: `3px solid ${getStatusDot(tx.status)}`,
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, color: "#0f172a", fontWeight: 600, fontSize: 13 }}>
                  {tx.type}
                </p>
                <small style={{ color: "#64748b", fontSize: 12 }}>{tx.date}</small>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{
                  margin: 0,
                  fontWeight: 700,
                  color: tx.amount > 0 ? "#ef4444" : "#0f172a",
                  fontSize: 14,
                }}>
                  {tx.amount > 0 ? "-" : "+"} ${Math.abs(tx.amount).toFixed(2)}
                </p>
                <small style={{
                  color: getStatusColor(tx.status),
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  {tx.status}
                </small>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What's New */}
      <div style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}>
          <h3 style={{ margin: 0, color: "#0f172a", fontSize: 16, fontWeight: 700 }}>
            What's New ✨
          </h3>
          <button style={{
            background: "none",
            border: "none",
            color: "#2563eb",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}>
            View All Updates →
          </button>
        </div>
        <div className="whatsnew-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}>
          {whatsnew.map((item, idx) => (
            <div key={idx} style={{
              padding: 12,
              backgroundColor: "#f0f9ff",
              borderRadius: 8,
              border: "1px solid #bfdbfe",
            }}>
              <p style={{ margin: "0 0 4px", color: "#0f172a", fontWeight: 600, fontSize: 13 }}>
                {item.title}
              </p>
              <p style={{ margin: 0, color: "#64748b", fontSize: 12 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recently Accessed Apps */}
      <div style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
      }}>
        <h3 style={{ margin: "0 0 14px", color: "#0f172a", fontSize: 16, fontWeight: 700 }}>
          Recently Accessed Apps 🚀
        </h3>
        <div className="apps-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}>
          {recentApps.map((app) => (
            <div key={app.id} style={{
              padding: 12,
              backgroundColor: "#f8fafc",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
              <div style={{ fontSize: 24 }}>{app.icon}</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, color: "#0f172a", fontWeight: 600, fontSize: 13 }}>
                  {app.name}
                </p>
              </div>
              <button onClick={() => handleOpenApp(app.name)} style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}>
                Open
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
      }}>
        <h3 style={{ margin: "0 0 14px", color: "#0f172a", fontSize: 16, fontWeight: 700 }}>
          Recent Activities 📝
        </h3>
        <div style={{ display: "grid", gap: 10 }}>
          {activities.map((activity) => (
            <div key={activity.id} style={{
              display: "flex",
              gap: 10,
              padding: 10,
              borderLeft: `3px solid ${getStatusDot(activity.status)}`,
              paddingLeft: 12,
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: getStatusDot(activity.status),
                marginTop: 5,
                flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, color: "#0f172a", fontSize: 13, fontWeight: 500 }}>
                  {activity.action}
                </p>
                <small style={{ color: "#64748b", fontSize: 12 }}>{activity.time}</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Support Section */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 14,
      }}>
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: 12,
          padding: 20,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: 140,
        }}>
          <div>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>
              💬 Live Chat Support
            </h3>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
              Get instant help from our support team
            </p>
          </div>
          <button onClick={handleChatSupport} style={{
            alignSelf: "flex-start",
            background: "#fff",
            color: "#667eea",
            border: "none",
            borderRadius: 6,
            padding: "8px 14px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 12,
          }}>
            Start Chat
          </button>
        </div>
        <div style={{
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          borderRadius: 12,
          padding: 20,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: 140,
        }}>
          <div>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>
              🎫 Support Tickets
            </h3>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
              Raise a ticket for detailed support
            </p>
          </div>
          <button onClick={handleRaiseTicket} style={{
            alignSelf: "flex-start",
            background: "#fff",
            color: "#f5576c",
            border: "none",
            borderRadius: 6,
            padding: "8px 14px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 12,
          }}>
            Raise Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
