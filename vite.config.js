import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function trimOrigin(v) {
  return String(v ?? "")
    .trim()
    .replace(/\/$/, "");
}

/** Falls back to deployed API when env is unset (same default as `apiConfig.js`). */
const DEFAULT_PROXY_TARGET = "http://43.205.116.38:8080";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = trimOrigin(env.VITE_API_URL) || DEFAULT_PROXY_TARGET;

  return {
    plugins: [react()],
    server: {
      proxy: {
        /**
         * When `VITE_API_URL` is **unset**, `getApiOrigin()` is `""` in dev → requests use
         * same-origin `/api/...` → this proxy → `proxyTarget` (defaults to `DEFAULT_PROXY_TARGET`).
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
