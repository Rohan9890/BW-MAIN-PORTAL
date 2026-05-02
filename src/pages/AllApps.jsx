import { useEffect, useMemo, useRef, useState } from "react";
import {
  appBackend,
  applicationBackend,
  favoritesBackend,
} from "../services/backendApis";
import { showError, showSuccess } from "../services/toast";
import { emitMyAppsChanged } from "../services/uiEvents";
import "./AllApps.css";

const normalizeApps = (items) =>
  (Array.isArray(items) ? items : []).map((app) => ({
    appId: app.appId,
    appType: app.appType,
    name: app.appName,
    description: app.appText || "—",
    detail: app.appText || "—",
    appUrl: app.appUrl,
    appLogo: app.appLogo,
    status: String(app.status || "").toLowerCase(),
    createdAt: app.createdAt,
  }));

export default function AllApps() {
  const [search, setSearch] = useState("");
  const [apps, setApps] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [myAppIds, setMyAppIds] = useState(() => new Set());
  const [ctaLoadingId, setCtaLoadingId] = useState(null);
  const [ctaSuccessId, setCtaSuccessId] = useState(null);
  const ctaDebugLoggedRef = useRef(new Set());
  const ctaSuccessTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (ctaSuccessTimerRef.current) window.clearTimeout(ctaSuccessTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [list, favs, mine] = await Promise.all([
          applicationBackend.list(),
          favoritesBackend.list().catch(() => []),
          applicationBackend.my().catch(() => []),
        ]);
        if (!active) return;
        if (import.meta.env.DEV) {
          const sample = Array.isArray(list) ? list.slice(0, 5) : [];
          console.info(
            "[AllApps] /application/list sample keys",
            sample.map((x) => Object.keys(x || {}).sort()),
          );
          console.info(
            "[AllApps] /application/list sample",
            sample.map((x) => ({
              appId: x?.appId,
              appName: x?.appName,
              appType: x?.appType,
              status: x?.status,
              appUrl: x?.appUrl,
            })),
          );
        }
        const normalized = normalizeApps(list);
        setApps(normalized);
        setSelectedId(normalized[0]?.appId ?? null);

        const favIds = new Set(
          (Array.isArray(favs) ? favs : [])
            .map((x) => x?.appId ?? x?.id ?? x)
            .filter((v) => v !== undefined && v !== null)
            .map((v) => Number(v)),
        );
        setFavoriteIds(favIds);

        const mineIds = new Set(
          (Array.isArray(mine) ? mine : [])
            .map((x) => x?.id ?? x?.appId)
            .filter((v) => v !== undefined && v !== null)
            .map((v) => Number(v)),
        );
        setMyAppIds(mineIds);
      } catch (e) {
        if (!active) return;
        setError(e?.message || "Unable to load apps.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filteredApps = useMemo(
    () =>
      apps.filter((app) =>
        `${app.name} ${app.appType} ${app.description} ${app.status}`
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

    if (!filteredApps.some((app) => app.appId === selectedId)) {
      setSelectedId(filteredApps[0].appId);
    }
  }, [filteredApps, selectedId]);

  const selectedApp =
    filteredApps.find((app) => app.appId === selectedId) || null;

  const toggleFavorite = async (appId) => {
    const next = new Set(favoriteIds);
    const wasFav = next.has(Number(appId));
    if (wasFav) next.delete(Number(appId));
    else next.add(Number(appId));
    setFavoriteIds(next);
    try {
      if (wasFav) await favoritesBackend.remove(appId);
      else await favoritesBackend.add(appId);
      showSuccess(wasFav ? "Removed from favorites" : "Added to favorites");
    } catch (e) {
      // Revert on error.
      setFavoriteIds(new Set(favoriteIds));
      showError(e?.message || "Unable to update favorites");
    }
  };

  const handleOpen = async (app) => {
    const appId = app?.appId;
    const url = String(app?.appUrl || "").trim();
    if (!appId || !url) return;
    // Open should always work; backend call is best-effort.
    window.open(url, "_blank", "noopener,noreferrer");
    applicationBackend.open(appId).catch(() => {});
  };

  const handleSubscribe = async (app) => {
    const appId = app?.appId;
    if (!appId) return;
    setCtaLoadingId(Number(appId));
    try {
      await appBackend.apply(appId);
      const id = Number(appId);
      setMyAppIds((prev) => new Set(prev).add(id));
      emitMyAppsChanged();

      setCtaSuccessId(id);
      if (ctaSuccessTimerRef.current) window.clearTimeout(ctaSuccessTimerRef.current);
      ctaSuccessTimerRef.current = window.setTimeout(() => setCtaSuccessId(null), 900);

      showSuccess("Added to My Apps");
    } catch (e) {
      showError(e?.message || "Unable to add to My Apps");
    } finally {
      setCtaLoadingId(null);
    }
  };

  const getCta = (app) => {
    const id = Number(app?.appId);
    const owned = myAppIds.has(id);
    if (owned) return { kind: "open", label: "Open", tone: "primary" };

    return { kind: "subscribe", label: "Subscribe", tone: "accent" };
  };

  const runCta = async (app) => {
    const cta = getCta(app);
    if (import.meta.env.DEV) {
      const id = Number(app?.appId);
      if (Number.isFinite(id) && !ctaDebugLoggedRef.current.has(id)) {
        ctaDebugLoggedRef.current.add(id);
        console.info("[AllApps CTA]", {
          appId: id,
          name: app?.name,
          appType: app?.appType,
          status: app?.status,
          appUrl: app?.appUrl,
          owned: myAppIds.has(id),
          decision: cta,
        });
      }
    }
    if (cta.kind === "open") return handleOpen(app);
    return handleSubscribe(app);
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
        {loading ? (
          <div style={{ padding: 18, color: "#64748b" }}>Loading apps...</div>
        ) : error ? (
          <div style={{ padding: 18, color: "#b91c1c" }}>{error}</div>
        ) : null}

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
              const isFav = favoriteIds.has(Number(app.appId));

              return (
                <div
                  key={app.appId}
                  onClick={() => setSelectedId(app.appId)}
                  style={{
                    border:
                      app.appId === selectedId
                        ? "2px solid #2563eb"
                        : "1px solid #e2e8f0",
                    background: app.appId === selectedId ? "#f0f7ff" : "#fff",
                    borderRadius: 12,
                    padding: 14,
                    cursor: "pointer",
                    transition: "transform 0.18s ease, box-shadow 0.18s ease",
                    boxShadow:
                      app.appId === selectedId
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
                        isFav
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                      style={{
                        border: "none",
                        background: "transparent",
                        color: isFav ? "#ef4444" : "#94a3b8",
                        fontSize: 18,
                        cursor: "pointer",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        void toggleFavorite(app.appId);
                      }}
                    >
                      {isFav ? "♥" : "♡"}
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
                    {app.appType}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void runCta(app);
                      }}
                      className={`aa-cta aa-cta--${getCta(app).tone} ${ctaSuccessId === Number(app.appId) ? "is-success" : ""}`}
                      disabled={ctaLoadingId === Number(app.appId)}
                    >
                      {ctaLoadingId === Number(app.appId)
                        ? "Subscribing..."
                        : ctaSuccessId === Number(app.appId)
                          ? "Added"
                          : getCta(app).label}
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
                key={app.appId}
                onClick={() => setSelectedId(app.appId)}
                style={{
                  border:
                    app.appId === selectedId
                      ? "2px solid #2563eb"
                      : "1px solid #e2e8f0",
                  background: app.appId === selectedId ? "#f0f7ff" : "#fff",
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
                      {app.appType}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void toggleFavorite(app.appId);
                      }}
                      style={{
                        border: "1px solid #fecaca",
                        background: favoriteIds.has(Number(app.appId))
                          ? "#fff1f2"
                          : "#fff",
                        color: favoriteIds.has(Number(app.appId))
                          ? "#dc2626"
                          : "#64748b",
                        borderRadius: 8,
                        padding: "8px 12px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {favoriteIds.has(Number(app.appId))
                        ? "Favorited"
                        : "Add to Favorites"}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void runCta(app);
                      }}
                      className={`aa-cta aa-cta--${getCta(app).tone} ${ctaSuccessId === Number(app.appId) ? "is-success" : ""}`}
                      disabled={ctaLoadingId === Number(app.appId)}
                    >
                      {ctaLoadingId === Number(app.appId)
                        ? "Subscribing..."
                        : ctaSuccessId === Number(app.appId)
                          ? "Added"
                          : getCta(app).label}
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
                      background: favoriteIds.has(Number(app.appId))
                        ? "#fee2e2"
                        : "#f1f5f9",
                      color: favoriteIds.has(Number(app.appId))
                        ? "#991b1b"
                        : "#475569",
                    }}
                  >
                    {favoriteIds.has(Number(app.appId))
                      ? "Favorited"
                      : "Not Favorited"}
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
                <strong>Category:</strong> {selectedApp.appType}
              </p>
              <p style={{ margin: "8px 0" }}>
                <strong>Status:</strong> {selectedApp.status}
              </p>
              <p style={{ margin: "8px 0" }}>
                <strong>Favorite:</strong>{" "}
                {favoriteIds.has(Number(selectedApp.appId))
                  ? "Yes"
                  : "No"}
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => void toggleFavorite(selectedApp.appId)}
                  style={{
                    border: "1px solid #fecaca",
                    background: favoriteIds.has(Number(selectedApp.appId))
                      ? "#fff1f2"
                      : "#fff",
                    color: favoriteIds.has(Number(selectedApp.appId))
                      ? "#dc2626"
                      : "#64748b",
                    borderRadius: 10,
                    padding: "10px 12px",
                    cursor: "pointer",
                    fontWeight: 800,
                  }}
                >
                  {favoriteIds.has(Number(selectedApp.appId))
                    ? "Remove Favorite"
                    : "Add to Favorites"}
                </button>
                <button
                  type="button"
                  onClick={() => void runCta(selectedApp)}
                  className={`aa-cta aa-cta--${getCta(selectedApp).tone} ${ctaSuccessId === Number(selectedApp.appId) ? "is-success" : ""}`}
                  disabled={ctaLoadingId === Number(selectedApp.appId)}
                >
                  {ctaLoadingId === Number(selectedApp.appId)
                    ? "Subscribing..."
                    : getCta(selectedApp).kind === "open"
                      ? "Open App"
                      : ctaSuccessId === Number(selectedApp.appId)
                        ? "Added"
                        : getCta(selectedApp).label}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ color: "#64748b" }}>Select an app to view details.</div>
        )}
      </aside>
    </div>
  );
}
