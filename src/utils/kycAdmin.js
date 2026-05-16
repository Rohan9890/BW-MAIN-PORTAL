import { getApiOrigin } from "../services/apiConfig";

/** Canonical workflow values used for filters + stats (uppercase). */
export const KYC_CANONICAL = {
  PENDING: "PENDING",
  UNDER_REVIEW: "UNDER_REVIEW",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
  REUPLOAD_REQUIRED: "REUPLOAD_REQUIRED",
};

function safeStr(v) {
  const s = String(v ?? "").trim();
  return s && s !== "null" && s !== "undefined" ? s : "";
}

function pickFirst(...vals) {
  for (const v of vals) {
    const s = safeStr(v);
    if (s) return s;
  }
  return "";
}

/**
 * Resolve relative media paths against API origin when possible; otherwise keep relative for same-origin dev.
 */
export function absolutizePossibleApiUrl(path) {
  const p = safeStr(path);
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  const origin = getApiOrigin();
  if (!origin) return p.startsWith("/") ? p : `/${p}`;
  const base = origin.replace(/\/$/, "");
  return p.startsWith("/") ? `${base}${p}` : `${base}/${p}`;
}

function parseIsoOrDisplay(raw) {
  const s = safeStr(raw);
  if (!s) return "—";
  const ms = Date.parse(s);
  if (Number.isFinite(ms)) {
    try {
      return new Date(ms).toLocaleString();
    } catch {
      return s;
    }
  }
  return s;
}

/**
 * Map arbitrary backend / legacy status strings to a canonical workflow bucket.
 */
export function canonicalizeKycStatus(raw) {
  const u = safeStr(raw).toUpperCase().replace(/\s+/g, "_");
  if (!u) return KYC_CANONICAL.PENDING;
  if (u === "VERIFIED" || u === "APPROVED" || u === "COMPLETE" || u === "SUCCESS") return KYC_CANONICAL.VERIFIED;
  if (u === "REJECTED" || u === "DECLINED" || u === "FAILED") return KYC_CANONICAL.REJECTED;
  if (u === "REUPLOAD_REQUIRED" || u === "RESUBMIT_REQUIRED" || u === "NEED_INFO" || u === "NEEDINFO" || u === "ADDITIONAL_INFO")
    return KYC_CANONICAL.REUPLOAD_REQUIRED;
  if (u === "UNDER_REVIEW" || u === "IN_REVIEW" || u === "INREVIEW" || u === "REVIEWING" || u === "SUBMITTED")
    return KYC_CANONICAL.UNDER_REVIEW;
  if (u === "PENDING" || u === "NEW" || u === "DRAFT" || u === "UNVERIFIED") return KYC_CANONICAL.PENDING;
  if (
    u === "NOT_SUBMITTED" ||
    u === "NOTSUBMITTED" ||
    u === "NOT_SUBMITTED_YET" ||
    u === "NONE" ||
    u === "MISSING"
  )
    return KYC_CANONICAL.PENDING;
  return KYC_CANONICAL.UNDER_REVIEW;
}

/** Human label for table badge (title case). */
export function kycCanonicalLabel(canonical) {
  switch (canonical) {
    case KYC_CANONICAL.VERIFIED:
      return "Verified";
    case KYC_CANONICAL.REJECTED:
      return "Rejected";
    case KYC_CANONICAL.REUPLOAD_REQUIRED:
      return "Re-upload required";
    case KYC_CANONICAL.UNDER_REVIEW:
      return "Under review";
    default:
      return "Pending";
  }
}

/** CSS slug for badge / row styling */
export function kycCanonicalSlug(canonical) {
  return String(canonical || KYC_CANONICAL.PENDING)
    .toLowerCase()
    .replace(/_/g, "-");
}

/** Heuristic: treat as PDF when path or query hints at PDF (no fetch of Content-Type). */
export function kycUrlLooksLikePdf(url) {
  const s = safeStr(url).toLowerCase();
  if (!s) return false;
  if (s.includes(".pdf")) return true;
  if (s.includes("content-type=application%2Fpdf")) return true;
  if (s.includes("type=application/pdf")) return true;
  return false;
}

/**
 * Ordered document slots for admin preview (dedupes identical URLs).
 * @param {ReturnType<typeof normalizeAdminKycRow> | object} row
 * @returns {{ id: string, label: string, url: string, kind: "image"|"pdf" }[]}
 */
export function getAdminKycDocumentPreviewSlots(row) {
  if (!row || typeof row !== "object") return [];
  const seen = new Set();
  /** @type {{ id: string, label: string, url: string, kind: "image"|"pdf" }[]} */
  const out = [];
  const push = (label, raw) => {
    const u = absolutizePossibleApiUrl(safeStr(raw));
    if (!u || seen.has(u)) return;
    seen.add(u);
    out.push({
      id: `${out.length}-${label.replace(/\s+/g, "-")}`,
      label,
      url: u,
      kind: kycUrlLooksLikePdf(u) ? "pdf" : "image",
    });
  };

  const raw = row._raw && typeof row._raw === "object" ? row._raw : null;
  /** First non-empty URL among normalized row + raw backend aliases */
  const urlFrom = (...keys) => {
    for (const k of keys) {
      const u = absolutizePossibleApiUrl(safeStr(row[k]));
      if (u) return u;
    }
    if (raw) {
      for (const k of keys) {
        const u = absolutizePossibleApiUrl(safeStr(raw[k]));
        if (u) return u;
      }
    }
    return "";
  };

  push("Aadhaar (front)", urlFrom("aadhaarFrontUrl", "aadhaar_front_url", "aadhaarFront"));
  push("Aadhaar (back)", urlFrom("aadhaarBackUrl", "aadhaar_back_url", "aadhaarBack"));
  push("PAN card", urlFrom("panCardUrl", "pan_url", "panImageUrl", "panDocumentUrl", "panFrontUrl", "panCard"));
  push("Passport", urlFrom("passportUrl", "passportImageUrl", "passportFrontUrl", "passport"));
  push("Driving licence", urlFrom("drivingLicenseUrl", "dlUrl", "drivingLicenceUrl", "licenseFrontUrl", "drivingLicense"));
  push("Document (front)", urlFrom("documentFrontUrl", "documentFront", "frontDocumentUrl"));
  push("Document (back)", urlFrom("documentBackUrl", "documentBack", "backDocumentUrl"));
  push("ID (front)", urlFrom("frontDocumentUrl", "frontUrl", "idFrontUrl", "frontImageUrl"));
  push("ID (back)", urlFrom("backDocumentUrl", "backUrl", "idBackUrl", "backImageUrl"));
  push("Live photo", urlFrom("livePhotoUrl", "live_photo_url", "livePhoto", "livenessImageUrl", "livenessUrl"));
  push("Selfie", urlFrom("selfieUrl", "selfieImageUrl", "faceUrl", "portraitUrl"));

  const embedded = row.documents || row.kycDocuments || row.kycDocumentUrls || (raw && raw.documents);
  if (Array.isArray(embedded)) {
    embedded.forEach((d, i) => {
      if (!d || typeof d !== "object") return;
      const label =
        safeStr(d.label || d.type || d.name || d.documentType || d.docType) || `Attachment ${i + 1}`;
      push(label, d.url || d.fileUrl || d.downloadUrl || d.path || d.link || d.href);
    });
  }

  return out;
}

/**
 * Merge `GET /admin/kyc/:id` (or similar) payload into a normalized queue row for richer document URLs.
 */
export function mergeAdminKycDetailRow(normalizedRow, detail) {
  if (!normalizedRow || typeof normalizedRow !== "object") return normalizedRow;
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) return normalizedRow;
  const node =
    detail.data !== undefined && detail.data !== null && typeof detail.data === "object"
      ? detail.data
      : detail;
  const baseRaw =
    normalizedRow._raw && typeof normalizedRow._raw === "object"
      ? { ...normalizedRow._raw }
      : { ...normalizedRow };
  const flat = node && typeof node === "object" && !Array.isArray(node) ? { ...node } : {};
  const mergedSource = { ...baseRaw, ...flat };
  const anchorId = String(normalizedRow.id || "").trim();
  const next = normalizeAdminKycRow(mergedSource, 0);
  if (!next) return normalizedRow;
  if (anchorId) return { ...next, id: anchorId };
  return next;
}

/** Preserve document URLs when re-syncing the drawer from the list after reload. */
const KYC_DOC_URL_KEYS = [
  "aadhaarFrontUrl",
  "aadhaarBackUrl",
  "panCardUrl",
  "passportUrl",
  "drivingLicenseUrl",
  "livePhotoUrl",
  "documentFrontUrl",
  "documentBackUrl",
  "frontDocumentUrl",
  "backDocumentUrl",
  "selfieUrl",
];

export function kycNormalizedRowToDetailPatch(row) {
  if (!row || typeof row !== "object") return {};
  const raw = row._raw && typeof row._raw === "object" ? row._raw : {};
  const out = {};
  for (const k of KYC_DOC_URL_KEYS) {
    const v = safeStr(row[k]) || safeStr(raw[k]);
    if (v) out[k] = v;
  }
  for (const listKey of ["documents", "kycDocuments", "kycDocumentUrls"]) {
    const arr = row[listKey] || raw[listKey];
    if (Array.isArray(arr) && arr.length) out[listKey] = arr;
  }
  return out;
}

/**
 * Normalize one admin KYC queue row from backend variants (no mock data).
 * @param {object} raw
 * @param {number} [index]
 */
export function normalizeAdminKycRow(raw, index = 0) {
  const r = raw && typeof raw === "object" ? raw : {};
  const nestedUser = r.user && typeof r.user === "object" ? r.user : null;
  const nestedProfile = r.profile && typeof r.profile === "object" ? r.profile : nestedUser?.profile || null;
  /** Common backend nests (identity may live here while document fields stay on the root). */
  const applicant = r.applicant && typeof r.applicant === "object" ? r.applicant : null;
  const applicantInfo = r.applicantInfo && typeof r.applicantInfo === "object" ? r.applicantInfo : null;
  const userDetails = r.userDetails && typeof r.userDetails === "object" ? r.userDetails : null;
  const nestedApplication =
    (r.application && typeof r.application === "object" ? r.application : null) ||
    (r.kycApplication && typeof r.kycApplication === "object" ? r.kycApplication : null);

  const id = pickFirst(
    r.id,
    r.kycId,
    r.requestId,
    r.applicationId,
    r.submissionId,
    nestedUser?.id,
    r.userId,
    `kyc_${index}`,
  );

  const fullName = pickFirst(
    r.fullName,
    r.full_name,
    r.name,
    r.displayName,
    r.display_name,
    r.userName,
    r.user_name,
    r.username,
    nestedUser?.name,
    nestedUser?.fullName,
    nestedUser?.full_name,
    nestedUser?.displayName,
    nestedUser?.userName,
    nestedUser?.username,
    nestedProfile?.name,
    nestedProfile?.fullName,
    nestedProfile?.displayName,
    applicant?.name,
    applicant?.fullName,
    applicant?.full_name,
    applicant?.displayName,
    applicant?.userName,
    applicantInfo?.name,
    applicantInfo?.fullName,
    applicantInfo?.displayName,
    userDetails?.name,
    userDetails?.fullName,
    nestedApplication?.fullName,
    nestedApplication?.name,
    nestedApplication?.displayName,
    [nestedUser?.firstName, nestedUser?.lastName].filter(Boolean).join(" "),
    [nestedProfile?.firstName, nestedProfile?.lastName].filter(Boolean).join(" "),
    [applicant?.firstName, applicant?.lastName].filter(Boolean).join(" "),
    [r.firstName, r.lastName].filter(Boolean).join(" "),
    [r.first_name, r.last_name].filter(Boolean).join(" "),
  );

  const email = pickFirst(
    r.email,
    r.userEmail,
    r.user_email,
    r.contactEmail,
    nestedUser?.email,
    nestedUser?.userEmail,
    nestedProfile?.email,
    nestedProfile?.userEmail,
    applicant?.email,
    applicant?.userEmail,
    applicantInfo?.email,
    userDetails?.email,
    nestedApplication?.email,
    nestedApplication?.userEmail,
  );

  const phone = pickFirst(
    r.phone,
    r.phoneNumber,
    r.phone_number,
    r.mobile,
    r.mobileNumber,
    r.mobile_number,
    r.userPhone,
    nestedUser?.phone,
    nestedUser?.phoneNumber,
    nestedUser?.mobile,
    nestedProfile?.phone,
    nestedProfile?.phoneNumber,
    nestedProfile?.mobile,
    applicant?.phone,
    applicant?.phoneNumber,
    applicantInfo?.phone,
    userDetails?.phone,
    nestedApplication?.phone,
    nestedApplication?.phoneNumber,
  );

  const dateOfBirth = pickFirst(r.dateOfBirth, r.dob, nestedProfile?.dateOfBirth, r.birthDate);

  const address = pickFirst(r.address, r.streetAddress, nestedProfile?.address, r.line1);

  const country = pickFirst(r.country, r.countryCode, nestedProfile?.country);

  const documentType = pickFirst(
    r.documentType,
    r.docType,
    r.idType,
    r.kycDocumentType,
    "—",
  );

  const documentNumber = pickFirst(r.documentNumber, r.idNumber, r.docNumber, r.panNumber, r.aadhaarNumber);

  const aadhaarFrontUrl = absolutizePossibleApiUrl(
    pickFirst(r.aadhaarFrontUrl, r.aadhaar_front_url, nestedProfile?.aadhaarFrontUrl),
  );
  const aadhaarBackUrl = absolutizePossibleApiUrl(
    pickFirst(r.aadhaarBackUrl, r.aadhaar_back_url, nestedProfile?.aadhaarBackUrl),
  );
  const panCardUrl = absolutizePossibleApiUrl(
    pickFirst(
      r.panCardUrl,
      r.pan_url,
      r.panImageUrl,
      r.panDocumentUrl,
      r.panFrontUrl,
      nestedProfile?.panCardUrl,
      nestedProfile?.pan_url,
    ),
  );
  const passportUrl = absolutizePossibleApiUrl(
    pickFirst(r.passportUrl, r.passportImageUrl, r.passportFrontUrl, nestedProfile?.passportUrl),
  );
  const drivingLicenseUrl = absolutizePossibleApiUrl(
    pickFirst(
      r.drivingLicenseUrl,
      r.dlUrl,
      r.drivingLicenceUrl,
      r.licenseFrontUrl,
      nestedProfile?.drivingLicenseUrl,
    ),
  );
  const livePhotoUrl = absolutizePossibleApiUrl(
    pickFirst(
      r.livePhotoUrl,
      r.live_photo_url,
      r.livePhoto,
      r.livenessImageUrl,
      r.livenessUrl,
      nestedProfile?.livePhotoUrl,
    ),
  );
  const documentFrontUrl = absolutizePossibleApiUrl(
    pickFirst(r.documentFront, r.document_front, nestedProfile?.documentFront),
  );
  const documentBackUrl = absolutizePossibleApiUrl(
    pickFirst(r.documentBack, r.document_back, nestedProfile?.documentBack),
  );

  const frontDocumentUrl = absolutizePossibleApiUrl(
    pickFirst(
      r.frontDocumentUrl,
      r.frontUrl,
      r.documentFrontUrl,
      r.idFrontUrl,
      r.frontImageUrl,
      r.aadhaarFrontUrl,
      r.aadhaar_front_url,
      r.panCardUrl,
      r.pan_url,
      r.passportUrl,
      r.drivingLicenseUrl,
      r.documentFront,
      r.document_front,
      nestedProfile?.aadhaarFrontUrl,
    ),
  );
  const backDocumentUrl = absolutizePossibleApiUrl(
    pickFirst(
      r.backDocumentUrl,
      r.backUrl,
      r.documentBackUrl,
      r.idBackUrl,
      r.backImageUrl,
      r.aadhaarBackUrl,
      r.aadhaar_back_url,
      r.documentBack,
      r.document_back,
      nestedProfile?.aadhaarBackUrl,
    ),
  );
  const selfieUrl = absolutizePossibleApiUrl(
    pickFirst(
      r.selfieUrl,
      r.selfieImageUrl,
      r.faceUrl,
      r.portraitUrl,
      nestedProfile?.selfieUrl,
      nestedProfile?.selfieImageUrl,
    ),
  );

  const submittedAtRaw = pickFirst(
    r.submittedAt,
    r.createdAt,
    r.submittedOn,
    r.uploadedAt,
    r.requestedAt,
    r.createdOn,
  );

  const statusRaw = pickFirst(
    r.status,
    r.kycStatus,
    r.verificationStatus,
    r.state,
    nestedUser?.kycStatus,
    nestedProfile?.kycStatus,
  );

  const canonicalStatus = canonicalizeKycStatus(statusRaw);

  const rejectionReason = pickFirst(
    r.rejectionReason,
    r.rejectReason,
    r.reason,
    r.reviewNotes,
    r.adminComment,
  );

  const reviewedBy = pickFirst(r.reviewedBy, r.reviewer, r.reviewedByEmail, r.moderatorId);
  const reviewedAtRaw = pickFirst(r.reviewedAt, r.reviewedOn, r.updatedAt, r.decisionAt);

  const riskFlag = Boolean(r.riskFlag || r.highRisk || r.flagged || r.suspicious);

  const submittedAt = parseIsoOrDisplay(submittedAtRaw);
  const reviewedAt = reviewedAtRaw ? parseIsoOrDisplay(reviewedAtRaw) : "—";

  const displayStatus = kycCanonicalLabel(canonicalStatus);

  const initials = (() => {
    const parts = fullName.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "";
    const b = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] || "";
    const s = `${a}${b}`.toUpperCase();
    return s || "U";
  })();

  return {
    ...r,
    id,
    fullName: fullName || "—",
    email: email || "—",
    phone: phone || "—",
    dateOfBirth: dateOfBirth || "—",
    address: address || "—",
    country: country || "—",
    documentType,
    documentNumber: documentNumber || "—",
    aadhaarFrontUrl,
    aadhaarBackUrl,
    panCardUrl,
    passportUrl,
    drivingLicenseUrl,
    livePhotoUrl,
    documentFrontUrl,
    documentBackUrl,
    frontDocumentUrl,
    backDocumentUrl,
    selfieUrl,
    submittedAt,
    submittedAtRaw,
    canonicalStatus,
    displayStatus,
    statusRaw: statusRaw || "—",
    rejectionReason: rejectionReason || "",
    reviewedBy: reviewedBy || "—",
    reviewedAt,
    riskFlag,
    initials,
    _raw: r,
  };
}

export function kycStatsFromNormalizedRows(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return {
    total: list.length,
    pending: list.filter((x) => x.canonicalStatus === KYC_CANONICAL.PENDING).length,
    underReview: list.filter((x) => x.canonicalStatus === KYC_CANONICAL.UNDER_REVIEW).length,
    approved: list.filter((x) => x.canonicalStatus === KYC_CANONICAL.VERIFIED).length,
    rejected: list.filter((x) => x.canonicalStatus === KYC_CANONICAL.REJECTED).length,
    reupload: list.filter((x) => x.canonicalStatus === KYC_CANONICAL.REUPLOAD_REQUIRED).length,
  };
}
