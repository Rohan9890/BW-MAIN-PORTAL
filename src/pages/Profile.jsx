import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { normalizeProfilePayload, useAuth } from "../context/AuthContext";
import { kycBackend, profileBackend } from "../services/backendApis";
import { getApiOrigin } from "../services/apiConfig";
import { showError, showSuccess } from "../services/toast";
import { maskDocumentNumber, safeUpper } from "../utils/mask";
import "./Profile.css";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kyc, setKyc] = useState(null);
  const [kycError, setKycError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ name: "", phoneNumber: "" });
  const [draftErrors, setDraftErrors] = useState({});
  const fileRef = useRef(null);
  const kycFileRef = useRef(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [kycUploading, setKycUploading] = useState(false);
  const [kycResubmitting, setKycResubmitting] = useState(false);
  const navigate = useNavigate();
  const { token: authToken, hydrateProfile, logout } = useAuth();

  useEffect(() => {
    if (!authToken) {
      navigate("/login", {
        replace: true,
        state: { message: "Please login to continue" },
      });
      return;
    }
    void fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      if (!authToken) {
        navigate("/login", {
          replace: true,
          state: { message: "Please login to continue" },
        });
        return;
      }

      const data = await profileBackend.getProfile();
      const normalized = normalizeProfilePayload(data || null);
      setProfile(normalized || null);
      void hydrateProfile();
      setDraft({
        name: String(normalized?.name || ""),
        phoneNumber: String(normalized?.phoneNumber || ""),
      });
      setDraftErrors({});
      setEditMode(false);

      setKycError("");
      try {
        const kycRes = await kycBackend.me();
        setKyc(kycRes || null);
      } catch (e) {
        setKyc(null);
        setKycError(e?.message || "Unable to load KYC details.");
      }
    } catch (err) {
      const message =
        err?.message ||
        (typeof err === "string" ? err : "") ||
        "Failed to load profile. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const photoUrl = useMemo(() => {
    const raw =
      String(profile?.photoUrl || profile?.photoPath || profile?.photo || "").trim();
    if (!raw || raw === "null") return "";
    const resolved = resolveUploadsUrl(raw);
    return `${resolved}${resolved.includes("?") ? "&" : "?"}t=${Date.now()}`;
  }, [profile?.photoUrl, profile?.photoPath, profile?.photo]);

  const accountVerified = Boolean(profile?.isAccountVerified);

  const kycNested = profile?.kyc && typeof profile.kyc === "object" ? profile.kyc : null;
  const kycStatusRaw = safeUpper(
    kyc?.status || kycNested?.status || profile?.kycStatus || "",
  );
  const kycStatus = (() => {
    if (kycStatusRaw === "APPROVED") return "APPROVED";
    if (kycStatusRaw === "PENDING") return "PENDING";
    if (kycStatusRaw === "REJECTED") return "REJECTED";
    // Only treat "isKycVerified" as meaningful when backend status is approved.
    // Never show verified just because documents were uploaded.
    if (Boolean(profile?.isKycVerified) && kycStatusRaw === "APPROVED") return "APPROVED";
    return "PENDING";
  })();

  const kycBadge = (() => {
    if (kycStatus === "APPROVED") return { label: "KYC Approved", tone: "success" };
    if (kycStatus === "REJECTED") return { label: "KYC Rejected", tone: "danger" };
    return { label: "KYC Pending", tone: "warning" };
  })();

  const accountBadge = accountVerified
    ? { label: "Account Verified", tone: "success" }
    : { label: "Account Unverified", tone: "neutral" };

  const copyReferral = async () => {
    const code = String(profile?.referralCode || "").trim();
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      showSuccess("Referral code copied");
    } catch {
      showError("Could not copy referral code");
    }
  };

  const validateDraft = (nextDraft) => {
    const errs = {};
    const name = String(nextDraft?.name || "").trim();
    const phone = String(nextDraft?.phoneNumber || "").replace(/\s+/g, "");

    if (!name) errs.name = "Name is required.";

    const digits = phone.replace(/\D/g, "");
    if (!digits) errs.phoneNumber = "Phone number is required.";
    else if (digits.length !== 10) errs.phoneNumber = "Enter a 10-digit phone number.";

    return { errs, values: { name, phoneNumber: digits } };
  };

  const saveProfile = async () => {
    if (saving) return;
    const { errs, values } = validateDraft(draft);
    setDraftErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      await profileBackend.updateProfile(values);
      showSuccess("Profile updated");
      setEditMode(false);
      await fetchProfile(); // refresh from GET (single source of truth)
    } catch (e) {
      showError(e?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const onPickPhoto = (file) => {
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) {
      showError("Please select an image file");
      return;
    }
    // Backend enforces a strict upload cap (observed: "Maximum upload size exceeded").
    // Keep this conservative to avoid server-side 500s.
    if (file.size > 1 * 1024 * 1024) {
      showError("Image is too large (max 1MB). Please compress and retry.");
      return;
    }
    const url = URL.createObjectURL(file);
    setPhotoFile(file);
    setPhotoPreview(url);
  };

  const cancelPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview("");
    setPhotoFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const rejectionReason = String(
    kyc?.rejectionReason ||
      kyc?.rejectReason ||
      kyc?.reason ||
      kycNested?.rejectionReason ||
      kycNested?.rejectReason ||
      "",
  ).trim();

  const uploadKycDocument = async () => {
    const file = kycFileRef.current?.files?.[0];
    if (!file) {
      showError("Choose a document to upload.");
      return;
    }
    setKycUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await kycBackend.upload(fd);
      showSuccess("KYC document uploaded");
      if (kycFileRef.current) kycFileRef.current.value = "";
      await fetchProfile();
    } catch (e) {
      showError(e?.message || "KYC upload failed");
    } finally {
      setKycUploading(false);
    }
  };

  const resubmitKyc = async () => {
    setKycResubmitting(true);
    try {
      await kycBackend.resubmit({});
      showSuccess("KYC resubmitted for review");
      await fetchProfile();
    } catch (e) {
      showError(e?.message || "Could not resubmit KYC");
    } finally {
      setKycResubmitting(false);
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile || photoUploading) return;
    setPhotoUploading(true);
    try {
      await profileBackend.uploadPhoto(photoFile);
      showSuccess("Profile photo updated");
      cancelPhoto();
      await fetchProfile();
    } catch (e) {
      const status = Number(e?.status) || 0;
      if (status >= 500) {
        const backendMsg =
          (e?.payload && typeof e.payload === "object" && e.payload.message) ||
          e?.message ||
          "";
        showError(
          backendMsg
            ? `Upload failed (server error): ${backendMsg}`
            : "Upload failed due to a server error. Try a smaller JPG/PNG (≤ 6MB) and retry.",
        );
      } else {
        showError(e?.message || "Failed to upload photo");
      }
    } finally {
      setPhotoUploading(false);
    }
  };

  if (loading)
    return (
      <div className="pf-page">
        <div className="pf-shell">
          <div className="pf-hero pf-hero--skeleton">
            <div className="pf-sk-avatar" />
            <div className="pf-sk-lines">
              <div className="pf-sk-line pf-sk-line--h" />
              <div className="pf-sk-line" />
              <div className="pf-sk-line pf-sk-line--sm" />
            </div>
            <div className="pf-sk-actions">
              <div className="pf-sk-pill" />
              <div className="pf-sk-pill" />
              <div className="pf-sk-btn" />
            </div>
          </div>

          <div className="pf-columns">
            <div className="pf-col">
              <div className="pf-card pf-card--skeleton" />
              <div className="pf-card pf-card--skeleton" />
            </div>
            <div className="pf-col">
              <div className="pf-card pf-card--skeleton" />
              <div className="pf-card pf-card--skeleton" />
            </div>
          </div>
        </div>
      </div>
    );

  if (error) {
    return (
      <div className="pf-page">
        <div className="pf-shell">
          <div className="pf-error">
            <div className="pf-error-title">Couldn’t load your profile</div>
            <div className="pf-error-sub">{error}</div>
            <div className="pf-error-actions">
              <button type="button" className="pf-btn pf-btn--primary" onClick={() => void fetchProfile()}>
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="pf-page">
        <div className="pf-shell">
          <div className="pf-empty">
            <div className="pf-empty-title">No profile data found</div>
            <div className="pf-empty-sub">Try refreshing this page.</div>
            <div className="pf-empty-actions">
              <button type="button" className="pf-btn pf-btn--primary" onClick={() => void fetchProfile()}>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userId = String(profile?.id || window.localStorage.getItem("userId") || "").trim();
  const email = String(profile?.email || "").trim();
  const name = String(profile?.name || "User").trim();
  const phone = String(profile?.phoneNumber || "").trim();

  const docType = String(kyc?.documentType || profile?.documentType || "").trim();
  const docNumber = maskDocumentNumber(kyc?.documentNumber || profile?.documentNumber);
  const referralCode = String(profile?.referralCode || "").trim();
  const filePath = String(kyc?.filePath || profile?.filePath || "").trim();
  const uploadedAt = kyc?.uploadedAt ? new Date(kyc.uploadedAt) : null;

  return (
    <div className="pf-page">
      <div className="pf-shell">
        <div className="pf-hero">
          <div className="pf-hero-left">
            <div className="pf-avatar">
              {photoPreview ? (
                <img className="pf-avatar-img" src={photoPreview} alt="New profile preview" />
              ) : photoUrl ? (
                <img
                  className="pf-avatar-img"
                  src={photoUrl}
                  alt="Profile"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                  }}
                />
              ) : (
                <div className="pf-avatar-fallback">{(name || "U").charAt(0).toUpperCase()}</div>
              )}
            </div>

            <div className="pf-photo-actions">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="pf-file"
                onChange={(e) => onPickPhoto(e.target.files?.[0])}
              />
              <button
                type="button"
                className="pf-btn pf-btn--ghost"
                onClick={() => fileRef.current?.click()}
                disabled={photoUploading}
              >
                {photoUrl ? "Change photo" : "Upload photo"}
              </button>
              {photoPreview ? (
                <button
                  type="button"
                  className="pf-btn pf-btn--danger"
                  onClick={cancelPhoto}
                  disabled={photoUploading}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>

          <div className="pf-hero-center">
            <div className="pf-identity">
              <div className="pf-name">{name || "—"}</div>
              <div className="pf-email">{email || "—"}</div>
              <div className="pf-meta-row">
                <span className="pf-meta-icon" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M4 20a8 8 0 0 1 16 0"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <div className="pf-meta-text">
                  <div className="pf-meta-k">User ID</div>
                  <div className="pf-meta-v pf-mono">{userId || "—"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pf-hero-right">
            <div className="pf-badges">
              <span className={`pf-badge pf-badge--${accountBadge.tone}`}>{accountBadge.label}</span>
              <span className={`pf-badge pf-badge--${kycBadge.tone}`}>{kycBadge.label}</span>
            </div>

            <div className="pf-hero-actions">
              {!editMode ? (
                <button type="button" className="pf-btn pf-btn--ghost" onClick={() => setEditMode(true)}>
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="pf-btn pf-btn--ghost"
                    onClick={() => {
                      setEditMode(false);
                      setDraft({
                        name: String(profile?.name || ""),
                        phoneNumber: String(profile?.phoneNumber || ""),
                      });
                      setDraftErrors({});
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="pf-btn pf-btn--primary"
                    onClick={() => void saveProfile()}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {photoPreview ? (
          <div className="pf-upload-bar">
            <div className="pf-upload-left">
              <img className="pf-upload-thumb" src={photoPreview} alt="Selected preview" />
              <div>
                <div className="pf-upload-title">Preview ready</div>
                <div className="pf-upload-sub">Upload to apply your new profile photo.</div>
              </div>
            </div>
            <button
              type="button"
              className="pf-btn pf-btn--primary"
              onClick={() => void uploadPhoto()}
              disabled={photoUploading}
            >
              {photoUploading ? "Uploading..." : "Upload photo"}
            </button>
          </div>
        ) : null}

        <div className="pf-columns">
          <div className="pf-col">
            <section className="pf-card pf-card--personal">
              <header className="pf-card-head">
                <div>
                  <div className="pf-card-title">Personal Information</div>
                  <div className="pf-card-sub">Your primary account details.</div>
                </div>
              </header>
              <div className="pf-card-body">
                <div className="pf-fields">
                  <div className="pf-field">
                    <div className="pf-label">Name</div>
                    {!editMode ? (
                      <div className="pf-value">{name || "—"}</div>
                    ) : (
                      <>
                        <input
                          className={`pf-input ${draftErrors.name ? "pf-input--error" : ""}`}
                          type="text"
                          value={draft.name}
                          onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                          onBlur={() =>
                            setDraftErrors((prev) => ({
                              ...prev,
                              ...(validateDraft(draft).errs || {}),
                            }))
                          }
                          placeholder="Enter your name"
                          disabled={saving}
                        />
                        {draftErrors.name ? <div className="pf-error-text">{draftErrors.name}</div> : null}
                      </>
                    )}
                  </div>

                  <div className="pf-field">
                    <div className="pf-label">Email</div>
                    <div className="pf-value">{email || "—"}</div>
                  </div>

                  <div className="pf-field">
                    <div className="pf-label">Phone</div>
                    {!editMode ? (
                      <div className="pf-value">{phone || "—"}</div>
                    ) : (
                      <>
                        <input
                          className={`pf-input ${draftErrors.phoneNumber ? "pf-input--error" : ""}`}
                          type="tel"
                          inputMode="numeric"
                          value={draft.phoneNumber}
                          onChange={(e) => setDraft((p) => ({ ...p, phoneNumber: e.target.value }))}
                          onBlur={() =>
                            setDraftErrors((prev) => ({
                              ...prev,
                              ...(validateDraft(draft).errs || {}),
                            }))
                          }
                          placeholder="10-digit phone number"
                          disabled={saving}
                        />
                        {draftErrors.phoneNumber ? (
                          <div className="pf-error-text">{draftErrors.phoneNumber}</div>
                        ) : null}
                      </>
                    )}
                  </div>

                  <div className="pf-field">
                    <div className="pf-label">User ID</div>
                    <div className="pf-value pf-mono">{userId || "—"}</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="pf-card pf-card--kyc">
              <header className="pf-card-head">
                <div>
                  <div className="pf-card-title">KYC Documents</div>
                  <div className="pf-card-sub">Your submitted documents and review timeline.</div>
                </div>
              </header>
              <div className="pf-card-body">
                {kycError ? <div className="pf-inline-error">{kycError}</div> : null}

                {kycStatus === "REJECTED" && rejectionReason ? (
                  <div
                    className="pf-inline-error"
                    style={{ marginBottom: 12, borderRadius: 12, padding: "12px 14px" }}
                  >
                    <strong style={{ display: "block", marginBottom: 6 }}>Rejection reason</strong>
                    {rejectionReason}
                  </div>
                ) : null}

                <div className="pf-fields" style={{ marginBottom: 14 }}>
                  <div className="pf-field pf-field--span">
                    <div className="pf-label">Upload KYC document</div>
                    <input
                      ref={kycFileRef}
                      type="file"
                      className="pf-file"
                      accept="image/*,.pdf,application/pdf"
                    />
                    <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="pf-btn pf-btn--primary"
                        onClick={() => void uploadKycDocument()}
                        disabled={kycUploading}
                      >
                        {kycUploading ? "Uploading…" : "Upload to KYC"}
                      </button>
                      {(kycStatus === "REJECTED" || kycStatus === "PENDING") && (
                        <button
                          type="button"
                          className="pf-btn pf-btn--ghost"
                          onClick={() => void resubmitKyc()}
                          disabled={kycResubmitting}
                        >
                          {kycResubmitting ? "Submitting…" : "Resubmit for review"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {!kyc && !kycError ? (
                  <div className="pf-empty-mini">
                    <div className="pf-empty-mini-title">No KYC record found</div>
                    <div className="pf-empty-mini-sub">Submit documents to start verification.</div>
                  </div>
                ) : null}

                {kyc ? (
                  <>
                    <div className="pf-fields pf-fields--2">
                      <div className="pf-field">
                        <div className="pf-label">Uploaded file</div>
                        <div className="pf-value pf-mono">{filePath || "—"}</div>
                      </div>
                      <div className="pf-field">
                        <div className="pf-label">Uploaded</div>
                        <div className="pf-value">{uploadedAt ? uploadedAt.toLocaleString() : "—"}</div>
                      </div>
                    </div>

                    <div className="pf-timeline">
                      <div className="pf-step pf-step--done">
                        <div className="pf-step-dot" />
                        <div className="pf-step-text">
                          <div className="pf-step-title">Submitted</div>
                          <div className="pf-step-sub">Documents uploaded successfully.</div>
                        </div>
                      </div>

                      <div
                        className={`pf-step ${
                          kycStatus === "PENDING" || kycStatus === "APPROVED" || kycStatus === "REJECTED"
                            ? "pf-step--done"
                            : ""
                        }`}
                      >
                        <div className="pf-step-dot" />
                        <div className="pf-step-text">
                          <div className="pf-step-title">Under Review</div>
                          <div className="pf-step-sub">Admin is reviewing your submission.</div>
                        </div>
                      </div>

                      <div
                        className={`pf-step ${
                          kycStatus === "APPROVED"
                            ? "pf-step--done pf-step--success"
                            : kycStatus === "REJECTED"
                              ? "pf-step--done pf-step--danger"
                              : ""
                        }`}
                      >
                        <div className="pf-step-dot" />
                        <div className="pf-step-text">
                          <div className="pf-step-title">{kycStatus === "REJECTED" ? "Rejected" : "Approved"}</div>
                          <div className="pf-step-sub">
                            {kycStatus === "REJECTED"
                              ? "Your KYC was rejected. Please re-submit."
                              : "Your KYC is approved."}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pf-actions">
                      {filePath ? (
                        <a className="pf-btn pf-btn--ghost" href={filePath} target="_blank" rel="noreferrer">
                          View / Download
                        </a>
                      ) : null}
                      {safeUpper(kyc?.status) === "PENDING" ? (
                        <button
                          type="button"
                          className="pf-btn pf-btn--primary"
                          onClick={() => showSuccess("KYC is pending review")}
                        >
                          KYC Pending
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>
            </section>
          </div>

          <div className="pf-col">
            <section className="pf-card pf-card--verify">
              <header className="pf-card-head">
                <div>
                  <div className="pf-card-title">Verification Center</div>
                  <div className="pf-card-sub">Account verification and KYC approval status.</div>
                </div>
              </header>
              <div className="pf-card-body">
                <div className="pf-verify">
                  <div className="pf-verify-row">
                    <div className="pf-verify-left">
                      <div className="pf-verify-title">Account Verification</div>
                      <div className="pf-verify-sub">Email/phone verification status.</div>
                    </div>
                    <span className={`pf-badge pf-badge--${accountBadge.tone}`}>{accountBadge.label}</span>
                  </div>

                  <div className="pf-divider" />

                  <div className="pf-verify-row">
                    <div className="pf-verify-left">
                      <div className="pf-verify-title">KYC Verification</div>
                      <div className="pf-verify-sub">Admin-approved document verification.</div>
                    </div>
                    <span className={`pf-badge pf-badge--${kycBadge.tone}`}>{kycBadge.label}</span>
                  </div>

                  <div className="pf-divider" />

                  <div className="pf-fields pf-fields--2">
                    <div className="pf-field">
                      <div className="pf-label">Document Type</div>
                      <div className="pf-value">{docType || "—"}</div>
                    </div>
                    <div className="pf-field">
                      <div className="pf-label">Document Number</div>
                      <div className="pf-value pf-mono">{docNumber || "—"}</div>
                    </div>
                    <div className="pf-field pf-field--span">
                      <div className="pf-label">Referral Code</div>
                      <div className="pf-inline">
                        <div className="pf-value pf-mono">{referralCode || "—"}</div>
                        {referralCode ? (
                          <button
                            type="button"
                            className="pf-btn pf-btn--ghost pf-btn--sm"
                            onClick={() => void copyReferral()}
                          >
                            Copy
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="pf-card pf-card--actions">
            <header className="pf-card-head">
              <div>
                <div className="pf-card-title">Account Actions</div>
                <div className="pf-card-sub">Quick actions for your account.</div>
              </div>
            </header>
            <div className="pf-card-body">
              <div className="pf-actions pf-actions--stack">
                <button type="button" className="pf-btn pf-btn--ghost" onClick={() => setEditMode(true)}>
                  Edit profile
                </button>
                <button type="button" className="pf-btn pf-btn--ghost" onClick={() => navigate("/settings")}>
                  Go to settings
                </button>
                <button
                  type="button"
                  className="pf-btn pf-btn--danger"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function resolveUploadsUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  // Already absolute URL.
  if (/^https?:\/\//i.test(raw)) return raw;

  const ORIGIN = getApiOrigin() || window.location.origin;

  // Common backend shapes:
  // - "/uploads/xxx.jpg"
  // - "uploads/xxx.jpg"
  // - "1777030413766_ImgSam.jpeg" (filename only)
  if (raw.startsWith("/uploads/")) return `${ORIGIN}${raw}`;
  if (raw.startsWith("uploads/")) return `${ORIGIN}/${raw}`;
  if (raw.startsWith("/")) return `${ORIGIN}${raw}`;
  if (raw.includes("/")) return `${ORIGIN}/${raw}`;
  return `${ORIGIN}/uploads/${raw}`;
}
