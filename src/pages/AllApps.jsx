import { useEffect, useMemo, useState } from "react";
import { mockData } from "../services/mockData";

const STORAGE_KEY = "bold-wise-allapps";

const formatFavoriteDate = () =>
  new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

const normalizeApps = (items) =>
  (Array.isArray(items) ? items : []).map((app, index) => ({
    ...app,
    id: app.id ?? index + 1,
    rating: app.rating ?? 4,
    favoritedDate: app.favoritedDate ?? null,
    detail: app.detail || app.description,
  }));

export default function AllApps() {
  const [search, setSearch] = useState("");
  const [apps, setApps] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const normalized = normalizeApps(parsed);
        setApps(normalized);
        setSelectedId(normalized[0]?.id ?? null);
        return;
      } catch (error) {
        console.warn("Failed parsing saved apps", error);
      }
    }

    const fallbackApps = normalizeApps(mockData.appCatalog.allApps);
    setApps(fallbackApps);
    setSelectedId(fallbackApps[0]?.id ?? null);
  }, []);

  useEffect(() => {
    if (apps.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    }
  }, [apps]);

  const filteredApps = useMemo(
    () =>
      apps.filter((app) =>
        `${app.name} ${app.category} ${app.description} ${app.status}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [apps, search],
  );

  useEffect(() => {
    if (!filteredApps.length) {
      setSelectedId(null);
      return;
    }

    if (!filteredApps.some((app) => app.id === selectedId)) {
      setSelectedId(filteredApps[0].id);
    }
  }, [filteredApps, selectedId]);

  const selectedApp = filteredApps.find((app) => app.id === selectedId) || null;

  const toggleSubscribe = (id) => {
    setApps((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, subscribed: !app.subscribed } : app,
      ),
    );
  };

  const toggleWishlist = (id) => {
    setApps((prev) =>
      prev.map((app) => {
        if (app.id !== id) return app;

        const nextWishlisted = !app.wishlisted;
        return {
          ...app,
          wishlisted: nextWishlisted,
          favoritedDate: nextWishlisted ? formatFavoriteDate() : null,
        };
      }),
    );
  };

  const renderStatus = (status) => ({
    background:
      status === "active"
        ? "#dcfce7"
        : status === "beta"
          ? "#fef3c7"
          : "#e2e8f0",
    color:
      status === "active"
        ? "#166534"
        : status === "beta"
          ? "#92400e"
          : "#334155",
  });

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
          .all-apps-toolbar { flex-direction: column !important; align-items: stretch !important; }
          .all-apps-search { width: 100% !important; }
          .all-apps-view-toggle { width: 100%; justify-content: stretch; }
          .all-apps-view-toggle button { flex: 1; }
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
          className="all-apps-toolbar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>All Apps</h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
              Switch between a card grid and a compact dropdown list.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <input
              className="all-apps-search"
              type="text"
              placeholder="Search apps..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                borderRadius: 10,
                border: "1px solid #dbe2ed",
                padding: "10px 12px",
                width: 260,
                outline: "none",
              }}
            />

            <div
              className="all-apps-view-toggle"
              style={{
                display: "flex",
                border: "1px solid #dbe2ed",
                borderRadius: 10,
                overflow: "hidden",
                background: "#f8fafc",
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                style={{
                  border: "none",
                  background: viewMode === "grid" ? "#2563eb" : "transparent",
                  color: viewMode === "grid" ? "#fff" : "#475569",
                  padding: "9px 14px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Grid View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                style={{
                  border: "none",
                  background: viewMode === "list" ? "#2563eb" : "transparent",
                  color: viewMode === "list" ? "#fff" : "#475569",
                  padding: "9px 14px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                List View
              </button>
            </div>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
              gap: 12,
            }}
          >
            {filteredApps.map((app) => {
              const statusTone = renderStatus(app.status);

              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedId(app.id)}
                  style={{
                    border:
                      app.id === selectedId
                        ? "2px solid #2563eb"
                        : "1px solid #e2e8f0",
                    background: app.id === selectedId ? "#f0f7ff" : "#fff",
                    borderRadius: 12,
                    padding: 14,
                    cursor: "pointer",
                    transition: "transform 0.18s ease, box-shadow 0.18s ease",
                    boxShadow:
                      app.id === selectedId
                        ? "0 10px 20px rgba(37,99,235,0.08)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <strong style={{ fontSize: 16 }}>{app.name}</strong>
                    <button
                      type="button"
                      aria-label={
                        app.wishlisted
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
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

                  <div style={{ marginTop: 8 }}>
                    <span
                      style={{
                        ...statusTone,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        padding: "3px 8px",
                        borderRadius: 6,
                        display: "inline-block",
                      }}
                    >
                      {app.status}
                    </span>
                  </div>

                  <p
                    style={{
                      color: "#475569",
                      fontSize: 13,
                      margin: "10px 0 8px",
                    }}
                  >
                    {app.description}
                  </p>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {app.category}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSubscribe(app.id);
                      }}
                      style={{
                        border: "none",
                        borderRadius: 8,
                        backgroundColor: app.subscribed ? "#f97316" : "#2563eb",
                        color: "#fff",
                        padding: "8px 12px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {app.subscribed ? "Unsubscribe" : "Subscribe"}
                    </button>
                  </div>
                </div>
              );
            })}

            {!filteredApps.length && (
              <div style={{ color: "#64748b", padding: 8 }}>
                No applications found.
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
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
                  borderRadius: 12,
                  padding: 16,
                  cursor: "pointer",
                  display: "grid",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0 }}>{app.name}</h3>
                    <p
                      style={{
                        margin: "6px 0 0",
                        color: "#64748b",
                        fontSize: 13,
                      }}
                    >
                      {app.category}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(app.id);
                      }}
                      style={{
                        border: "1px solid #fecaca",
                        background: app.wishlisted ? "#fff1f2" : "#fff",
                        color: app.wishlisted ? "#dc2626" : "#64748b",
                        borderRadius: 8,
                        padding: "8px 12px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {app.wishlisted ? "Wishlisted" : "Add to Wishlist"}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSubscribe(app.id);
                      }}
                      style={{
                        border: "none",
                        borderRadius: 8,
                        backgroundColor: app.subscribed ? "#f97316" : "#2563eb",
                        color: "#fff",
                        padding: "8px 14px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {app.subscribed ? "Unsubscribe" : "Subscribe"}
                    </button>
                  </div>
                </div>

                <p
                  style={{
                    margin: 0,
                    color: "#475569",
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  {app.detail}
                </p>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span
                    style={{
                      ...renderStatus(app.status),
                      borderRadius: 999,
                      padding: "8px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {app.status}
                  </span>
                  <span
                    style={{
                      borderRadius: 999,
                      padding: "8px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                      background: app.subscribed ? "#dbeafe" : "#f1f5f9",
                      color: app.subscribed ? "#1d4ed8" : "#475569",
                    }}
                  >
                    {app.subscribed ? "Subscribed" : "Not Subscribed"}
                  </span>
                </div>
              </div>
            ))}

            {!filteredApps.length && (
              <div style={{ color: "#64748b" }}>No applications found.</div>
            )}
          </div>
        )}
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
              <p style={{ margin: "8px 0" }}>
                <strong>Wishlist:</strong>{" "}
                {selectedApp.wishlisted
                  ? `Added on ${selectedApp.favoritedDate}`
                  : "Not wishlisted"}
              </p>
            </div>
          </>
        ) : (
          <div style={{ color: "#64748b" }}>Select an app to view details.</div>
        )}
      </aside>
    </div>
  );
}
