import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
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

const ORG_FIELDS = [
  { name: "orgName", placeholder: "Organization Name", col: "left" },
  { name: "contactName", placeholder: "Contact Person Name", col: "right" },
  { name: "email", placeholder: "Email Address", col: "left" },
  { name: "password", placeholder: "Password", col: "right" },
  { name: "billing", placeholder: "Billing Address", col: "left" },
  { name: "phone", placeholder: "Phone Number", col: "right" },
  { name: "shipping", placeholder: "Multiple shipping Address", col: "left" },
  { name: "referral", placeholder: "Referral Code / Name", col: "right" },
];

const REG_TYPES = {
  individual: {
    label: "Individual Registration",
    title: "Individual Registration Page",
    fields: INDIVIDUAL_FIELDS,
    kycHint: "Addhar card, Passport, vote id.",
    icon: "👤",
    sections: [
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
    requiredFields: ["fullName", "email", "password", "phone", "city", "zip", "street"],
  },
  organization: {
    label: "Organization Registration",
    title: "Organization Registration Page",
    fields: ORG_FIELDS,
    kycHint: "Company Registration",
    icon: "💼",
    sections: [
      { title: "Organization Info", subtitle: "Company identity.", fields: ["orgName"] },
      {
        title: "Contact Person",
        subtitle: "Primary contact details.",
        fields: ["contactName", "email", "phone"],
      },
      {
        title: "Address / Details",
        subtitle: "Billing and shipping details.",
        fields: ["billing", "shipping"],
      },
      {
        title: "Account Setup",
        subtitle: "Create your credentials.",
        fields: ["password", "referral"],
      },
    ],
    requiredFields: ["orgName", "contactName", "email", "password", "billing", "phone", "shipping"],
  },
};

function getInitialTypeFromPath(pathname) {
  return pathname.includes("/register/organization") ? "organization" : "individual";
}

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

function getFieldMeta(config, fieldName) {
  return config.fields.find((f) => f.name === fieldName) || null;
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
    orgName: "Organization Name",
    contactName: "Contact Person Name",
    billing: "Billing Address",
    shipping: "Shipping Address",
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
    orgName: "🏢",
    contactName: "👤",
    billing: "🧾",
    shipping: "📦",
  };
  return map[fieldName] || "•";
}

export default function Registration() {
  const navigate = useNavigate();
  const location = useLocation();
  const initial = useMemo(() => getInitialTypeFromPath(location.pathname), [location.pathname]);
  const [type, setType] = useState(initial);
  const [formData, setFormData] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [touched, setTouched] = useState({});

  const config = REG_TYPES[type] ?? REG_TYPES.individual;

  const onTypeChange = (nextType) => {
    const normalized = nextType === "organization" ? "organization" : "individual";
    setType(normalized);
    setFormData({});
    setTouched({});
    setSubmitError("");
    setSubmitSuccess("");
    navigate(normalized === "organization" ? "/register/organization" : "/register", { replace: true });
  };

  const draftErrors = useMemo(() => {
    const errors = {};
    const required = config.requiredFields;
    required.forEach((name) => {
      const value = formData[name];
      if (!String(value || "").trim()) {
        errors[name] = `${getFieldLabel(name)} is required.`;
        return;
      }
      if (name === "email" && !validateEmail(value)) {
        errors[name] = "Enter a valid email address.";
      } else if (name === "phone" && !validatePhone(value)) {
        errors[name] = "Enter a valid phone number.";
      } else if (name === "password" && !validatePassword(value)) {
        errors[name] = "Password must be at least 6 characters.";
      }
    });

    return errors;
  }, [config.requiredFields, formData]);

  const canSubmit = !submitting && termsAccepted && Object.keys(draftErrors).length === 0;

  const handleSave = async () => {
    setSubmitError("");
    setSubmitSuccess("");
    setTouched((prev) => {
      const all = {};
      config.requiredFields.forEach((f) => {
        all[f] = true;
      });
      return { ...prev, ...all };
    });

    if (!canSubmit) {
      setSubmitError("Please fix the highlighted fields and try again.");
      return;
    }

    setSubmitting(true);
    try {
      // TODO: connect to backend API
      if (type === "organization") {
        await authApi.registerOrganization(formData);
      } else {
        await authApi.registerIndividual(formData);
      }

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

        <h1 className="reg-title">{config.title}</h1>
        <p className="reg-subtitle">Enter your details to create a new account.</p>

        <div className="reg-switch">
          <label className="reg-switch-label" htmlFor="regType">
            Registration Type
          </label>
          <div className="reg-switch-control">
            <span className="reg-switch-icon" aria-hidden="true">
              {config.icon}
            </span>
            <select
              id="regType"
              className="reg-switch-select"
              value={type}
              onChange={(e) => onTypeChange(e.target.value)}
            >
              <option value="individual">Individual Registration</option>
              <option value="organization">Organization Registration</option>
            </select>
          </div>
        </div>

        <div className="reg-form-title">Create your account</div>

        {config.sections.map((section) => (
          <div key={section.title} className="reg-section-card">
            <div className="reg-section-head">
              <div>
                <h3 className="reg-section-title">{section.title}</h3>
                <p className="reg-section-sub">{section.subtitle}</p>
              </div>
            </div>

            <div className="reg-section-grid">
              {section.fields.map((fieldName) => {
                const meta = getFieldMeta(config, fieldName);
                const value = formData[fieldName] || "";
                const error = touched[fieldName] ? draftErrors[fieldName] : "";
                const showError = !!error;

                return (
                  <div key={fieldName} className="reg-input-block">
                    <label className="reg-label">{getFieldLabel(fieldName)}</label>
                    <div
                      className={`reg-input-with-icon ${
                        showError ? "reg-input-invalid" : ""
                      }`}
                    >
                      <span className="reg-input-icon" aria-hidden>
                        {getFieldIcon(fieldName)}
                      </span>
                      <input
                        type={fieldName.toLowerCase().includes("password") ? "password" : "text"}
                        className="input reg-premium-input"
                        placeholder={meta?.placeholder || getFieldLabel(fieldName)}
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
          <p className="kyc-hint">{config.kycHint}</p>
        </div>

        <label className="checkbox-label reg-terms">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
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
