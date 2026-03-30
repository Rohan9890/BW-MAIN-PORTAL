import { useState, useEffect } from "react";
import { appsApi } from "../services";

const STORAGE_KEY = "bold-wise-allapps";

export default function AllApps() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [apps, setApps] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const loadApps = async () => {
      setLoading(true);
      setError("");
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length) {
            setApps(parsed);
            setSelectedId(parsed[0].id);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.warn("Failed parsing saved apps", error);
        }
      }

      try {
        const list = await appsApi.getAllApps();
        const normalized = Array.isArray(list) ? list : [];
        setApps(normalized);
        setSelectedId(normalized[0]?.id || null);
      } catch (serviceError) {
        setError(serviceError?.message || "Unable to load applications.");
        setApps([]);
        setSelectedId(null);
      } finally {
        setLoading(false);
      }
    };

    loadApps();
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    }
  }, [apps, loading]);

  const filteredApps = apps.filter((app) =>
    `${app.name} ${app.category} ${app.description}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const selectedApp = filteredApps.find((app) => app.id === selectedId) || null;

  useEffect(() => {
    if (!filteredApps.length) {
      setSelectedId(null);
      return;
    }

    const exists = filteredApps.some((item) => item.id === selectedId);
    if (!exists) {
      setSelectedId(filteredApps[0].id);
    }
  }, [filteredApps, selectedId]);

  const toggleSubscribe = async (id) => {
    const target = apps.find((app) => app.id === id);
    if (!target) return;

    const nextValue = !target.subscribed;
    await appsApi.toggleSubscription(id, nextValue);
    setApps((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, subscribed: nextValue } : app,
      ),
    );
  };

  const toggleWishlist = async (id) => {
    const target = apps.find((app) => app.id === id);
    if (!target) return;

    const nextValue = !target.wishlisted;
    await appsApi.toggleFavorite(id, nextValue);
    setApps((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, wishlisted: nextValue } : app,
      ),
    );
  };

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
        <p>Loading applications...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "50px", color: "#b91c1c" }}>
        {error}
      </div>
    );
  }

  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 18 }}
      className="all-apps-grid"
    >
      <style>{`
        @media (max-width: 1024px) {
          .all-apps-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .search-bar { width: 100% !important; }
          h2 { font-size: 18px !important; }
          button { font-size: 12px !important; padding: 6px 10px !important; }
        }
        @media (max-width: 480px) {
          .all-apps-grid { grid-template-columns: 1fr !important; }
          .app-list-item { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <section
        style={{
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 4px 14px rgba(15,23,42,0.06)",
          padding: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0 }}>All Apps</h2>
          <input
            type="text"
            placeholder="Search apps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              borderRadius: 8,
              border: "1px solid #dbe2ed",
              padding: "8px 12px",
              width: 260,
            }}
          />
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {filteredApps.map((app) => (
            <div
              key={app.id}
              onClick={() => setSelectedId(app.id)}
              style={{
                border:
                  app.id === selectedId
                    ? "2px solid #2563eb"
                    : "1px solid #e2e8f0",
                background: app.id === selectedId ? "#f0f7ff" : "#fff",
                borderRadius: 10,
                padding: 12,
                cursor: "pointer",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong style={{ fontSize: 16 }}>{app.name}</strong>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      padding: "2px 8px",
                      borderRadius: 6,
                      background:
                        app.status === "active"
                          ? "#dcfce7"
                          : app.status === "beta"
                            ? "#fef3c7"
                            : "#e2e8f0",
                      color:
                        app.status === "active"
                          ? "#166534"
                          : app.status === "beta"
                            ? "#92400e"
                            : "#334155",
                    }}
                  >
                    {app.status}
                  </span>
                </div>
                <div style={{ color: "#475569", fontSize: 13, marginTop: 3 }}>
                  {app.description}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                  {app.category}
                </div>
              </div>

              <button
                type="button"
                style={{
                  border: "none",
                  background: "transparent",
                  color: app.wishlisted ? "#ef4444" : "#94a3b8",
                  fontSize: 18,
                  cursor: "pointer",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(app.id);
                }}
              >
                {app.wishlisted ? "★" : "☆"}
              </button>
            </div>
          ))}
          {!filteredApps.length && (
            <div style={{ color: "#64748b", padding: 8 }}>
              No applications found.
            </div>
          )}
        </div>
      </section>

      <aside
        style={{
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 4px 14px rgba(15,23,42,0.06)",
          padding: 18,
        }}
      >
        {selectedApp ? (
          <>
            <h3 style={{ margin: 0 }}>{selectedApp.name}</h3>
            <p style={{ marginTop: 8, color: "#475569", fontSize: 14 }}>
              {selectedApp.detail}
            </p>
            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              <button
                onClick={() => toggleSubscribe(selectedApp.id)}
                style={{
                  border: "none",
                  borderRadius: 8,
                  backgroundColor: selectedApp.subscribed
                    ? "#f97316"
                    : "#2563eb",
                  color: "#fff",
                  padding: "8px 15px",
                  cursor: "pointer",
                }}
              >
                {selectedApp.subscribed ? "Unsubscribe" : "Subscribe"}
              </button>
              <button
                onClick={() => toggleWishlist(selectedApp.id)}
                style={{
                  border: "1px solid #dbe2ed",
                  borderRadius: 8,
                  background: "#fff",
                  color: selectedApp.wishlisted ? "#ef4444" : "#475569",
                  padding: "8px 15px",
                  cursor: "pointer",
                }}
              >
                {selectedApp.wishlisted
                  ? "Remove from Wishlist"
                  : "Add to Wishlist"}
              </button>
            </div>

            <div style={{ marginTop: 16, fontSize: 13, color: "#64748b" }}>
              <p style={{ margin: "8px 0" }}>
                <strong>Category:</strong> {selectedApp.category}
              </p>
              <p style={{ margin: "8px 0" }}>
                <strong>Status:</strong> {selectedApp.status}
              </p>
              <p style={{ margin: "8px 0" }}>
                <strong>Subscription:</strong>{" "}
                {selectedApp.subscribed ? "Active" : "Not Subscribed"}
              </p>
            </div>
          </>
        ) : (
          <div style={{ color: "#64748b" }}>
            Select an app from the list to view details and subscribe.
          </div>
        )}
      </aside>
    </div>
  );
}
