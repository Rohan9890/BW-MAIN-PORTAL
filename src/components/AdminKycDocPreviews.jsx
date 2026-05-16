import { memo, useCallback, useMemo, useState } from "react";
import { getAdminKycDocumentPreviewSlots } from "../utils/kycAdmin";
import "./AdminKycDocPreviews.css";

const DocSlot = memo(function DocSlot({ slot }) {
  const [phase, setPhase] = useState("loading");
  const [retry, setRetry] = useState(0);

  const bumpRetry = useCallback(() => {
    setPhase("loading");
    setRetry((n) => n + 1);
  }, []);

  if (slot.kind === "pdf") {
    return (
      <article className="kyc-doc-slot kyc-doc-slot--pdf">
        <h6 className="kyc-doc-slot-title">{slot.label}</h6>
        <div className="kyc-doc-slot-pdf-badge" aria-hidden>
          PDF
        </div>
        <p className="kyc-doc-slot-hint">Inline preview is not available for PDF. Open in a new tab to review.</p>
        <div className="kyc-doc-slot-actions">
          <a className="kyc-doc-slot-btn" href={slot.url} target="_blank" rel="noreferrer">
            Open in new tab
          </a>
          <a className="kyc-doc-slot-btn kyc-doc-slot-btn--ghost" href={slot.url} download rel="noreferrer">
            Download
          </a>
        </div>
      </article>
    );
  }

  const showBroken = phase === "error";
  const showReady = phase === "ready";

  return (
    <article className="kyc-doc-slot kyc-doc-slot--image">
      <h6 className="kyc-doc-slot-title">{slot.label}</h6>
      <div className="kyc-doc-slot-frame">
        {phase === "loading" ? <div className="kyc-doc-slot-skeleton" aria-hidden /> : null}
        {showBroken ? (
          <div className="kyc-doc-slot-broken" role="alert">
            <span>Could not load image preview.</span>
            <div className="kyc-doc-slot-broken-actions">
              <button type="button" className="kyc-doc-slot-btn" onClick={bumpRetry}>
                Retry
              </button>
              <a className="kyc-doc-slot-btn kyc-doc-slot-btn--ghost" href={slot.url} target="_blank" rel="noreferrer">
                Open file
              </a>
            </div>
          </div>
        ) : null}
        <img
          key={`${slot.id}-${retry}`}
          src={slot.url}
          alt=""
          loading="lazy"
          decoding="async"
          className={`kyc-doc-slot-img ${showReady ? "kyc-doc-slot-img--visible" : ""}`}
          hidden={showBroken}
          onLoad={() => setPhase("ready")}
          onError={() => setPhase("error")}
        />
      </div>
      <div className="kyc-doc-slot-actions">
        <a className="kyc-doc-slot-btn" href={slot.url} target="_blank" rel="noreferrer">
          Open in new tab
        </a>
        <a className="kyc-doc-slot-btn kyc-doc-slot-btn--ghost" href={slot.url} download rel="noreferrer">
          Download
        </a>
      </div>
    </article>
  );
});

function AdminKycDocPreviews({ row }) {
  const slots = useMemo(() => getAdminKycDocumentPreviewSlots(row), [row]);

  if (!slots.length) {
    return (
      <section className="kyc-doc-preview-root" aria-label="KYC documents">
        <h5 className="kyc-doc-preview-heading">Verification documents</h5>
        <p className="kyc-doc-preview-empty" role="status">
          No document URLs were returned for this application. Use backend fields such as{" "}
          <code className="kyc-doc-preview-code">aadhaarFrontUrl</code>, <code className="kyc-doc-preview-code">panCardUrl</code>,{" "}
          <code className="kyc-doc-preview-code">selfieUrl</code>, etc.
        </p>
      </section>
    );
  }

  return (
    <section className="kyc-doc-preview-root" aria-label="KYC documents">
      <h5 className="kyc-doc-preview-heading">Verification documents</h5>
      <p className="kyc-doc-preview-sub">Review each file before verify or reject. PDFs open externally.</p>
      <div className="kyc-doc-preview-grid">
        {slots.map((slot) => (
          <DocSlot key={slot.id} slot={slot} />
        ))}
      </div>
    </section>
  );
}

export default memo(AdminKycDocPreviews);
