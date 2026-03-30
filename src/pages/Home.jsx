import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBrand } from "../context/BrandContext";
import { dashboardApi } from "../services";

function StatusPill({ status }) {
  if (!status) return null;

  const map = {
    Open: { bg: "#dbeafe", fg: "#1d4ed8" },
    Failed: { bg: "#fee2e2", fg: "#dc2626" },
    Paid: { bg: "#dcfce7", fg: "#15803d" },
  };

  const color = map[status] || { bg: "#f1f5f9", fg: "#475569" };

  return (
    <span
      style={{
        background: color.bg,
        color: color.fg,
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        letterSpacing: "0.3px",
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

export default function Home() {
  const { brand, defaultBrand } = useBrand();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [homeData, setHomeData] = useState({});

  useEffect(() => {
    let isMounted = true;

    const loadHomeData = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await dashboardApi.getHomeData();
        if (!isMounted) return;

        setHomeData(response || {});
      } catch (serviceError) {
        if (!isMounted) return;
        setError(serviceError?.message || "Unable to load dashboard.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = Array.isArray(homeData.stats) ? homeData.stats : [];
  const transactions = Array.isArray(homeData.transactions)
    ? homeData.transactions
    : [];
  const apps = Array.isArray(homeData.apps) ? homeData.apps : [];
  const recommendedActions = Array.isArray(homeData.recommendedActions)
    ? homeData.recommendedActions
    : [];
  const recentRight = Array.isArray(homeData.recentRight)
    ? homeData.recentRight
    : [];
  const usageBreakdown = Array.isArray(homeData.usageBreakdown)
    ? homeData.usageBreakdown
    : [];

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#b91c1c" }}>
        {error}
      </div>
    );
  }

  if (!stats.length && !apps.length && !transactions.length) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
        No dashboard data available.
      </div>
    );
  }

  const filteredApps = useMemo(() => {
    if (!search.trim()) return apps;
    return apps.filter((app) =>
      `${app.name} ${app.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [search, apps]);

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];

    const appResults = apps
      .filter((item) =>
        `${item.name} ${item.description}`.toLowerCase().includes(query),
      )
      .map((item) => ({
        key: `app-${item.name}`,
        title: item.name,
        subtitle: item.description,
        type: "App",
        route: item.route,
        color: item.color,
      }));

    const actionResults = recommendedActions
      .filter((item) =>
        `${item.title} ${item.description}`.toLowerCase().includes(query),
      )
      .map((item) => ({
        key: `action-${item.title}`,
        title: item.title,
        subtitle: item.description,
        type: "Action",
        route: item.route,
        color: item.color,
      }));

    const transactionResults = transactions
      .filter((item) =>
        `${item.id} ${item.status}`.toLowerCase().includes(query),
      )
      .map((item) => ({
        key: `transaction-${item.id}`,
        title: item.id,
        subtitle: `${item.amount} • ${item.status}`,
        type: "Invoice",
        route: "/activity",
        color: item.color,
      }));

    return [...appResults, ...actionResults, ...transactionResults].slice(0, 6);
  }, [search, apps, recommendedActions, transactions]);

  const handleSearchSubmit = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (!searchResults.length) return;
    navigate(searchResults[0].route);
    setSearch("");
  };

  const handleSearchItemClick = (route) => {
    navigate(route);
    setSearch("");
  };

  return (
    <div style={{ width: "100%", display: "grid", gap: 14 }}>
      <style>{`
        .home-card {
          background: #ffffff;
          border: 1px solid rgba(37, 99, 235, 0.08);
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06), 0 1px 4px rgba(37, 99, 235, 0.05);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .home-card:hover {
          box-shadow: 0 8px 32px rgba(15, 23, 42, 0.1), 0 2px 8px rgba(37, 99, 235, 0.08);
          transform: translateY(-1px);
        }
        .stat-card {
          background: linear-gradient(145deg, #ffffff 0%, #f8fbff 100%);
          border: 1px solid rgba(37, 99, 235, 0.1);
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
          position: relative;
          overflow: hidden;
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .stat-card::before {
          content: '';
          position: absolute;
          top: -20px;
          right: -20px;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, rgba(37,99,235,0.08), rgba(37,99,235,0.03));
          border-radius: 50%;
        }
        .stat-card:hover {
          box-shadow: 0 8px 32px rgba(15, 23, 42, 0.1);
          transform: translateY(-2px);
        }
        .interactive-stat {
          cursor: pointer;
        }
        .interactive-stat:hover {
          border-color: var(--stat-color) !important;
          box-shadow: 0 12px 32px color-mix(in srgb, var(--stat-color) 24%, rgba(15, 23, 42, 0.12)) !important;
        }
        .interactive-stat:hover .stat-action {
          color: var(--stat-color) !important;
        }
        .recommended-card:hover {
          border-color: var(--action-color) !important;
          box-shadow: 0 10px 24px color-mix(in srgb, var(--action-color) 18%, rgba(15, 23, 42, 0.08));
          transform: translateY(-1px);
        }
        .action-btn {
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #fff;
          padding: 9px 20px;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
          transition: all 0.2s ease;
          letter-spacing: 0.2px;
        }
        .action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.45);
        }
        .open-btn {
          border: 1.5px solid #dbeafe;
          border-radius: 8px;
          background: #eff6ff;
          color: #2563eb;
          padding: 6px 14px;
          font-weight: 700;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }
        .open-btn:hover {
          background: #2563eb;
          color: #fff;
          border-color: #2563eb;
        }
        .search-input {
          width: 100%;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          color: #334155;
          font-size: 13px;
          padding: 13px 18px;
          outline: none;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(15,23,42,0.04);
        }
        .search-input:focus {
          border-color: #93c5fd;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1), 0 2px 8px rgba(15,23,42,0.04);
        }
        .overview-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
        }
        .bottom-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 1200px) {
          .overview-grid, .bottom-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .span-3, .span-4, .span-2, .right-col { grid-column: auto !important; grid-row: auto !important; }
        }
        @media (max-width: 760px) {
          .overview-grid, .bottom-grid, .apps-grid { grid-template-columns: 1fr !important; }
          .top-banner { flex-direction: column; align-items: stretch; }
        }
      `}</style>

      <section
        className="home-card top-banner"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "22px 24px",
          background: "linear-gradient(135deg, #ffffff 0%, #f0f6ff 100%)",
          borderBottom: "1px solid rgba(37,99,235,0.1)",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              lineHeight: 1.1,
              fontWeight: 800,
              background: "linear-gradient(135deg, #0f172a 0%, #1e40af 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.5px",
            }}
          >
            Good Morning, Rohan
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              color: "#64748b",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Here&apos;s a quick overview of your account.
          </p>
        </div>
        <div
          style={{
            flex: 1.4,
            maxWidth: 780,
            minWidth: 280,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                position: "absolute",
                left: 14,
                color: "#94a3b8",
                pointerEvents: "none",
                flexShrink: 0,
              }}
            >
              <circle
                cx="11"
                cy="11"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="m21 21-4.35-4.35"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchSubmit}
              placeholder="Search apps, subscriptions, tickets, invoices..."
              style={{
                paddingLeft: 44,
              }}
            />
          </div>
          {search.trim() && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                left: 0,
                right: 0,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                boxShadow: "0 20px 40px rgba(15,23,42,0.12)",
                overflow: "hidden",
                zIndex: 20,
              }}
            >
              {searchResults.length ? (
                searchResults.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleSearchItemClick(item.route)}
                    style={{
                      width: "100%",
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 12,
                      alignItems: "center",
                      textAlign: "left",
                      border: "none",
                      background: "#ffffff",
                      padding: "12px 14px",
                      borderBottom: "1px solid #f1f5f9",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: item.color,
                        display: "grid",
                        placeItems: "center",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {item.type.slice(0, 1)}
                    </span>
                    <span>
                      <span
                        style={{
                          display: "block",
                          color: "#0f172a",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        {item.title}
                      </span>
                      <span
                        style={{
                          display: "block",
                          marginTop: 2,
                          color: "#64748b",
                          fontSize: 11,
                        }}
                      >
                        {item.subtitle}
                      </span>
                    </span>
                    <span
                      style={{
                        color: "#94a3b8",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {item.type}
                    </span>
                  </button>
                ))
              ) : (
                <div
                  style={{
                    padding: "14px 16px",
                    color: "#64748b",
                    fontSize: 12,
                  }}
                >
                  No matching apps, actions, or invoices found.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="overview-grid">
        {stats.map((item) => (
          <button
            key={item.title}
            type="button"
            className="stat-card interactive-stat"
            onClick={() => navigate(item.route)}
            style={{
              padding: 20,
              textAlign: "left",
              border: "1px solid rgba(37, 99, 235, 0.1)",
              ["--stat-color"]: item.accent,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 600,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              {item.title}
            </p>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 28,
                fontWeight: 800,
                color: item.accent,
              }}
            >
              {item.value}
            </p>
            <div
              style={{
                marginTop: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                {item.hint}
              </span>
              <span
                className="stat-action"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#334155",
                  transition: "color 0.2s ease",
                }}
              >
                {item.action} ›
              </span>
            </div>
          </button>
        ))}

        <div
          className="home-card right-col"
          style={{
            gridColumn: 4,
            gridRow: "1 / span 3",
            padding: 20,
            display: "grid",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "-0.2px",
              }}
            >
              Usage Overview
            </h3>
            <span
              style={{
                color: "#94a3b8",
                fontSize: 12,
                fontWeight: 500,
                background: "#f1f5f9",
                padding: "3px 10px",
                borderRadius: 20,
              }}
            >
              Last 7 Days
            </span>
          </div>

          <svg
            width="100%"
            height="140"
            viewBox="0 0 320 140"
            role="img"
            aria-label="Usage chart"
          >
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line
              x1="0"
              y1="120"
              x2="320"
              y2="120"
              stroke="#e8eef8"
              strokeWidth="1"
            />
            <line
              x1="0"
              y1="88"
              x2="320"
              y2="88"
              stroke="#f1f5f9"
              strokeWidth="1"
            />
            <line
              x1="0"
              y1="56"
              x2="320"
              y2="56"
              stroke="#f1f5f9"
              strokeWidth="1"
            />
            <line
              x1="0"
              y1="24"
              x2="320"
              y2="24"
              stroke="#f1f5f9"
              strokeWidth="1"
            />
            <polyline
              fill="none"
              stroke="#bfdbfe"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              points="0,115 53,108 106,84 159,76 212,68 265,38 320,20"
            />
            <polyline
              fill="url(#areaGrad)"
              stroke="none"
              points="0,115 53,110 106,100 159,106 212,94 265,78 320,68 320,120 0,120"
            />
            <polyline
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              points="0,115 53,110 106,100 159,106 212,94 265,78 320,68"
            />
            <circle
              cx="320"
              cy="68"
              r="5"
              fill="#2563eb"
              stroke="#fff"
              strokeWidth="2"
            />
          </svg>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6,1fr)",
              color: "#94a3b8",
              fontSize: 10,
              fontWeight: 500,
              textAlign: "center",
            }}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
              .slice(0, 6)
              .map((d) => (
                <span key={d}>{d}</span>
              ))}
          </div>

          <div
            style={{
              borderRadius: 10,
              background: "linear-gradient(135deg, #eff6ff, #f0f9ff)",
              border: "1px solid #dbeafe",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 14px",
              fontSize: 12,
              color: "#334155",
              fontWeight: 500,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "inline-block",
                }}
              />
              <span>Currently Active</span>
            </div>
            <span style={{ fontWeight: 700, color: "#2563eb", fontSize: 11 }}>
              18 Sessions, 2 API Calls
            </span>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {usageBreakdown.map((item) => (
              <div key={item.app} style={{ display: "grid", gap: 5 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ fontSize: 11, color: "#334155", fontWeight: 600 }}
                  >
                    {item.app}
                  </span>
                  <span
                    style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}
                  >
                    {item.used}
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 999,
                    background: "#e2e8f0",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${item.percent}%`,
                      height: "100%",
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="home-card right-col"
          style={{ gridColumn: 5, gridRow: "1 / span 3", padding: 20 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h3
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "-0.2px",
              }}
            >
              Transaction History
            </h3>
            <span
              style={{
                fontSize: 11,
                color: "#2563eb",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              View all
            </span>
          </div>
          <div style={{ display: "grid", gap: 14 }}>
            {transactions.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: "#f8fafc",
                  borderRadius: 10,
                  border: "1px solid #f1f5f9",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: t.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"
                        fill="#fff"
                        opacity="0.9"
                      />
                    </svg>
                  </span>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: 13,
                      }}
                    >
                      {t.id}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        color: "#94a3b8",
                        fontSize: 11,
                      }}
                    >
                      {t.time}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p
                    style={{
                      margin: 0,
                      color: "#0f172a",
                      fontWeight: 800,
                      fontSize: 14,
                    }}
                  >
                    {t.amount}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      color: t.status === "Failed" ? "#dc2626" : "#15803d",
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  >
                    {t.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="home-card span-2"
          style={{ gridColumn: "1 / span 1", gridRow: 2, padding: 20 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                    fill="#fff"
                  />
                </svg>
              </div>
              <h3
                style={{
                  margin: 0,
                  color: "#0f172a",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Complete KYC
              </h3>
              <p
                style={{
                  margin: "6px 0 14px",
                  color: "#64748b",
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                Verify your identity for full access
              </p>
            </div>
          </div>
          <button
            className="action-btn"
            onClick={() => alert("Start KYC clicked")}
          >
            Start Verification
          </button>
        </div>

        <div
          className="home-card span-2"
          style={{ gridColumn: "2 / span 2", gridRow: 2, padding: 20 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
                    fill="#fff"
                  />
                </svg>
              </div>
              <h3
                style={{
                  margin: 0,
                  color: "#0f172a",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Account Settings
              </h3>
              <p
                style={{
                  margin: "6px 0 14px",
                  color: "#64748b",
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                Manage your account preferences
              </p>
            </div>
          </div>
          <button className="action-btn" onClick={() => navigate("/settings")}>
            Go to Settings
          </button>
        </div>

        <div
          className="home-card span-3"
          style={{ gridColumn: "1 / span 3", gridRow: 3, padding: 20 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>✨</span>
              <h3
                style={{
                  margin: 0,
                  color: "#0f172a",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                What&apos;s New
              </h3>
            </div>
            <button
              onClick={() => alert("View all updates")}
              style={{
                border: "1.5px solid #bfdbfe",
                borderRadius: 10,
                color: "#2563eb",
                background: "linear-gradient(135deg, #eff6ff, #f8fbff)",
                padding: "7px 18px",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(37,99,235,0.12)",
                transition: "all 0.2s",
              }}
            >
              View All Updates
            </button>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {[
              { icon: "🚀", text: "New Feature: API usage insights added" },
              {
                icon: "⚡",
                text: "Improved dashboard performance for faster loading",
              },
              {
                icon: "🔧",
                text: "Bug Fixes: Billing and invoicing issues resolved",
              },
            ].map(({ icon, text }) => (
              <div
                key={text}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  background: "#f8fafc",
                  borderRadius: 10,
                  border: "1px solid #f1f5f9",
                  fontSize: 13,
                  color: "#334155",
                  fontWeight: 500,
                }}
              >
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bottom-grid">
        <div
          className="home-card span-3"
          style={{ gridColumn: "1 / span 3", padding: 20 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <h3
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Recently Accessed Apps
            </h3>
            <span
              style={{
                fontSize: 12,
                color: "#2563eb",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              View all
            </span>
          </div>
          <div
            className="apps-grid"
            style={{
              marginTop: 0,
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {filteredApps.map((app, index) => (
              <div
                key={`${app.name}-${index}`}
                style={{
                  border: "1px solid #e8eef8",
                  background: "linear-gradient(135deg, #f8fbff, #ffffff)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "box-shadow 0.2s",
                }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: app.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: `0 4px 10px ${app.color}55`,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"
                        fill="#fff"
                      />
                    </svg>
                  </span>
                  <div>
                    <div
                      style={{
                        color: "#0f172a",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {app.name}
                    </div>
                    <div
                      style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}
                    >
                      {app.time}
                    </div>
                  </div>
                </div>
                <button
                  className="open-btn"
                  onClick={() => alert(`Opening ${app.name}`)}
                >
                  Open
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 2,
              }}
            >
              <h4
                style={{
                  margin: 0,
                  color: "#0f172a",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Recommended Actions
              </h4>
              <span
                style={{
                  color: "#94a3b8",
                  fontSize: 11,
                  background: "#f1f5f9",
                  padding: "2px 8px",
                  borderRadius: 20,
                  fontWeight: 500,
                }}
              >
                Smart picks
              </span>
            </div>
            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              {recommendedActions.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  className="recommended-card"
                  onClick={() => navigate(item.route)}
                  style={{
                    ["--action-color"]: item.color,
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    alignItems: "center",
                    gap: 12,
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid #eef2f7",
                    background: "linear-gradient(135deg, #f8fbff, #ffffff)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: item.color,
                      display: "grid",
                      placeItems: "center",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {item.title.slice(0, 1)}
                  </span>
                  <span>
                    <span
                      style={{
                        display: "block",
                        color: "#0f172a",
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {item.title}
                    </span>
                    <span
                      style={{
                        display: "block",
                        marginTop: 3,
                        color: "#64748b",
                        fontSize: 11,
                        lineHeight: 1.4,
                      }}
                    >
                      {item.description}
                    </span>
                  </span>
                  <span
                    style={{ color: item.color, fontSize: 11, fontWeight: 700 }}
                  >
                    {item.action}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className="home-card right-col"
          style={{ gridColumn: 4, padding: 20 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <h3
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Recent Activity
            </h3>
            <span
              style={{
                color: "#94a3b8",
                fontSize: 11,
                background: "#f1f5f9",
                padding: "2px 8px",
                borderRadius: 20,
                fontWeight: 500,
              }}
            >
              Last 7d
            </span>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {recentRight.map((item) => (
              <div
                key={item.title}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  alignItems: "center",
                  padding: "10px 12px",
                  background: "#f8fafc",
                  borderRadius: 10,
                  border: "1px solid #f1f5f9",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      color: "#0f172a",
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    {item.title}
                  </p>
                  <p
                    style={{
                      margin: "3px 0 0",
                      color: "#94a3b8",
                      fontSize: 10,
                    }}
                  >
                    {item.time}
                  </p>
                </div>
                <StatusPill status={item.status} />
              </div>
            ))}
          </div>
        </div>

        <div
          className="home-card right-col"
          style={{ gridColumn: 5, padding: 20 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
                  fill="#fff"
                />
              </svg>
            </div>
            <h3
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Support
            </h3>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <button
              onClick={() => alert("Chat with support clicked")}
              style={{
                border: "1.5px solid #e8eef8",
                borderRadius: 12,
                background: "linear-gradient(135deg, #f8fbff, #ffffff)",
                padding: "10px 12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#eff6ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
                      fill="#2563eb"
                    />
                  </svg>
                </div>
                <div>
                  <div
                    style={{ color: "#0f172a", fontWeight: 700, fontSize: 13 }}
                  >
                    Chat with support
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 1 }}>
                    Avg. reply in 5 min
                  </div>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={() => alert("Raise a ticket clicked")}
              style={{
                border: "1.5px solid #e8eef8",
                borderRadius: 12,
                background: "linear-gradient(135deg, #f8fbff, #ffffff)",
                padding: "10px 12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#f0fdf4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 10h-2v-2h2v2zm0-4h-2V7h2v2z"
                      fill="#16a34a"
                    />
                  </svg>
                </div>
                <div>
                  <div
                    style={{ color: "#0f172a", fontWeight: 700, fontSize: 13 }}
                  >
                    Raise a Ticket
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 1 }}>
                    Submit a request to our team
                  </div>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div
              style={{
                marginTop: 2,
                border: "1px dashed #dbeafe",
                borderRadius: 10,
                background: "#f8fbff",
                padding: "8px 10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <img
                  src={brand.logoUrl || defaultBrand.logoUrl}
                  alt={brand.name}
                  onError={(e) => {
                    e.currentTarget.src = defaultBrand.logoUrl;
                  }}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    objectFit: "cover",
                  }}
                />
                <span
                  style={{ color: "#334155", fontWeight: 600, fontSize: 11 }}
                >
                  Support team online
                </span>
              </div>
              <span style={{ color: "#16a34a", fontSize: 10, fontWeight: 700 }}>
                LIVE
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
