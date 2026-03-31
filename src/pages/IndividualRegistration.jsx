import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { authApi } from "../services";
import "./Registration.css";

const INDIVIDUAL_FIELDS = [
  { name: "fullName", placeholder: "Full Name", col: "left" },
  { name: "email", placeholder: "Email Address", col: "right" },
  { name: "password", placeholder: "Password", col: "left" },
  { name: "phone", placeholder: "Phone Number", col: "right" },
  { name: "city", placeholder: "City", col: "left" },
  { name: "zip", placeholder: "ZIP Code", col: "right" },
  { name: "street", placeholder: "Street Address", col: "left" },
  { name: "referral", placeholder: "Referral Code / Name", col: "right" },
];

function validateEmail(value) {
  const v = String(value || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function validatePhone(value) {
  const digits = normalizePhone(value);
  return digits.length >= 10 && digits.length <= 15;
}

function validatePassword(value) {
  return String(value || "").trim().length >= 6;
}

function getFieldLabel(fieldName) {
  const map = {
    fullName: "Full Name",
    email: "Email Address",
    password: "Password",
    phone: "Phone Number",
    city: "City",
    zip: "ZIP Code",
    street: "Street Address",
    referral: "Referral Code / Name",
  };
  return map[fieldName] || fieldName;
}

function getFieldIcon(fieldName) {
  const map = {
    fullName: "👤",
    email: "✉️",
    password: "🔒",
    phone: "☎️",
    city: "📍",
    zip: "🏷️",
    street: "🏠",
    referral: "🎟️",
  };
  return map[fieldName] || "•";
}

export default function IndividualRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");

  const sections = useMemo(
    () => [
      { title: "Personal Info", subtitle: "Your identity basics.", fields: ["fullName"] },
      {
        title: "Contact Details",
        subtitle: "Where we can reach you.",
        fields: ["email", "phone", "city", "zip", "street"],
      },
      {
        title: "Account Setup",
        subtitle: "Create your credentials.",
        fields: ["password", "referral"],
      },
    ],
    [],
  );

  const requiredFields = useMemo(
    () => ["fullName", "email", "password", "phone", "city", "zip", "street"],
    [],
  );

  const draftErrors = useMemo(() => {
    const errors = {};
    requiredFields.forEach((name) => {
      const value = formData[name];
      if (!String(value || "").trim()) {
        errors[name] = `${getFieldLabel(name)} is required.`;
        return;
      }
      if (name === "email" && !validateEmail(value)) errors[name] = "Enter a valid email address.";
      if (name === "phone" && !validatePhone(value)) errors[name] = "Enter a valid phone number.";
      if (name === "password" && !validatePassword(value)) errors[name] = "Password must be at least 6 characters.";
    });
    return errors;
  }, [formData, requiredFields]);

  const canSubmit = !submitting && termsAccepted && Object.keys(draftErrors).length === 0;

  const getPlaceholder = (fieldName) =>
    INDIVIDUAL_FIELDS.find((f) => f.name === fieldName)?.placeholder || getFieldLabel(fieldName);

  const handleSave = async () => {
    setSubmitError("");
    setSubmitSuccess("");
    setTouched((prev) => {
      const next = { ...prev };
      requiredFields.forEach((f) => {
        next[f] = true;
      });
      return next;
    });

    if (!canSubmit) {
      setSubmitError("Please fix the highlighted fields and try again.");
      return;
    }

    setSubmitting(true);
    try {
      // TODO: connect to backend API
      await authApi.registerIndividual(formData);
      setSubmitSuccess("Registration submitted successfully.");
      setTimeout(() => navigate("/login"), 850);
    } catch (e) {
      setSubmitError(e?.message || "Unable to submit registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-gradient registration-page">
      <div className="card-container registration-card">
        <header className="reg-header">
          <Logo to="/" />
          <Link to="/login">
            <button type="button" className="btn btn-primary">
              Login
            </button>
          </Link>
        </header>

        <h1 className="reg-title">Individual Registration Page</h1>
        <p className="reg-subtitle">Enter your details to create a new account.</p>

        <div className="reg-tabs">
          <button type="button" className="reg-tab active">
            <span className="tab-icon">👤</span>
            Individual Registration
          </button>
          <button
            type="button"
            className="reg-tab"
            onClick={() => navigate("/register/organization")}
          >
            <span className="tab-icon">💼</span>
            Organization Registration
          </button>
        </div>

        <div className="reg-form-title">Create your account</div>

        {sections.map((section) => (
          <div key={section.title} className="reg-section-card">
            <div className="reg-section-head">
              <div>
                <h3 className="reg-section-title">{section.title}</h3>
                <p className="reg-section-sub">{section.subtitle}</p>
              </div>
            </div>
            <div className="reg-section-grid">
              {section.fields.map((fieldName) => {
                const error = touched[fieldName] ? draftErrors[fieldName] : "";
                const showError = !!error;
                const value = formData[fieldName] || "";

                return (
                  <div key={fieldName} className="reg-input-block">
                    <label className="reg-label">{getFieldLabel(fieldName)}</label>
                    <div
                      className={`reg-input-with-icon ${showError ? "reg-input-invalid" : ""}`}
                    >
                      <span className="reg-input-icon" aria-hidden>
                        {getFieldIcon(fieldName)}
                      </span>
                      <input
                        type={fieldName.toLowerCase().includes("password") ? "password" : "text"}
                        className="input reg-premium-input"
                        placeholder={getPlaceholder(fieldName)}
                        value={value}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [fieldName]: e.target.value,
                          }))
                        }
                        onBlur={() => setTouched((prev) => ({ ...prev, [fieldName]: true }))}
                      />
                    </div>
                    {showError && <div className="reg-field-error">{error}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <h3 className="kyc-title">KYC DOCUMENTS UPLOAD</h3>
        <div className="kyc-upload">
          <div className="kyc-cloud">☁</div>
          <p className="kyc-label">UPLOAD ID PROOF</p>
          <p className="kyc-hint">Addhar card, Passport, vote id.</p>
        </div>

        <label className="checkbox-label reg-terms">
          <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
          <span>I agree to the Terms & Conditions</span>
        </label>

        {submitError && <div className="reg-submit-error">{submitError}</div>}
        {submitSuccess && <div className="reg-submit-success">{submitSuccess}</div>}

        <button
          type="button"
          className="btn btn-primary btn-save reg-submit-btn"
          onClick={handleSave}
          disabled={!canSubmit}
        >
          {submitting ? (
            <>
              <span className="reg-btn-spinner" aria-hidden />
              Submitting...
            </>
          ) : (
            "SAVE"
          )}
        </button>
      </div>
    </div>
  );
}
