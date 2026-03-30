import { useEffect, useState } from "react";
import { activityApi } from "../services";

export default function Activity() {
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadActivity = async () => {
      setLoading(true);
      setError("");
      try {
        const list = await activityApi.getActivity();
        if (!isMounted) return;
        setActivities(Array.isArray(list) ? list : []);
      } catch (serviceError) {
        if (!isMounted) return;
        setError(serviceError?.message || "Unable to load activity.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadActivity();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredActivities = activities.filter((activity) => {
    if (filter === "all") return true;
    return activity.type === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "#16a34a";
      case "error":
        return "#dc2626";
      case "warning":
        return "#d97706";
      case "info":
      default:
        return "#2563eb";
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
        Loading activity...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#b91c1c" }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <style>{`
        @media (max-width: 768px) {
          .activity-container { padding: 16px !important; }
          h1 { font-size: 24px !important; }
          .activity-controls { flex-direction: column !important; }
          select { width: 100% !important; }
          .summary-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .activity-container { padding: 12px !important; }
          h1 { font-size: 20px !important; }
          .activity-controls { gap: 12px !important; }
          .activity-item { flex-direction: column !important; gap: 8px !important; }
          .summary-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <h1 style={{ marginBottom: 24, fontSize: 32 }}>Activity Log</h1>

      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          marginBottom: 20,
          boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20 }}>Recent Activities</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              outline: "none",
            }}
          >
            <option value="all">All Activities</option>
            <option value="subscription">Subscriptions</option>
            <option value="login">Logins</option>
            <option value="payment">Payments</option>
            <option value="update">Updates</option>
            <option value="error">Errors</option>
          </select>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
                padding: 16,
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                background: "#fafafa",
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: getStatusColor(activity.status),
                  flexShrink: 0,
                  marginTop: 4,
                }}
              />
              <div style={{ flex: 1 }}>
                <h3
                  style={{ margin: "0 0 4px", fontSize: 16, color: "#0f172a" }}
                >
                  {activity.title}
                </h3>
                <p
                  style={{ margin: "0 0 8px", color: "#64748b", fontSize: 14 }}
                >
                  {activity.description}
                </p>
                <small style={{ color: "#94a3b8" }}>
                  {formatTimestamp(activity.timestamp)}
                </small>
              </div>
            </div>
          ))}
        </div>

        {filteredActivities.length === 0 && (
          <p style={{ textAlign: "center", color: "#64748b", marginTop: 20 }}>
            No activities found for the selected filter.
          </p>
        )}
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
        }}
      >
        <h2 style={{ margin: "0 0 20px", fontSize: 20 }}>Activity Summary</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: 16,
              border: "1px solid #e2e8f0",
              borderRadius: 10,
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: "#2563eb" }}>
              {activities.filter((a) => a.type === "subscription").length}
            </div>
            <div style={{ color: "#64748b", fontSize: 14 }}>Subscriptions</div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: 16,
              border: "1px solid #e2e8f0",
              borderRadius: 10,
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: "#16a34a" }}>
              {activities.filter((a) => a.status === "success").length}
            </div>
            <div style={{ color: "#64748b", fontSize: 14 }}>
              Successful Actions
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: 16,
              border: "1px solid #e2e8f0",
              borderRadius: 10,
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: "#dc2626" }}>
              {activities.filter((a) => a.status === "error").length}
            </div>
            <div style={{ color: "#64748b", fontSize: 14 }}>Errors</div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: 16,
              border: "1px solid #e2e8f0",
              borderRadius: 10,
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: "#d97706" }}>
              {activities.filter((a) => a.type === "login").length}
            </div>
            <div style={{ color: "#64748b", fontSize: 14 }}>Login Events</div>
          </div>
        </div>
      </div>
    </div>
  );
}
