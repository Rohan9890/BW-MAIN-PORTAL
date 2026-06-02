import { describe, it, expect, vi } from "vitest";

vi.mock("./backendClient", () => {
  return {
    backendJson: vi.fn(),
  };
});

import { backendJson } from "./backendClient";
import { favoritesBackend } from "./backendApis";

describe("favoritesBackend.list", () => {
  it("falls back to /favorites/list when /favorites/my returns 500 GET not supported", async () => {
    const favs = [{ appId: 1 }, { appId: 2 }];

    // First call: throw a 500 'GET not supported' error
    backendJson.mockImplementationOnce(() => {
      const err = new Error("Request method 'GET' is not supported");
      err.status = 500;
      err.payload = { message: "Request method 'GET' is not supported" };
      throw err;
    });

    // Second call: return the favorites list
    backendJson.mockResolvedValueOnce(favs);

    const res = await favoritesBackend.list();
    expect(res).toEqual(favs);
    expect(backendJson).toHaveBeenCalledTimes(2);
    expect(backendJson.mock.calls[0][0]).toBe("/favorites/my");
    expect(backendJson.mock.calls[1][0]).toBe("/favorites/list");
  });
});
