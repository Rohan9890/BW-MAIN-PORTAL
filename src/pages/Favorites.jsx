import { useEffect, useMemo, useState } from "react";
import { mockData } from "../services/mockData";

const STORAGE_KEY = "bold-wise-allapps";

const normalizeApps = (items) =>
  (Array.isArray(items) ? items : []).map((app, index) => ({
    ...app,
    id: app.id ?? index + 1,
    rating: app.rating ?? 4,
    favoritedDate: app.favoritedDate ?? "2026-03-30",
  }));

export default function Favorites() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const storedFavorites = normalizeApps(parsed).filter(
          (app) => app.wishlisted,
        );
        setFavorites(storedFavorites);
        return;
      } catch (error) {
        console.warn("Failed parsing saved favorites", error);
      }
    }

    const fallbackFavorites = normalizeApps(mockData.appCatalog.allApps)
      .filter((app) => app.wishlisted)
      .map((app) => ({
        ...app,
        favoritedDate: app.favoritedDate || "2026-03-30",
      }));
    setFavorites(fallbackFavorites);
  }, []);

  const categories = useMemo(
    () => [
      "All",
      ...new Set(favorites.map((app) => app.category).filter(Boolean)),
    ],
    [favorites],
  );

  const filteredFavorites = useMemo(
    () =>
      favorites.filter((app) => {
        const matchesSearch = `${app.name} ${app.description} ${app.category}`
          .toLowerCase()
          .includes(search.trim().toLowerCase());
        const matchesCategory = category === "All" || app.category === category;
        return matchesSearch && matchesCategory;
      }),
    [favorites, search, category],
  );

  const handleRemoveFavorite = (appId) => {
    setFavorites((prev) => prev.filter((item) => item.id !== appId));

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      const next = normalizeApps(parsed).map((app) =>
        app.id === appId
          ? { ...app, wishlisted: false, favoritedDate: null }
          : app,
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.warn("Failed updating favorites storage", error);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "30px" }}>
        <h1
          style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}
        >
          Favorite Applications
        </h1>
        <p style={{ color: "#666", fontSize: "16px" }}>
          Apps wishlisted from All Apps appear here automatically.
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
          <p style={{ color: "#9ca3af" }}>
            Wishlist apps from All Apps and they will show up here.
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
                  {[...Array(5)].map((_, index) => (
                    <span
                      key={index}
                      style={{
                        color:
                          index < (app.rating || 4) ? "#fbbf24" : "#e5e7eb",
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
                    ({app.rating || 4}/5)
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
                  gap: 10,
                  flexWrap: "wrap",
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
