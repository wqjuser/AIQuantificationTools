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
    expect(workflow).toContain("actions/checkout@v4");
    expect(workflow).toContain("actions/setup-node@v4");
    expect(workflow).toContain("node-version: 22");
    expect(workflow).toContain("cache: npm");
    expect(workflow).toContain("actions/setup-python@v5");
    expect(workflow).toContain('python-version: "3.12"');
    expect(workflow).toContain("npm ci");
    expect(workflow).toContain("npm test");
    expect(workflow).toContain("npm run build");
    expect(workflow).toContain("docker compose config");
    expect(workflow).toContain("docker compose build");
    expect(workflow).toContain("python tools/docker_smoke.py --no-build --down");
  });

  test("exposes Docker lifecycle and smoke test commands from the root package", () => {
    const packageJson = JSON.parse(readRepoFile("package.json"));

    expect(packageJson.scripts["docker:up"]).toBe("docker compose up --build");
    expect(packageJson.scripts["docker:down"]).toBe("docker compose down");
    expect(packageJson.scripts["docker:smoke"]).toBe("python tools/docker_smoke.py");
    expect(existsSync(repoFile("tools/docker_smoke.py"))).toBe(true);
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
    expect(apiDockerfile).toContain("EXPOSE 8765");
    expect(apiDockerfile).toContain('CMD ["python", "tools/run_quant_api.py"]');

    const webDockerfile = readRepoFile("apps/web/Dockerfile");
    expect(webDockerfile).toContain("FROM node:22-alpine AS build");
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
});
