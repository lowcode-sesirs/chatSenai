import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // ✅ Base URL: "/" para Firebase, "/local/teste_dev/react/" para Moodle
  base: mode === 'development' ? '/' : '/',

  resolve: {
    alias: {
      "@": path.resolve("./src"),
    },
  },

  // ✅ Build para Firebase (dist) ou Moodle dependendo do comando
  build: {
    manifest: true,
    emptyOutDir: true,
    outDir: "dist", // Firebase usa dist/
  },

  server: {
    proxy: {
      "/api": {
        target: "https://backend-311313028224.southamerica-east1.run.app",
        changeOrigin: true,
        secure: true,
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("❌ Proxy error:", err.message)
          })
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("📤 Proxy request:", req.method, req.url)
          })
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log("📥 Proxy response:", proxyRes.statusCode, req.url)
          })
        },
      },
    },
  },
}))
