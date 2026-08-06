import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function trimOrigin(v) {
  return String(v ?? "")
    .trim()
    .replace(/\/$/, "");
}

/**
 * Dev-only proxy fallback when `VITE_API_URL` is unset.
 * Prefer setting `VITE_API_URL` in `.env.development` for remote backends.
 */
const DEFAULT_PROXY_TARGET = "http://localhost:8080";

/**
 * Build-time plugin: abort `npm run build` immediately if VITE_API_URL is missing
 * in production mode, preventing silent broken deployments.
 * Has no effect on `npm run dev` or `vitest`.
 */
function enforceProductionApiUrl(env, mode) {
  return {
    name: "enforce-production-api-url",
    configResolved(config) {
      if (config.command === "build" && mode === "production") {
        const apiUrl = trimOrigin(env.VITE_API_URL ?? env.VITE_API_BASE_URL ?? "");
        if (!apiUrl) {
          throw new Error(
            "[BW-PORTAL] VITE_API_URL is required for production builds.\n" +
              "Set VITE_API_URL=https://api.yourdomain.com before running npm run build.",
          );
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = trimOrigin(env.VITE_API_URL) || DEFAULT_PROXY_TARGET;

  return {
    plugins: [react(), enforceProductionApiUrl(env, mode)],
    server: {
      proxy: {
        /**
         * When `VITE_API_URL` is **unset**, `getApiOrigin()` is `""` in dev → requests use
         * same-origin `/api/...` → this proxy → `proxyTarget` (defaults to local backend).
         * When `VITE_API_URL` is set, the app calls the backend **directly** and does not rely on this proxy.
         */
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("origin", proxyTarget);
            });
          },
        },
      },
    },
  };
});
