import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getAdminKycDocumentPreviewSlots } from "../utils/kycAdmin";
import "./AdminKycDocPreviews.css";

const DEV_KYC_PREVIEW_AUDIT =
  import.meta.env.DEV && import.meta.env.VITE_KYC_PREVIEW_AUDIT !== "false";

/** Set VITE_KYC_FORCE_IMG_VISIBLE=true to bypass opacity (confirms CSS-state bug). */
const FORCE_IMG_VISIBLE = import.meta.env.VITE_KYC_FORCE_IMG_VISIBLE === "true";

function auditKycPreview(label, payload) {
  if (!DEV_KYC_PREVIEW_AUDIT) return;
  console.debug(`[kyc-preview] ${label}`, payload);
}

function probeImageReady(img) {
  if (!img) return false;
  return Boolean(img.complete && img.naturalWidth > 0);
}

const DocSlot = memo(function DocSlot({ slot }) {
  const [phase, setPhase] = useState("loading");
  const [retry, setRetry] = useState(0);
  const imgRef = useRef(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const logPhase = useCallback(
    (next, meta = {}) => {
      auditKycPreview("phase", {
        from: phaseRef.current,
        to: next,
        url: slot.url,
        label: slot.label,
        ...meta,
      });
      setPhase(next);
    },
    [slot.url, slot.label],
  );

  const tryMarkReady = useCallback(
    (img, source) => {
      if (!img || !slot.url) return false;
      const ready = probeImageReady(img);
      auditKycPreview("probe", {
        source,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        ready,
        src: img.currentSrc || img.src,
        className: img.className,
        phase: phaseRef.current,
      });
      if (ready) {
        logPhase("ready", { source });
        return true;
      }
      return false;
    },
    [slot.url, logPhase],
  );

  const imgCallbackRef = useCallback(
    (node) => {
      imgRef.current = node;
      if (!node) return;
      if (tryMarkReady(node, "ref-callback")) return;
      logPhase("loading", { source: "ref-callback" });
    },
    [tryMarkReady, logPhase],
  );

  useLayoutEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    tryMarkReady(img, "layout-effect");
  }, [slot.url, retry, tryMarkReady]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const t = window.setTimeout(() => {
      if (phaseRef.current !== "loading") return;
      tryMarkReady(img, "delayed-probe-50ms");
    }, 50);
    return () => window.clearTimeout(t);
  }, [slot.url, retry, tryMarkReady]);

  useLayoutEffect(() => {
    auditKycPreview("render-state", {
      phase,
      showReady: phase === "ready",
      forceVisible: FORCE_IMG_VISIBLE,
      url: slot.url,
      label: slot.label,
    });
  });

  const bumpRetry = useCallback(() => {
    logPhase("loading", { source: "retry" });
    setRetry((n) => n + 1);
  }, [logPhase]);

  const handleImgLoad = useCallback(
    (e) => {
      const img = e.currentTarget;
      auditKycPreview("onLoad fired", {
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        url: slot.url,
      });
      logPhase("ready", { source: "onLoad" });
    },
    [slot.url, logPhase],
  );

  const handleImgError = useCallback(
    (e) => {
      const img = e.currentTarget;
      auditKycPreview("onError fired", {
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        url: slot.url,
      });
      logPhase("error", { source: "onError" });
    },
    [slot.url, logPhase],
  );

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
  const showReady = phase === "ready" || FORCE_IMG_VISIBLE;
  const showSkeleton = phase === "loading" && !FORCE_IMG_VISIBLE;
  const imgClassName = [
    "kyc-doc-slot-img",
    showReady ? "kyc-doc-slot-img--visible" : "",
    FORCE_IMG_VISIBLE ? "kyc-doc-slot-img--force-visible" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className="kyc-doc-slot kyc-doc-slot--image">
      <h6 className="kyc-doc-slot-title">{slot.label}</h6>
      <div className="kyc-doc-slot-frame">
        {showSkeleton ? <div className="kyc-doc-slot-skeleton" aria-hidden /> : null}
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
          ref={imgCallbackRef}
          key={`${slot.id}-${retry}-${slot.url}`}
          src={slot.url}
          alt=""
          loading="eager"
          decoding="async"
          className={imgClassName}
          hidden={showBroken}
          onLoad={handleImgLoad}
          onError={handleImgError}
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

function kycRowDocFingerprint(row) {
  if (!row || typeof row !== "object") return "";
  const raw = row._raw && typeof row._raw === "object" ? row._raw : {};
  const keys = [
    "filePath",
    "documentUrl",
    "documentFile",
    "imageUrl",
    "aadhaarFrontUrl",
    "aadhaarBackUrl",
    "panCardUrl",
    "selfieUrl",
    "frontDocumentUrl",
    "backDocumentUrl",
    "documentFrontUrl",
    "documentBackUrl",
  ];
  const parts = keys.map((k) => String(row[k] ?? raw[k] ?? ""));
  const docLists = ["documents", "kycDocuments", "kycDocumentUrls"].map((k) => {
    const arr = row[k] ?? raw[k];
    return Array.isArray(arr) ? arr.length : 0;
  });
  return `${parts.join("\0")}|${docLists.join(",")}`;
}

function AdminKycDocPreviews({ row }) {
  const docFingerprint = useMemo(() => kycRowDocFingerprint(row), [row]);
  const slots = useMemo(
    () => getAdminKycDocumentPreviewSlots(row),
    [row, docFingerprint],
  );

  useEffect(() => {
    const raw = row?._raw && typeof row._raw === "object" ? row._raw : {};
    auditKycPreview("preview slots", {
      rowId: row?.id,
      slotCount: slots.length,
      docFields: {
        documentUrl: row?.documentUrl ?? raw.documentUrl,
        documentFile: row?.documentFile ?? raw.documentFile,
        aadhaarFrontUrl: row?.aadhaarFrontUrl ?? raw.aadhaarFrontUrl,
        frontDocumentUrl: row?.frontDocumentUrl ?? raw.frontDocumentUrl,
      },
      slots: slots.map((s) => ({ label: s.label, url: s.url, kind: s.kind })),
    });
  }, [row?.id, slots, row]);

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
