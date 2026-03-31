import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBrand } from "../context/BrandContext";
import "./RaiseTicket.css";

// TODO: connect to backend API
const createTicket = async (payload) => {
  // Replace with: const res = await fetch("/api/support/tickets", { method: "POST", body: JSON.stringify(payload) });
  // return await res.json();
  const ticketId = `TKT-${Date.now().toString().slice(-6)}`;
  return { ok: true, ticketId, payload };
};

const CATEGORIES = ["Billing", "Technical", "Account", "General"];
const PRIORITIES = ["Low", "Medium", "High"];

const PRIORITY_COLORS = {
  Low: { bg: "#dcfce7", color: "#15803d" },
  Medium: { bg: "#fef3c7", color: "#d97706" },
  High: { bg: "#fee2e2", color: "#dc2626" },
};

const EMPTY_FORM = {
  subject: "",
  category: "",
  priority: "",
  description: "",
  file: null,
};

export default function RaiseTicket() {
  const navigate = useNavigate();
  const { brand, defaultBrand } = useBrand();
  const companyName = brand?.name || defaultBrand?.name || "Bold and Wise";
  const logoUrl = brand?.logoUrl || defaultBrand?.logoUrl || "/logo.png";

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(null); // { ticketId }

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0] || null;
    setForm((prev) => ({ ...prev, file }));
  }

  function validate() {
    const errs = {};
    if (!form.subject.trim()) errs.subject = "Subject is required.";
    if (!form.category) errs.category = "Please select a category.";
    if (!form.priority) errs.priority = "Please select a priority.";
    if (!form.description.trim()) errs.description = "Description is required.";
    else if (form.description.trim().length < 20)
      errs.description = "Description must be at least 20 characters.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        subject: form.subject.trim(),
        category: form.category,
        priority: form.priority,
        description: form.description.trim(),
        fileName: form.file?.name || null,
      };

      const result = await createTicket(payload);

      if (result.ok) {
        setSuccess({ ticketId: result.ticketId });
        setForm(EMPTY_FORM);
        setErrors({});
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="rt-page">
      {/* ── Company Header ── */}
      <header className="rt-header">
        <div className="rt-header-brand">
          <img src={logoUrl} alt={companyName} className="rt-header-logo" />
          <span className="rt-header-name">{companyName}</span>
        </div>
        <button className="rt-back-btn" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
      </header>

      {/* ── Content ── */}
      <div className="rt-content">
        <div className="rt-card">
          {/* Card Header */}
          <div className="rt-card-header">
            <div className="rt-card-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <div>
              <h1 className="rt-card-title">Raise a Ticket</h1>
              <p className="rt-card-subtitle">
                Submit a request and our team will get back to you
              </p>
            </div>
          </div>

          {/* ── Success Banner ── */}
          {success && (
            <div className="rt-success">
              <div className="rt-success-icon">✓</div>
              <div className="rt-success-body">
                <p className="rt-success-title">
                  Ticket submitted successfully!
                </p>
                <p className="rt-success-id">
                  Your ticket ID:{" "}
                  <strong className="rt-ticket-id">{success.ticketId}</strong>
                </p>
                <p className="rt-success-note">
                  Our team will review and respond within 24 hours.
                </p>
              </div>
              <button
                className="rt-success-close"
                onClick={() => setSuccess(null)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          {/* ── Form ── */}
          <form className="rt-form" onSubmit={handleSubmit} noValidate>
            {/* Subject */}
            <div className="rt-field">
              <label className="rt-label" htmlFor="rt-subject">
                Subject <span className="rt-required">*</span>
              </label>
              <input
                id="rt-subject"
                className={`rt-input ${errors.subject ? "rt-input--error" : ""}`}
                value={form.subject}
                onChange={(e) => handleChange("subject", e.target.value)}
                placeholder="Brief description of your issue"
                maxLength={120}
              />
              {errors.subject && (
                <span className="rt-error">{errors.subject}</span>
              )}
            </div>

            {/* Category + Priority row */}
            <div className="rt-row">
              <div className="rt-field">
                <label className="rt-label" htmlFor="rt-category">
                  Category <span className="rt-required">*</span>
                </label>
                <select
                  id="rt-category"
                  className={`rt-select ${errors.category ? "rt-input--error" : ""}`}
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <span className="rt-error">{errors.category}</span>
                )}
              </div>

              <div className="rt-field">
                <label className="rt-label">
                  Priority <span className="rt-required">*</span>
                </label>
                <div className="rt-priority-group">
                  {PRIORITIES.map((p) => {
                    const colors = PRIORITY_COLORS[p];
                    const active = form.priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        className={`rt-priority-btn ${active ? "rt-priority-btn--active" : ""}`}
                        style={
                          active
                            ? {
                                background: colors.bg,
                                color: colors.color,
                                borderColor: colors.color,
                              }
                            : {}
                        }
                        onClick={() => handleChange("priority", p)}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                {errors.priority && (
                  <span className="rt-error">{errors.priority}</span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="rt-field">
              <label className="rt-label" htmlFor="rt-description">
                Description <span className="rt-required">*</span>
              </label>
              <textarea
                id="rt-description"
                className={`rt-textarea ${errors.description ? "rt-input--error" : ""}`}
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Please describe your issue in detail…"
                rows={5}
                maxLength={2000}
              />
              <div className="rt-char-count">
                {form.description.length}/2000
              </div>
              {errors.description && (
                <span className="rt-error">{errors.description}</span>
              )}
            </div>

            {/* File upload */}
            <div className="rt-field">
              <label className="rt-label" htmlFor="rt-file">
                Attachment <span className="rt-optional">(optional)</span>
              </label>
              <label htmlFor="rt-file" className="rt-file-label">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                {form.file ? (
                  <span className="rt-file-name">{form.file.name}</span>
                ) : (
                  <span>Click to attach a file</span>
                )}
              </label>
              <input
                id="rt-file"
                type="file"
                className="rt-file-input"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt,.zip"
              />
              <p className="rt-file-hint">
                Supported: JPG, PNG, PDF, DOC, TXT, ZIP — Max 10 MB
              </p>
            </div>

            {/* Actions */}
            <div className="rt-actions">
              <button
                type="button"
                className="rt-btn-ghost"
                onClick={() => {
                  setForm(EMPTY_FORM);
                  setErrors({});
                  setSuccess(null);
                }}
              >
                Clear Form
              </button>
              <button
                type="submit"
                className="rt-btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="rt-spinner" />
                    Submitting…
                  </>
                ) : (
                  "Submit Ticket"
                )}
              </button>
            </div>
          </form>

          {/* Footer hint */}
          <p className="rt-hint">
            Need immediate help?{" "}
            <button
              className="rt-link-btn"
              onClick={() => navigate("/support/chat")}
            >
              Chat with Support
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
