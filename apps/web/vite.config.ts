import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function vendorChunkName(id: string) {
  const normalizedId = id.split("\\").join("/");

  if (!normalizedId.includes("node_modules/")) {
    return undefined;
  }

  if (normalizedId.includes("/klinecharts/")) {
    return "vendor-charts";
  }

  if (normalizedId.includes("/lucide-react/") || normalizedId.includes("/lucide/")) {
    return "vendor-icons";
  }

  if (normalizedId.includes("/@tauri-apps/")) {
    return "vendor-tauri";
  }

  if (
    normalizedId.includes("/react/") ||
    normalizedId.includes("/react-dom/") ||
    normalizedId.includes("/scheduler/")
  ) {
    return "vendor-react";
  }

  return "vendor";
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: vendorChunkName
      }
    }
  },
  test: {
    environment: "node"
  }
});
