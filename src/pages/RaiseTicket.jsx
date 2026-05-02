import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ticketsBackend } from "../services/backendApis";
import { showError, showSuccess } from "../services/toast";

export default function RaiseTicket() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ subject: "", message: "" });
  const [fieldErrors, setFieldErrors] = useState({});

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (String(form.subject || "").trim().length < 4) return false;
    if (String(form.message || "").trim().length < 10) return false;
    return true;
  }, [form, loading]);

  const submit = async () => {
    if (loading) return;
    setError("");
    const subject = String(form.subject || "").trim();
    const message = String(form.message || "").trim();
    const errs = {};
    if (subject.length < 4) errs.subject = "Subject is required (min 4 characters).";
    if (message.length < 10) errs.message = "Message is required (min 10 characters).";
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      // Send the backend-likely contract, plus compatibility keys.
      const payload = { subject, message, title: subject, description: message };
      if (import.meta?.env?.DEV) {
        console.info("[RaiseTicket] POST /tickets/create payload", payload);
      }
      const res = await ticketsBackend.create(payload);
      const createdId = res?.id || res?.ticketId || res?.ticket?.id;
      showSuccess("Ticket created");
      if (createdId) {
        navigate(`/support/ticket/${encodeURIComponent(String(createdId))}`);
      } else {
        navigate("/support/chat");
      }
    } catch (e) {
      const msg = e?.message || "Failed to create ticket";
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, letterSpacing: "-0.3px" }}>
            Raise a ticket
          </h1>
          <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
            Tell us what you need and we’ll get back quickly.
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/support/chat")}
          style={{
            border: "1px solid rgba(148,163,184,0.5)",
            background: "#fff",
            borderRadius: 12,
            padding: "10px 12px",
            cursor: "pointer",
            fontWeight: 950,
            height: 42,
          }}
        >
          ← My tickets
        </button>
      </div>

      <div
        style={{
          marginTop: 14,
          background: "linear-gradient(145deg, #ffffff 0%, #f8fbff 100%)",
          borderRadius: 16,
          padding: 18,
          border: "1px solid rgba(37,99,235,0.12)",
          boxShadow: "0 10px 26px rgba(15,23,42,0.08)",
        }}
      >
        {error ? (
          <div
            style={{
              marginBottom: 14,
              padding: "12px 14px",
              borderRadius: 12,
              background: "#fff1f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            {error}
          </div>
        ) : null}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          style={{ display: "grid", gap: 12 }}
        >
          <div>
            <label style={labelStyle} htmlFor="ticket-title">
              Subject
            </label>
            <input
              id="ticket-title"
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              placeholder="e.g. Payment failed but amount debited"
              style={inputStyle(Boolean(fieldErrors.subject))}
              disabled={loading}
            />
            {fieldErrors.subject ? (
              <div style={fieldErrorStyle}>{fieldErrors.subject}</div>
            ) : null}
          </div>

          <div>
            <label style={labelStyle} htmlFor="ticket-desc">
              Message
            </label>
            <textarea
              id="ticket-desc"
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              placeholder="Include steps, error messages, and any relevant details."
              style={{
                ...inputStyle(Boolean(fieldErrors.message)),
                minHeight: 140,
                resize: "vertical",
                lineHeight: 1.5,
              }}
              disabled={loading}
            />
            {fieldErrors.message ? (
              <div style={fieldErrorStyle}>{fieldErrors.message}</div>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              border: "none",
              borderRadius: 14,
              padding: "12px 14px",
              fontWeight: 950,
              cursor: loading ? "not-allowed" : "pointer",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff",
              boxShadow: "0 14px 34px rgba(37,99,235,0.24)",
              opacity: canSubmit ? 1 : 0.6,
            }}
          >
            {loading ? "Submitting..." : "Submit ticket"}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontSize: 12,
  fontWeight: 900,
  color: "#0f172a",
};

const fieldErrorStyle = {
  marginTop: 6,
  color: "#b91c1c",
  fontSize: 12,
  fontWeight: 700,
};

const inputStyle = (invalid) => ({
  width: "100%",
  borderRadius: 14,
  border: `1px solid ${invalid ? "#fecaca" : "rgba(148,163,184,0.6)"}`,
  padding: "12px 12px",
  outline: "none",
  background: "#fff",
  boxShadow: invalid ? "0 0 0 3px rgba(239,68,68,0.12)" : "none",
});

