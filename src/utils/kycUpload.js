import { getApiErrorMessage } from "../services/backendClient";

export const KYC_DOCUMENT_TYPES = ["AADHAAR", "PAN", "DRIVING_LICENSE"];

export const KYC_MULTIPART_REQUIRED_FIELDS = [
  "documentType",
  "documentNumber",
  "file",
];

export class KycUploadValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "KycUploadValidationError";
  }
}

/** @param {unknown} value */
export function normalizeKycDocumentType(value) {
  const raw = String(value || "")
    .trim()
    .toUpperCase();
  if (!raw) return "";
  if (raw === "AADHAR") return "AADHAAR";
  if (raw === "DL" || raw === "DRIVING LICENSE") return "DRIVING_LICENSE";
  return raw;
}

/**
 * @param {string} documentType
 * @param {string} documentNumber
 * @returns {string} Empty when valid; otherwise user-facing message.
 */
export function validateKycUploadFields(documentType, documentNumber) {
  const type = normalizeKycDocumentType(documentType);
  const number = String(documentNumber || "").trim();
  if (!type) return "Select a document type.";
  if (!KYC_DOCUMENT_TYPES.includes(type)) {
    return "Unsupported document type.";
  }
  if (!number) return "Enter the document number.";
  if (type === "AADHAAR" && !/^\d{12}$/.test(number)) {
    return "Aadhaar must be 12 digits.";
  }
  if (type === "PAN" && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(number)) {
    return "Invalid PAN format (ABCDE1234F).";
  }
  if (type === "DRIVING_LICENSE" && !/^[A-Z0-9]{5,20}$/i.test(number)) {
    return "Enter a valid driving license number.";
  }
  return "";
}

/**
 * @param {FormData} formData
 * @returns {string[]}
 */
export function getKycFormDataFieldNames(formData) {
  const names = [];
  formData.forEach((_, key) => {
    if (!names.includes(key)) names.push(key);
  });
  return names;
}

/**
 * @param {FormData} formData
 */
export function assertKycMultipartFormData(formData) {
  if (!(formData instanceof FormData)) {
    throw new KycUploadValidationError("Invalid KYC upload payload.");
  }

  const missing = [];
  for (const field of KYC_MULTIPART_REQUIRED_FIELDS) {
    if (!formData.has(field)) {
      missing.push(field);
      continue;
    }
    const value = formData.get(field);
    if (field === "file") {
      if (!(value instanceof Blob) || value.size <= 0) {
        missing.push("file (empty)");
      }
      continue;
    }
    if (!String(value ?? "").trim()) {
      missing.push(`${field} (empty)`);
    }
  }

  if (missing.length) {
    throw new KycUploadValidationError(
      `Missing required KYC upload fields: ${missing.join(", ")}.`,
    );
  }
}

/**
 * Build multipart body for POST /kyc/upload and POST /profile/kyc/reupload.
 * @param {{ file: File | Blob; documentType: string; documentNumber: string }} params
 */
export function buildKycUploadFormData({ file, documentType, documentNumber }) {
  const type = normalizeKycDocumentType(documentType);
  const number = String(documentNumber || "").trim();
  const validationError = validateKycUploadFields(type, number);
  if (validationError) {
    throw new KycUploadValidationError(validationError);
  }
  if (!(file instanceof Blob) || file.size <= 0) {
    throw new KycUploadValidationError("Choose a document file to upload.");
  }

  const formData = new FormData();
  formData.append("documentType", type);
  formData.append("documentNumber", number);
  formData.append("file", file);
  assertKycMultipartFormData(formData);
  return formData;
}

/**
 * @param {string} path
 * @param {FormData} formData
 */
export function logKycMultipartDev(path, formData) {
  if (!import.meta.env.DEV) return;
  // eslint-disable-next-line no-console
  console.log("[kycBackend] multipart request", {
    path,
    fields: getKycFormDataFieldNames(formData),
  });
}

/**
 * @param {unknown} err
 * @param {string} [fallback]
 */
export function formatKycUploadApiError(err, fallback = "KYC upload failed") {
  const message = getApiErrorMessage(err, fallback);
  if (
    /documentType/i.test(message) &&
    /not present|required|missing|blank/i.test(message)
  ) {
    return "Document type is required. Select a document type and try again.";
  }
  if (
    /documentNumber/i.test(message) &&
    /not present|required|missing|blank/i.test(message)
  ) {
    return "Document number is required. Enter your document number and try again.";
  }
  if (/file/i.test(message) && /not present|required|missing|blank/i.test(message)) {
    return "Document file is required. Choose a file and try again.";
  }
  return message;
}
