import { useState, useEffect } from "react";
import { appsApi } from "../services";

export default function Favorites() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true);
      setError("");
      try {
        const favoriteApps = await appsApi.getFavorites();
        setFavorites(Array.isArray(favoriteApps) ? favoriteApps : []);
      } catch (serviceError) {
        setError(serviceError?.message || "Unable to load favorites.");
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);

  const categories = [
    "All",
    ...new Set(favorites.map((app) => app.category).filter(Boolean)),
  ];

  const filteredFavorites = favorites.filter((app) => {
    const matchesSearch = `${app.name} ${app.description}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const matchesCategory = category === "All" || app.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleRemoveFavorite = async (appId) => {
    await appsApi.toggleFavorite(appId, false);
    setFavorites((prev) => prev.filter((item) => item.id !== appId));
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
        <p>Loading your favorites...</p>
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
    <div>
      <div style={{ marginBottom: "30px" }}>
        <h1
          style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}
        >
          Favorite Applications
        </h1>
        <p style={{ color: "#666", fontSize: "16px" }}>
          Your most loved and frequently used applications
        </p>
        <div
          style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}
        >
          <input
            type="text"
            placeholder="Search favorites..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: "8px 12px",
              minWidth: 220,
            }}
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: "8px 12px",
            }}
          >
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredFavorites.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>⭐</div>
          <h3 style={{ color: "#6b7280", marginBottom: "10px" }}>
            No favorites yet
          </h3>
          <p style={{ color: "#9ca3af" }}>No matching favorites found.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredFavorites.map((app) => (
            <div
              key={app.id}
              style={{
                padding: "24px",
                borderRadius: "12px",
                background: "#fff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                border: "1px solid #e5e7eb",
                transition: "transform 0.2s, box-shadow 0.2s",
                position: "relative",
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
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  fontSize: "20px",
                }}
              >
                ⭐
              </div>

              <div style={{ marginBottom: "12px" }}>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    margin: "0 0 8px 0",
                  }}
                >
                  {app.name}
                </h3>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      style={{
                        color: i < app.rating ? "#fbbf24" : "#e5e7eb",
                        fontSize: "16px",
                      }}
                    >
                      ★
                    </span>
                  ))}
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      marginLeft: "4px",
                    }}
                  >
                    ({app.rating}/5)
                  </span>
                </div>
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
                  Added {app.favoritedDate}
                </span>
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
                  onClick={() => handleRemoveFavorite(app.id)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    borderRadius: "6px",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#fee2e2")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#fef2f2")
                  }
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
