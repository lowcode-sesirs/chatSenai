import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl = env.VITE_API_BASE_URL || "/api";
  const proxyTarget = apiBaseUrl.replace(/\/+$/, "").replace(/\/api$/, "");

  return {
    plugins: [react()],

    // Base absoluta para que rotas como /pdf/:id carreguem os assets corretamente no Firebase.
    base: "/",

    resolve: {
      alias: {
        "@": path.resolve("./src"),
      },
    },

    build: {
      manifest: true,
      emptyOutDir: true,
      outDir: "dist",
      rollupOptions: {
        output: {
          // Keep deterministic names to avoid stale hashed entry references when opening deep links (/pdf/:id).
          entryFileNames: "assets/app.js",
          chunkFileNames: "assets/[name].js",
          assetFileNames: "assets/[name].[ext]",
        },
      },
    },

    server: {
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
          configure: (proxy) => {
            proxy.on("error", (err) => {
              console.log("Proxy error:", err.message);
            });
            proxy.on("proxyReq", (_proxyReq, req) => {
              console.log("Proxy request:", req.method, req.url);
            });
            proxy.on("proxyRes", (proxyRes, req) => {
              console.log("Proxy response:", proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
  };
});
