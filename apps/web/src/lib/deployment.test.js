import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

function repoFile(path) {
  return new URL(`../../../../${path}`, import.meta.url);
}

function readRepoFile(path) {
  return readFileSync(repoFile(path), "utf8");
}

describe("docker deployment contract", () => {
  test("runs tests, build, Docker build, and Docker smoke in GitHub Actions", () => {
    expect(existsSync(repoFile(".github/workflows/ci.yml"))).toBe(true);

    const workflow = readRepoFile(".github/workflows/ci.yml");
    expect(workflow).toContain("name: CI");
    expect(workflow).toContain("push:");
    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain('FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: "true"');
    expect(workflow).toContain("actions/checkout@v6");
    expect(workflow).toContain("actions/setup-node@v6");
    expect(workflow).toContain("node-version: 24");
    expect(workflow).toContain("cache: npm");
    expect(workflow).toContain("actions/setup-python@v6");
    expect(workflow).toContain('python-version: "3.12"');
    expect(workflow).toContain("npm ci");
    expect(workflow).toContain("npm test");
    expect(workflow).toContain("npm run build");
    expect(workflow).toContain("docker compose config");
    expect(workflow).toContain("docker compose build");
    expect(workflow).toContain("npm run docker:smoke -- --no-build --down");
    expect(workflow).toContain("npm run docker:smoke:p0 -- --no-build --down");
    expect(workflow).toContain("npm run docker:smoke:p0:validate");
    expect(workflow).toContain("actions/upload-artifact@v5");
    expect(workflow).toContain("p0-acceptance-manifest");
    expect(workflow).toContain("data/p0-acceptance.json");
  });

  test("exposes Docker lifecycle and smoke test commands from the root package", () => {
    const packageJson = JSON.parse(readRepoFile("package.json"));
    const pythonLauncher = "node tools/run_python.mjs";

    expect(packageJson.scripts["docker:up"]).toBe("docker compose up --build");
    expect(packageJson.scripts["docker:down"]).toBe("docker compose down");
    expect(packageJson.scripts["docker:smoke"]).toBe(`${pythonLauncher} tools/docker_smoke.py`);
    expect(packageJson.scripts["docker:smoke:p0"]).toBe(
      `${pythonLauncher} tools/docker_smoke.py --p0-acceptance --p0-import-check --p0-acceptance-report data/p0-acceptance.json`,
    );
    expect(packageJson.scripts["docker:smoke:p0:validate"]).toBe(
      `${pythonLauncher} tools/docker_smoke.py --validate-p0-acceptance-report data/p0-acceptance.json`,
    );
    expect(packageJson.scripts["docker:smoke:stage2"]).toBe(
      `${pythonLauncher} tools/docker_smoke.py --stage2-strategy-experiment --stage2-strategy-experiment-report data/stage2-strategy-experiment.json`,
    );
    expect(packageJson.scripts["docker:smoke:stage2:validate"]).toBe(
      `${pythonLauncher} tools/docker_smoke.py --validate-stage2-strategy-experiment-report data/stage2-strategy-experiment.json`,
    );
    expect(existsSync(repoFile("tools/docker_smoke.py"))).toBe(true);
  });

  test("runs Python entrypoints through a cross-platform launcher", () => {
    const packageJson = JSON.parse(readRepoFile("package.json"));
    const launcher = readRepoFile("tools/run_python.mjs");

    expect(packageJson.scripts["test:python"]).toBe(
      "node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core",
    );
    expect(packageJson.scripts.api).toBe("node tools/run_python.mjs tools/run_quant_api.py");
    expect(packageJson.scripts["docker:smoke"]).toBe("node tools/run_python.mjs tools/docker_smoke.py");
    expect(launcher).toContain('"python3"');
    expect(launcher).toContain('"python"');
    expect(launcher).toContain('"py"');
    expect(launcher).toContain('"-3"');
  });

  test("ships a compose file with web and api services, health checks, and a persisted data volume", () => {
    expect(existsSync(repoFile("compose.yaml"))).toBe(true);

    const compose = readRepoFile("compose.yaml");
    expect(compose).toContain("services:");
    expect(compose).toContain("api:");
    expect(compose).toContain("web:");
    expect(compose).toContain("dockerfile: Dockerfile.api");
    expect(compose).toContain("dockerfile: apps/web/Dockerfile");
    expect(compose).toContain("QUANT_CORE_HOST: 0.0.0.0");
    expect(compose).toContain("QUANT_CORE_PORT: \"8765\"");
    expect(compose).toContain("quant-data:/app/data");
    expect(compose).toContain("${AIQT_WEB_PORT:-5173}:80");
    expect(compose).toContain("condition: service_healthy");
    expect(compose).toContain("healthcheck:");
    expect(compose).toContain("volumes:");
    expect(compose).toContain("quant-data:");
  });

  test("uses the Docker-first 5173 endpoint as the default smoke target", () => {
    const smokeHelper = readRepoFile("tools/docker_smoke.py");

    expect(smokeHelper).toContain('default="http://127.0.0.1:5173"');
  });

  test("ships focused Dockerfiles for the Python core and static web runtime", () => {
    expect(existsSync(repoFile("Dockerfile.api"))).toBe(true);
    expect(existsSync(repoFile("apps/web/Dockerfile"))).toBe(true);

    const apiDockerfile = readRepoFile("Dockerfile.api");
    expect(apiDockerfile).toContain("FROM python:3.12-slim");
    expect(apiDockerfile).toContain("ENV PYTHONPATH=/app/services/quant_core");
    expect(apiDockerfile).toContain("COPY package.json package.json");
    expect(apiDockerfile).toContain("EXPOSE 8765");
    expect(apiDockerfile).toContain('CMD ["python", "tools/run_quant_api.py"]');

    const webDockerfile = readRepoFile("apps/web/Dockerfile");
    expect(webDockerfile).toContain("FROM node:24-alpine AS build");
    expect(webDockerfile).toContain("ARG VITE_QUANT_API_BASE=/");
    expect(webDockerfile).toContain("RUN npm run build --workspace @aiqt/web");
    expect(webDockerfile).toContain("FROM nginx:");
    expect(webDockerfile).toContain("COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf");
  });

  test("ships nginx config that serves the SPA and proxies API calls to the core service", () => {
    expect(existsSync(repoFile("apps/web/nginx.conf"))).toBe(true);

    const nginx = readRepoFile("apps/web/nginx.conf");
    expect(nginx).toContain("listen 80;");
    expect(nginx).toContain("try_files $uri $uri/ /index.html;");
    expect(nginx).toContain("location /api/");
    expect(nginx).toContain("proxy_pass http://api:8765;");
    expect(nginx).toContain("location = /health");
    expect(nginx).toContain("proxy_pass http://api:8765/health;");
  });

  test("keeps local Vite development on the same API path as Docker", () => {
    const viteConfig = readRepoFile("apps/web/vite.config.ts");

    expect(viteConfig).toContain('"/api": "http://127.0.0.1:8765"');
    expect(viteConfig).toContain('"/health": "http://127.0.0.1:8765"');
  });
});
