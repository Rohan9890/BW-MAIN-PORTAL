import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageError, PageLoading } from "../components/PageStates";
import { ticketsBackend } from "../services/backendApis";
import { showError, showSuccess } from "../services/toast";

function safeStr(v) {
  const s = String(v ?? "").trim();
  return s && s !== "null" ? s : "";
}

function normalizeMessages(ticket) {
  const msgs = ticket?.messages || ticket?.replies || ticket?.conversation || ticket?.thread;
  if (Array.isArray(msgs)) return msgs;
  return [];
}

function isUserMessage(m) {
  const role = safeStr(m?.role || m?.senderRole || m?.fromRole).toUpperCase();
  const sender = safeStr(m?.sender || m?.author || m?.from).toUpperCase();
  const type = safeStr(m?.senderType || m?.type).toUpperCase();
  if (type === "USER" || type === "CUSTOMER") return true;
  if (role === "USER" || role === "CUSTOMER") return true;
  if (sender === "USER" || sender === "YOU" || sender === "ME") return true;
  if (m?.fromUser === true || m?.byUser === true) return true;
  return false;
}

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await ticketsBackend.getById(id);
      setTicket(data || null);
    } catch (e) {
      setTicket(null);
      setError(e?.message || "Failed to load ticket details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    void load();
  }, [id]);

  const title = useMemo(() => {
    return (
      safeStr(ticket?.title) ||
      safeStr(ticket?.subject) ||
      safeStr(ticket?.summary) ||
      `Ticket #${id}`
    );
  }, [ticket, id]);

  const status = safeStr(ticket?.status) || "OPEN";
  const createdAt = ticket?.createdAt
    ? new Date(ticket.createdAt).toLocaleString()
    : "";

  const messages = useMemo(() => normalizeMessages(ticket), [ticket]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    const text = replyText.trim();
    if (!text || !id) return;
    setReplySending(true);
    try {
      await ticketsBackend.reply({
        ticketId: id,
        id,
        message: text,
        body: text,
      });
      setReplyText("");
      showSuccess("Reply sent");
      await load();
    } catch (err) {
      showError(err?.message || "Could not send reply");
    } finally {
      setReplySending(false);
    }
  };

  const cardShell = {
    background: "linear-gradient(145deg, #ffffff 0%, #f8fbff 100%)",
    border: "1px solid rgba(37,99,235,0.12)",
    boxShadow: "0 10px 26px rgba(15,23,42,0.08)",
    borderRadius: 16,
    overflow: "hidden",
  };

  const statusTone =
    String(status).toUpperCase() === "CLOSED" || String(status).toUpperCase() === "RESOLVED"
      ? "#15803d"
      : String(status).toUpperCase() === "OPEN"
        ? "#1d4ed8"
        : "#92400e";

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => navigate("/support/chat")}
          style={{
            border: "1px solid rgba(148,163,184,0.5)",
            background: "#fff",
            borderRadius: 12,
            padding: "8px 10px",
            cursor: "pointer",
            fontWeight: 900,
          }}
        >
          ← Tickets
        </button>
        <Link to="/support/ticket" style={{ color: "#2563eb", fontWeight: 900 }}>
          Raise a new ticket
        </Link>
      </div>

      <div style={cardShell}>
        {loading ? <PageLoading title="Loading ticket..." /> : null}
        {!loading && error ? <PageError message={error} onRetry={() => void load()} /> : null}

        {!loading && !error && ticket ? (
          <div style={{ padding: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "flex-start",
                marginBottom: 12,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
                  Ticket #{safeStr(ticket?.id) || safeStr(id)}
                  {createdAt ? ` · Created ${createdAt}` : ""}
                </div>
                <h1
                  style={{
                    margin: "6px 0 0",
                    fontSize: 22,
                    letterSpacing: "-0.2px",
                    color: "#0f172a",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {title}
                </h1>
              </div>
              <span
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: `1px solid ${statusTone}33`,
                  background: `${statusTone}14`,
                  fontSize: 11,
                  fontWeight: 950,
                  color: statusTone,
                }}
              >
                {String(status).toUpperCase().replace(/_/g, " ")}
              </span>
            </div>

            {safeStr(ticket?.description || ticket?.message) ? (
              <div
                style={{
                  marginBottom: 14,
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(148,163,184,0.22)",
                  background: "#ffffff",
                  color: "#334155",
                  lineHeight: 1.55,
                }}
              >
                {safeStr(ticket?.description || ticket?.message)}
              </div>
            ) : null}

            <div style={{ fontWeight: 950, marginBottom: 10, color: "#0f172a" }}>Conversation</div>

            <div
              style={{
                display: "grid",
                gap: 10,
                marginBottom: 14,
                maxHeight: 420,
                overflowY: "auto",
                paddingRight: 4,
              }}
            >
              {messages.length === 0 ? (
                <div style={{ color: "#64748b", padding: 12, borderRadius: 14 }}>
                  No replies yet. Send a message below.
                </div>
              ) : (
                messages.map((m, idx) => {
                  const userSide = isUserMessage(m);
                  const who = safeStr(m?.author || m?.from || m?.sender || m?.role) || (userSide ? "You" : "Support");
                  const text = safeStr(m?.message || m?.text || m?.body) || "";
                  const at = m?.createdAt || m?.time || m?.sentAt;
                  const time = at ? new Date(at).toLocaleString() : "";
                  return (
                    <div
                      key={`${idx}-${who}`}
                      style={{
                        display: "flex",
                        justifyContent: userSide ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "min(92%, 520px)",
                          borderRadius: 14,
                          padding: "10px 12px",
                          background: userSide ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "#f1f5f9",
                          color: userSide ? "#fff" : "#0f172a",
                          border: userSide ? "none" : "1px solid rgba(148,163,184,0.25)",
                          boxShadow: userSide ? "0 4px 14px rgba(37,99,235,0.25)" : "none",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            marginBottom: 6,
                            opacity: 0.92,
                          }}
                        >
                          <div style={{ fontWeight: 950, fontSize: 12 }}>{who}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85 }}>{time}</div>
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{text}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={handleSendReply}
              style={{
                border: "1px solid rgba(37,99,235,0.15)",
                borderRadius: 14,
                padding: 12,
                background: "linear-gradient(180deg, rgba(239,246,255,0.65), #fff)",
              }}
            >
              <div style={{ fontWeight: 950, marginBottom: 8, color: "#0f172a", fontSize: 13 }}>
                Reply
              </div>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                placeholder="Write a message…"
                style={{
                  width: "100%",
                  resize: "vertical",
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.35)",
                  padding: 10,
                  fontFamily: "inherit",
                  fontSize: 13,
                  marginBottom: 10,
                }}
              />
              <button
                type="submit"
                disabled={replySending || !replyText.trim()}
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: "none",
                  fontWeight: 900,
                  cursor: replySending ? "wait" : "pointer",
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  color: "#fff",
                  opacity: replyText.trim() ? 1 : 0.55,
                }}
              >
                {replySending ? "Sending…" : "Send"}
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
