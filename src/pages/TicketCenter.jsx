import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageEmpty, PageError, PageLoading } from "../components/PageStates";
import { ticketsBackend } from "../services/backendApis";
import {
  getTicketStatusLabel,
  getTicketStatusPillStyle,
  normalizeTicketStatus,
} from "../utils/ticketStatus";
import "./Support.css";

// Keep list reasonably fresh without spamming.
const TICKETS_POLL_MS = 30_000;

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

export default function TicketCenter() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [tickets, setTickets] = useState([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const inFlightRef = useState(() => ({ active: false, seq: 0 }))[0];

  const load = async ({ initial = false } = {}) => {
    if (inFlightRef.active) return;
    inFlightRef.active = true;
    const requestSeq = (inFlightRef.seq += 1);
    if (initial) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await ticketsBackend.my();
      // Ignore stale responses.
      if (requestSeq !== inFlightRef.seq) return;
      setTickets(normalizeTicketsList(data));
      setLastUpdatedAt(Date.now());
      setError("");
    } catch (e) {
      if (requestSeq !== inFlightRef.seq) return;
      if (initial) setTickets([]);
      setError(e?.message || "Failed to load tickets.");
    } finally {
      if (requestSeq === inFlightRef.seq) {
        setLoading(false);
        setRefreshing(false);
      }
      inFlightRef.active = false;
    }
  };

  useEffect(() => {
    void load({ initial: true });
  }, []);

  useEffect(() => {
    let intervalId = null;
    const clear = () => {
      if (intervalId != null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
    const tick = () => {
      if (document.visibilityState === "visible") {
        void load({ initial: false });
      }
    };
    const start = () => {
      clear();
      if (document.visibilityState !== "visible") return;
      intervalId = window.setInterval(tick, TICKETS_POLL_MS);
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") clear();
      else start();
    };
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clear();
      document.removeEventListener("visibilitychange", onVis);
    };
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
    <div className="support-page" style={{ maxWidth: 980, margin: "0 auto", padding: 4 }}>
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
          <h1 className="support-title" style={{ margin: 0, fontSize: 26, letterSpacing: "-0.3px" }}>
            Support Tickets
          </h1>
          <div className="support-subtitle" style={{ marginTop: 4 }}>
            Track your requests and updates from our support team.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => void load({ initial: false })}
            disabled={loading || refreshing}
            className="support-action"
            style={ghostBtnStyle(loading || refreshing)}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/support/ticket")}
            className="support-btn"
            style={primaryBtnStyle}
          >
            Raise ticket
          </button>
        </div>
      </div>

      <div className="ticket-inbox">
        <div className="ticket-inbox-head">
          <strong>Inbox</strong>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: "#64748b" }}>
              {lastUpdatedAt ? "Synced" : ""}
            </span>
          </div>
        </div>
        {loading ? <PageLoading title="Loading tickets..." /> : null}
        {!loading && error ? <PageError message={error} onRetry={() => void load()} /> : null}
        {!loading && !error && sorted.length === 0 ? (
          <PageEmpty
            title="No tickets yet"
            subtitle="When you raise a ticket, it’ll show up here with updates."
          />
        ) : null}

        {!loading && !error && sorted.length > 0 ? (
          <div className="ticket-inbox-list">
            {sorted.map((t, idx) => {
              const id = t?.id ?? t?.ticketId ?? t?.code ?? idx;
              const title =
                safeStr(t?.title) || safeStr(t?.subject) || safeStr(t?.summary) || "Support ticket";
              const status = normalizeTicketStatus(t?.status);
              const statusLabel = getTicketStatusLabel(status);
              const updated =
                t?.updatedAt || t?.lastUpdatedAt || t?.createdAt
                  ? new Date(t?.updatedAt || t?.lastUpdatedAt || t?.createdAt).toLocaleString()
                  : "";
              const updatedMs = new Date(t?.updatedAt || t?.lastUpdatedAt || t?.createdAt || 0).getTime() || 0;
              const recent = updatedMs && Date.now() - updatedMs < 24 * 60 * 60 * 1000;
              const preview =
                safeStr(t?.latestMessage) ||
                safeStr(t?.lastMessage) ||
                safeStr(t?.lastReply) ||
                safeStr(t?.description || t?.message) ||
                "";
              return (
                <button
                  key={String(id)}
                  type="button"
                  onClick={() => navigate(`/tickets/${encodeURIComponent(String(id))}`)}
                  className="ticket-row"
                  style={{ borderBottom: idx === sorted.length - 1 ? "none" : undefined }}
                >
                  <div className="ticket-row-top">
                    <div className="ticket-row-title">
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span className={`ticket-row-dot ${recent ? "recent" : ""}`} aria-hidden="true" />
                        <div style={{ minWidth: 0 }}>
                          <strong>{title}</strong>
                          <div className="ticket-row-meta">
                            <span>{safeStr(id) ? `Ticket #${id}` : "Ticket"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "grid", justifyItems: "end", gap: 6 }}>
                      <span style={{ ...getTicketStatusPillStyle(status), padding: "6px 10px", borderRadius: 999, fontSize: 11, fontWeight: 950, letterSpacing: "0.3px" }}>
                        {statusLabel}
                      </span>
                      <span className="ticket-row-time">{updated ? `Updated ${updated}` : ""}</span>
                    </div>
                  </div>
                  {preview ? <div className="ticket-row-preview">{preview}</div> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      <div style={{ marginTop: 10, color: "#64748b", fontSize: 12, fontWeight: 700 }}>
        {refreshing
          ? "Checking for updates…"
          : lastUpdatedAt
            ? "Updated just now"
            : ""}
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

