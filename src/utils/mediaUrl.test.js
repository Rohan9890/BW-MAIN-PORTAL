import { beforeAll, describe, it, expect, vi } from "vitest";

const API_ORIGIN = "https://api.example.test";

beforeAll(() => {
  vi.stubEnv("VITE_API_URL", API_ORIGIN);
});

import {
  normalizeAssetUrl,
  resolveKycDocumentUrl,
  resolveProfilePhotoUrl,
  resolveUploadsUrl,
} from "./mediaUrl";

const LEGACY_LOGO =
  "http://43.205.116.38:8080/uploads/apps/logos/example.png";
const LEGACY_LOGO_NO_PORT =
  "http://43.205.116.38/uploads/apps/logos/example.png";

describe("normalizeAssetUrl", () => {
  it("rewrites legacy IP with port to configured HTTPS origin", () => {
    expect(normalizeAssetUrl(LEGACY_LOGO)).toBe(
      `${API_ORIGIN}/uploads/apps/logos/example.png`,
    );
  });

  it("rewrites legacy IP without port to configured HTTPS origin", () => {
    expect(normalizeAssetUrl(LEGACY_LOGO_NO_PORT)).toBe(
      `${API_ORIGIN}/uploads/apps/logos/example.png`,
    );
  });

  it("returns empty string for falsy input", () => {
    expect(normalizeAssetUrl("")).toBe("");
    expect(normalizeAssetUrl(null)).toBe("");
  });

  it("leaves unrelated URLs unchanged", () => {
    const local = "http://localhost:8080/uploads/profile/abc.png";
    expect(normalizeAssetUrl(local)).toBe(local);
  });
});

describe("resolveUploadsUrl legacy asset origins", () => {
  it("resolves app logo URLs from legacy IP host over HTTPS", () => {
    expect(resolveUploadsUrl(LEGACY_LOGO)).toBe(
      `${API_ORIGIN}/uploads/apps/logos/example.png`,
    );
  });
});

describe("resolveProfilePhotoUrl legacy asset origins", () => {
  it("resolves profile photos from legacy IP host over HTTPS", () => {
    const legacy =
      "http://43.205.116.38:8080/uploads/profile/avatar.png";
    expect(resolveProfilePhotoUrl(legacy)).toBe(
      `${API_ORIGIN}/uploads/profile/avatar.png`,
    );
  });
});

describe("resolveKycDocumentUrl legacy asset origins", () => {
  it("resolves KYC documents from legacy IP host over HTTPS", () => {
    const legacy =
      "http://43.205.116.38:8080/uploads/documents/id-card.png";
    expect(resolveKycDocumentUrl(legacy)).toBe(
      `${API_ORIGIN}/uploads/documents/id-card.png`,
    );
  });
});
