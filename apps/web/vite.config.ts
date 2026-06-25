import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      "/api": "http://127.0.0.1:8765",
      "/health": "http://127.0.0.1:8765"
    }
  },
  build: {
    chunkSizeWarningLimit: 650,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "app-workbench", test: /src\/lib\/terminal-workbench/ },
            { name: "app-terminal-api", test: /src\/lib\/terminal-api/ },
            { name: "app-i18n", test: /src\/lib\/i18n/ },
            { name: "app-research-models", test: /src\/lib\/(?:backtest-report|chart-)/ },
            {
              name: "app-audit-panels",
              test: /src\/components\/(?:PortfolioPaperOrderAuditLedgerPanel|ExecutionAdapterPaperExecutionAuditLedgerPanel)/,
            },
            { name: "vendor-charts", test: /node_modules\/klinecharts/ },
            { name: "vendor-icons", test: /node_modules\/(?:lucide-react|lucide)\// },
            { name: "vendor-tauri", test: /node_modules\/@tauri-apps\// },
            { name: "vendor-react", test: /node_modules\/(?:react|react-dom|scheduler)\// },
            { name: "vendor", test: /node_modules\// },
          ],
        },
      }
    }
  },
  test: {
    environment: "node"
  }
});
