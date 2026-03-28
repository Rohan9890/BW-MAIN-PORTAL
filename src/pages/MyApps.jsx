import { useState, useEffect } from "react";

export default function MyApps() {
  const [loading, setLoading] = useState(true);
  const [myApps, setMyApps] = useState([]);

  useEffect(() => {
    const loadMyApps = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));

      const subscribedApps = [
        {
          id: 1,
          name: "Document Management",
          description: "Manage and organize all your documents efficiently",
          category: "Productivity",
          lastUsed: "2 hours ago",
          usage: "85%",
        },
        {
          id: 2,
          name: "Application Management",
          description: "Monitor and control application deployments",
          category: "DevOps",
          lastUsed: "1 day ago",
          usage: "62%",
        },
        {
          id: 3,
          name: "Charge Management",
          description: "Handle billing and payment processing",
          category: "Finance",
          lastUsed: "3 days ago",
          usage: "41%",
        },
      ];

      setMyApps(subscribedApps);
      setLoading(false);
    };

    loadMyApps();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #2563eb",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px",
          }}
        ></div>
        <p>Loading your applications...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "30px" }}>
        <h1
          style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}
        >
          My Applications
        </h1>
        <p style={{ color: "#666", fontSize: "16px" }}>
          Manage your subscribed applications and track usage
        </p>
      </div>

      {myApps.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ color: "#6b7280", marginBottom: "10px" }}>
            No applications yet
          </h3>
          <p style={{ color: "#9ca3af" }}>
            Visit the All Apps page to subscribe to applications
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "20px",
          }}
        >
          {myApps.map((app) => (
            <div
              key={app.id}
              style={{
                padding: "24px",
                borderRadius: "12px",
                background: "#fff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                border: "1px solid #e5e7eb",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "12px",
                }}
              >
                <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>
                  {app.name}
                </h3>
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "500",
                    backgroundColor: "#dcfce7",
                    color: "#166534",
                  }}
                >
                  Active
                </span>
              </div>

              <p
                style={{
                  color: "#6b7280",
                  marginBottom: "16px",
                  lineHeight: "1.5",
                }}
              >
                {app.description}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    padding: "4px 12px",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "20px",
                    fontSize: "14px",
                    color: "#374151",
                  }}
                >
                  {app.category}
                </span>
                <span style={{ fontSize: "14px", color: "#6b7280" }}>
                  Last used: {app.lastUsed}
                </span>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "#6b7280" }}>
                    Usage
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>
                    {app.usage}
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "6px",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "3px",
                  }}
                >
                  <div
                    style={{
                      width: app.usage,
                      height: "6px",
                      backgroundColor: "#2563eb",
                      borderRadius: "3px",
                      transition: "width 0.3s",
                    }}
                  ></div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  style={{
                    flex: 1,
                    padding: "8px 16px",
                    backgroundColor: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#1d4ed8")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#2563eb")
                  }
                >
                  Open App
                </button>
                <button
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#e5e7eb")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f3f4f6")
                  }
                >
                  Settings
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
