import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageEmpty, PageError, PageLoading } from "../components/PageStates";
import { ticketsBackend } from "../services/backendApis";

function normalizeTicketsList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function safeStr(v) {
  const s = String(v ?? "").trim();
  return s && s !== "null" ? s : "";
}

function statusPillStyle(status) {
  const st = safeStr(status).toUpperCase();
  if (st === "RESOLVED" || st === "CLOSED") {
    return { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" };
  }
  if (st === "OPEN" || st === "NEW") {
    return { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" };
  }
  if (st === "PENDING") {
    return { background: "#fef9c3", color: "#854d0e", border: "1px solid #fde68a" };
  }
  return { background: "#f1f5f9", color: "#0f172a", border: "1px solid #e2e8f0" };
}

export default function TicketCenter() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tickets, setTickets] = useState([]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await ticketsBackend.my();
      setTickets(normalizeTicketsList(data));
    } catch (e) {
      setTickets([]);
      setError(e?.message || "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const sorted = useMemo(() => {
    const copy = [...tickets];
    copy.sort((a, b) => {
      const ad = new Date(a?.updatedAt || a?.createdAt || 0).getTime() || 0;
      const bd = new Date(b?.updatedAt || b?.createdAt || 0).getTime() || 0;
      return bd - ad;
    });
    return copy;
  }, [tickets]);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 4 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 26, letterSpacing: "-0.3px" }}>
            Support Tickets
          </h1>
          <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
            Track your requests and updates from our support team.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            style={ghostBtnStyle(loading)}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/support/ticket")}
            style={primaryBtnStyle}
          >
            Raise ticket
          </button>
        </div>
      </div>

      <div
        style={{
          background: "linear-gradient(145deg, #ffffff 0%, #f8fbff 100%)",
          border: "1px solid rgba(37,99,235,0.12)",
          boxShadow: "0 10px 26px rgba(15,23,42,0.08)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {loading ? <PageLoading title="Loading tickets..." /> : null}
        {!loading && error ? <PageError message={error} onRetry={() => void load()} /> : null}
        {!loading && !error && sorted.length === 0 ? (
          <PageEmpty
            title="No tickets yet"
            subtitle="When you raise a ticket, it’ll show up here with updates."
          />
        ) : null}

        {!loading && !error && sorted.length > 0 ? (
          <div style={{ display: "grid" }}>
            {sorted.map((t, idx) => {
              const id = t?.id ?? t?.ticketId ?? t?.code ?? idx;
              const title =
                safeStr(t?.title) || safeStr(t?.subject) || safeStr(t?.summary) || "Support ticket";
              const status = safeStr(t?.status) || "OPEN";
              const updated =
                t?.updatedAt || t?.lastUpdatedAt || t?.createdAt
                  ? new Date(t?.updatedAt || t?.lastUpdatedAt || t?.createdAt).toLocaleString()
                  : "";
              return (
                <button
                  key={String(id)}
                  type="button"
                  onClick={() => navigate(`/support/ticket/${encodeURIComponent(String(id))}`)}
                  style={{
                    border: "none",
                    background: "transparent",
                    textAlign: "left",
                    padding: "14px 16px",
                    cursor: "pointer",
                    display: "grid",
                    gap: 8,
                    borderBottom:
                      idx === sorted.length - 1 ? "none" : "1px solid rgba(148,163,184,0.18)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 950,
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {title}
                      </div>
                      <div style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>
                        {safeStr(id) ? `Ticket #${id}` : "Ticket"}{" "}
                        {updated ? `· Updated ${updated}` : ""}
                      </div>
                    </div>
                    <span
                      style={{
                        ...statusPillStyle(status),
                        padding: "6px 10px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 900,
                        letterSpacing: "0.3px",
                        flexShrink: 0,
                      }}
                    >
                      {String(status).toUpperCase()}
                    </span>
                  </div>
                  {safeStr(t?.description || t?.message) ? (
                    <div style={{ color: "#334155", fontSize: 13, lineHeight: 1.4 }}>
                      {safeStr(t?.description || t?.message)}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const primaryBtnStyle = {
  border: "none",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "#fff",
  padding: "10px 12px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 950,
  boxShadow: "0 12px 28px rgba(37,99,235,0.22)",
};

const ghostBtnStyle = (disabled) => ({
  border: "1px solid rgba(148,163,184,0.5)",
  background: "#fff",
  color: "#0f172a",
  padding: "10px 12px",
  borderRadius: 12,
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: 900,
  opacity: disabled ? 0.7 : 1,
});

