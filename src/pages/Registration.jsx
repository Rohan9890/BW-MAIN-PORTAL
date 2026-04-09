import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Logo from "../components/Logo";
import { showSuccess, showError } from "../services/toast";
import "./Registration.css";

const REGISTER_URL = "http://43.205.116.38:8080/api/v1.0/register";

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
      {
        title: "Personal Info",
        subtitle: "Your identity basics.",
        fields: ["fullName"],
      },
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
    requiredFields: [
      "fullName",
      "email",
      "password",
      "phone",
      "city",
      "zip",
      "street",
    ],
  },
  organization: {
    label: "Organization Registration",
    title: "Organization Registration Page",
    fields: ORG_FIELDS,
    kycHint: "Company Registration",
    icon: "💼",
    sections: [
      {
        title: "Organization Info",
        subtitle: "Company identity.",
        fields: ["orgName"],
      },
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
    requiredFields: [
      "orgName",
      "contactName",
      "email",
      "password",
      "billing",
      "phone",
      "shipping",
    ],
  },
};

function getInitialTypeFromPath(pathname) {
  return pathname.includes("/register/organization")
    ? "organization"
    : "individual";
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

const ALLOWED_DOCUMENT_TYPES = ["PAN", "AADHAAR", "DL", "VOTER_ID"];

function normalizeDocumentType(value) {
  const raw = String(value || "")
    .trim()
    .toUpperCase();
  if (!raw) return "";
  if (raw === "AADHAR") return "AADHAAR";
  if (raw === "VOTER ID") return "VOTER_ID";
  return raw;
}

function getSelectedDocument(formData) {
  if (formData?.selectedFile) return formData.selectedFile;
  if (formData?.documentFile) return formData.documentFile;
  if (formData?.file) return formData.file;
  if (Array.isArray(formData?.documents) && formData.documents[0]) {
    return formData.documents[0];
  }
  return null;
}

function isFileLike(value) {
  const isFile = typeof File !== "undefined" && value instanceof File;
  const isBlob = typeof Blob !== "undefined" && value instanceof Blob;
  return isFile || isBlob;
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
  const initial = useMemo(
    () => getInitialTypeFromPath(location.pathname),
    [location.pathname],
  );
  const [type, setType] = useState(initial);
  const [formData, setFormData] = useState({});
  const [documentType, setDocumentType] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [touched, setTouched] = useState({});

  const config = REG_TYPES[type] ?? REG_TYPES.individual;

  useEffect(() => {
    setDocumentType(
      (prev) =>
        prev ||
        formData.documentType ||
        formData.docType ||
        formData.idType ||
        "",
    );
    setDocumentNumber(
      (prev) =>
        prev ||
        formData.documentNumber ||
        formData.idNumber ||
        formData.documentNo ||
        "",
    );
    setSelectedFile(
      (prev) =>
        prev ||
        formData.selectedFile ||
        formData.documentFile ||
        formData.file ||
        (Array.isArray(formData.documents)
          ? formData.documents[0] || null
          : null),
    );
  }, [formData]);

  const onTypeChange = (nextType) => {
    const normalized =
      nextType === "organization" ? "organization" : "individual";
    setType(normalized);
    setFormData({});
    setDocumentType("");
    setDocumentNumber("");
    setSelectedFile(null);
    setTouched({});
    setSubmitError("");
    setSubmitSuccess("");
    navigate(
      normalized === "organization" ? "/register/organization" : "/register",
      { replace: true },
    );
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

  const canSubmit =
    !submitting && termsAccepted && Object.keys(draftErrors).length === 0;

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

    const selectedDocument = selectedFile;
    if (!selectedDocument) {
      setSubmitError("Please upload document");
      return;
    }

    if (!documentType) {
      setSubmitError("Please select document type");
      return;
    }

    if (!documentNumber) {
      setSubmitError("Please enter document number");
      return;
    }

    const fileType = String(selectedDocument?.type || "").toLowerCase();
    if (
      fileType &&
      !fileType.startsWith("image/") &&
      fileType !== "application/pdf"
    ) {
      setSubmitError("Please upload a valid image or PDF document");
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("file", selectedDocument);
      payload.append("documentType", documentType);
      payload.append("documentNumber", documentNumber);
      payload.append(
        "entityType",
        type === "organization" ? "Organization" : "Individual",
      );
      payload.append(
        "name",
        formData.fullName || formData.orgName || formData.contactName || "",
      );
      payload.append("email", String(formData.email || ""));
      payload.append("phoneNumber", String(formData.phone || ""));
      payload.append("password", String(formData.password || ""));

      const response = await fetch(REGISTER_URL, {
        method: "POST",
        body: payload,
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.message || "Registration failed");
      }

      showSuccess("Registration successful");
      setSubmitSuccess("Registration submitted successfully.");
      setFormData({});
      setDocumentType("");
      setDocumentNumber("");
      setSelectedFile(null);
      setTouched({});
      setTimeout(() => navigate("/login"), 1200);
    } catch (e) {
      const msg = e?.message || "Registration failed";
      showError(msg);
      setSubmitError(msg);
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
        <p className="reg-subtitle">
          Enter your details to create a new account.
        </p>

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
                    <label className="reg-label">
                      {getFieldLabel(fieldName)}
                    </label>
                    <div
                      className={`reg-input-with-icon ${
                        showError ? "reg-input-invalid" : ""
                      }`}
                    >
                      <span className="reg-input-icon" aria-hidden>
                        {getFieldIcon(fieldName)}
                      </span>
                      <input
                        type={
                          fieldName.toLowerCase().includes("password")
                            ? "password"
                            : "text"
                        }
                        className="input reg-premium-input"
                        placeholder={
                          meta?.placeholder || getFieldLabel(fieldName)
                        }
                        value={value}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [fieldName]: e.target.value,
                          }))
                        }
                        onBlur={() =>
                          setTouched((prev) => ({ ...prev, [fieldName]: true }))
                        }
                      />
                    </div>
                    {showError && (
                      <div className="reg-field-error">{error}</div>
                    )}
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
          <div className="reg-section-grid">
            <div className="reg-input-block">
              <label className="reg-label" htmlFor="document-type">
                Document Type
              </label>
              <div className="reg-input-with-icon">
                <span className="reg-input-icon" aria-hidden>
                  🪪
                </span>
                <select
                  id="document-type"
                  className="input reg-premium-input"
                  value={documentType}
                  onChange={(e) => {
                    setDocumentType(e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      documentType: e.target.value,
                    }));
                  }}
                >
                  <option value="">Select Document Type</option>
                  <option value="PAN">PAN</option>
                  <option value="AADHAAR">Aadhaar</option>
                  <option value="DL">Driving License</option>
                  <option value="VOTER_ID">Voter ID</option>
                </select>
              </div>
            </div>

            <div className="reg-input-block">
              <label className="reg-label" htmlFor="document-number">
                Document Number
              </label>
              <div className="reg-input-with-icon">
                <span className="reg-input-icon" aria-hidden>
                  #
                </span>
                <input
                  id="document-number"
                  type="text"
                  className="input reg-premium-input"
                  placeholder="Enter Document Number"
                  value={documentNumber}
                  onChange={(e) => {
                    setDocumentNumber(e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      documentNumber: e.target.value,
                    }));
                  }}
                />
              </div>
            </div>

            <div className="reg-input-block">
              <label className="reg-label" htmlFor="document-file">
                Document Upload
              </label>
              <div className="reg-input-with-icon">
                <span className="reg-input-icon" aria-hidden>
                  📎
                </span>
                <input
                  id="document-file"
                  type="file"
                  className="input reg-premium-input"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    setSelectedFile(e.target.files[0]);
                    setFormData((prev) => ({
                      ...prev,
                      selectedFile: e.target.files[0] || null,
                    }));
                  }}
                />
              </div>
            </div>
          </div>
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
        {submitSuccess && (
          <div className="reg-submit-success">{submitSuccess}</div>
        )}

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
