import { describe, expect, it } from "vitest";
import {
  assertKycMultipartFormData,
  buildKycUploadFormData,
  formatKycUploadApiError,
  getKycFormDataFieldNames,
  KycUploadValidationError,
  normalizeKycDocumentType,
  validateKycUploadFields,
} from "./kycUpload";

describe("normalizeKycDocumentType", () => {
  it("normalizes common aliases", () => {
    expect(normalizeKycDocumentType("aadhar")).toBe("AADHAAR");
    expect(normalizeKycDocumentType("dl")).toBe("DRIVING_LICENSE");
    expect(normalizeKycDocumentType("PAN")).toBe("PAN");
  });
});

describe("validateKycUploadFields", () => {
  it("requires document type and number", () => {
    expect(validateKycUploadFields("", "")).toBe("Select a document type.");
    expect(validateKycUploadFields("PAN", "")).toBe("Enter the document number.");
  });

  it("validates PAN format", () => {
    expect(validateKycUploadFields("PAN", "ABCDE1234F")).toBe("");
    expect(validateKycUploadFields("PAN", "BAD")).toMatch(/Invalid PAN/);
  });
});

describe("buildKycUploadFormData", () => {
  it("includes documentType, documentNumber, and file for upload", () => {
    const file = new File(["pdf"], "id.pdf", { type: "application/pdf" });
    const formData = buildKycUploadFormData({
      file,
      documentType: "pan",
      documentNumber: "ABCDE1234F",
    });

    expect(getKycFormDataFieldNames(formData).sort()).toEqual(
      ["documentNumber", "documentType", "file"].sort(),
    );
    expect(formData.get("documentType")).toBe("PAN");
    expect(formData.get("documentNumber")).toBe("ABCDE1234F");
    expect(formData.get("file")).toBe(file);
  });

  it("rejects missing document type before upload", () => {
    const file = new File(["x"], "id.pdf", { type: "application/pdf" });
    expect(() =>
      buildKycUploadFormData({
        file,
        documentType: "",
        documentNumber: "ABCDE1234F",
      }),
    ).toThrow(KycUploadValidationError);
  });
});

describe("assertKycMultipartFormData", () => {
  it("flags incomplete multipart payloads", () => {
    const fd = new FormData();
    fd.append("file", new File(["x"], "a.pdf", { type: "application/pdf" }));
    expect(() => assertKycMultipartFormData(fd)).toThrow(/documentType/);
  });
});

describe("formatKycUploadApiError", () => {
  it("maps missing documentType backend errors", () => {
    const err = {
      message: "Required request parameter 'documentType' is not present",
    };
    expect(formatKycUploadApiError(err)).toMatch(/Document type is required/i);
  });
});
