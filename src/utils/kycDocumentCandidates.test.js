import { beforeAll, describe, it, expect, vi } from "vitest";
import {
  hasKycDocumentCandidates,
  pickPrimaryKycDocumentStoredUrl,
  resolveKycDocumentCandidates,
} from "./kycDocumentCandidates";

const PRIVATE_S3 =
  "https://authify-kyc-prod.s3.ap-south-1.amazonaws.com/kyc/front.jpg";

beforeAll(() => {
  vi.stubEnv("VITE_API_URL", "http://43.205.116.38:8080");
});

describe("resolveKycDocumentCandidates", () => {
  it("resolves aadhaarFrontUrl-only payload", () => {
    const candidates = resolveKycDocumentCandidates({
      aadhaarFrontUrl: PRIVATE_S3,
    });
    expect(candidates).toHaveLength(1);
    expect(candidates[0].key).toBe("aadhaarFrontUrl");
    expect(candidates[0].storedUrl).toBe(PRIVATE_S3);
    expect(candidates[0].needsSecureAccess).toBe(true);
    expect(candidates[0].previewSafeUrl).toBe("");
  });

  it("resolves documentUrl-only payload", () => {
    const candidates = resolveKycDocumentCandidates({
      documentUrl: "/uploads/documents/pan.png",
    });
    expect(candidates).toHaveLength(1);
    expect(candidates[0].key).toBe("documentUrl");
    expect(candidates[0].storedUrl).toBe("/uploads/documents/pan.png");
    expect(candidates[0].needsSecureAccess).toBe(false);
    expect(candidates[0].previewSafeUrl).toContain("/uploads/documents/pan.png");
  });

  it("dedupes mixed payloads pointing at same S3 object", () => {
    const candidates = resolveKycDocumentCandidates({
      aadhaarFrontUrl: PRIVATE_S3,
      frontDocumentUrl: PRIVATE_S3,
      documentUrl: PRIVATE_S3,
    });
    expect(candidates).toHaveLength(1);
    expect(candidates[0].key).toBe("aadhaarFrontUrl");
  });

  it("returns multiple distinct documents from mixed payload", () => {
    const candidates = resolveKycDocumentCandidates({
      aadhaarFrontUrl: PRIVATE_S3,
      aadhaarBackUrl: PRIVATE_S3.replace("front.jpg", "back.jpg"),
      documentFile: "/uploads/documents/extra.pdf",
    });
    expect(candidates.length).toBeGreaterThanOrEqual(3);
    expect(hasKycDocumentCandidates({ aadhaarFrontUrl: PRIVATE_S3 })).toBe(true);
  });

  it("returns empty for missing payloads", () => {
    expect(resolveKycDocumentCandidates({})).toEqual([]);
    expect(resolveKycDocumentCandidates(null)).toEqual([]);
    expect(hasKycDocumentCandidates({ status: "PENDING" })).toBe(false);
    expect(pickPrimaryKycDocumentStoredUrl({})).toBe("");
  });

  it("reads nested _raw backend shapes", () => {
    const candidates = resolveKycDocumentCandidates({
      id: 12,
      _raw: {
        aadhaarFrontUrl: PRIVATE_S3,
        backDocumentUrl: PRIVATE_S3.replace("front.jpg", "back.jpg"),
      },
    });
    expect(candidates.length).toBe(2);
  });

  it("picks primary by field priority", () => {
    expect(
      pickPrimaryKycDocumentStoredUrl({
        filePath: "/uploads/documents/old.png",
        aadhaarFrontUrl: PRIVATE_S3,
      }),
    ).toBe(PRIVATE_S3);
  });
});
