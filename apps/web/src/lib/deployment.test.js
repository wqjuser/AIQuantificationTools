import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

function repoFile(path) {
  return new URL(`../../../../${path}`, import.meta.url);
}

function readRepoFile(path) {
  return readFileSync(repoFile(path), "utf8");
}

function composeService(compose, serviceName) {
  const match = compose.match(new RegExp(`^  ${serviceName}:\\n([\\s\\S]*?)(?=^  [a-zA-Z0-9_-]+:|^volumes:)`, "m"));
  return match?.[0] ?? "";
}

function composeEnvironment(service) {
  const match = service.match(/^    environment:\n((?: {6}[A-Z][A-Z0-9_]*:[^\n]*\n)+)/m);
  return match?.[1] ?? "";
}

function renderComposeDefaults(service) {
  return service.replace(/\$\{[A-Z0-9_]+:-([^}]*)\}/g, (_match, fallback) => fallback);
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
    expect(workflow).toContain("npm run docker:smoke:stage5 -- --no-build --down");
    expect(workflow).toContain("npm run docker:smoke:stage5:validate");
    expect(workflow).toContain("npm run docker:smoke:stage6 -- --no-build");
    expect(workflow).toContain("npm run docker:smoke:stage6:validate");
    expect(workflow).toContain("npm run docker:smoke:stage7 -- --no-build");
    expect(workflow).toContain("npm run docker:smoke:stage7:validate");
    expect(workflow).toContain("npm run docker:smoke:stage8 -- --no-build");
    expect(workflow).toContain("npm run docker:smoke:stage8:validate");
    expect(workflow).toContain("actions/upload-artifact@v5");
    expect(workflow).toContain("p0-acceptance-manifest");
    expect(workflow).toContain("data/p0-acceptance.json");
    expect(workflow).toContain("stage5-release-manifests");
    expect(workflow).toContain("stage6-sandbox-safety-manifest");
    expect(workflow).toContain("data/stage6-sandbox-safety.json");
    expect(workflow).toContain("stage7-production-readonly-safety-manifest");
    expect(workflow).toContain("data/stage7-production-readonly-safety.json");
    expect(workflow).toContain("stage8-production-readonly-continuity-manifest");
    expect(workflow).toContain("data/stage8-production-readonly-continuity.json");
    for (const path of [
      "data/stage3-ai-review.json",
      "data/stage4-portfolio-paper.json",
      "data/stage5-shadow-execution.json",
      "data/stage5-sandbox-readiness.json",
      "data/stage5-sandbox-readonly-probe.json",
      "data/stage5-sandbox-authorization-preflight.json",
      "data/stage5-sandbox-authorization-review.json",
      "data/stage5-exit-acceptance.json",
    ]) {
      expect(workflow).toContain(path);
    }
    const releaseCommands = [
      "npm run docker:smoke:stage5 -- --no-build --down",
      "npm run docker:smoke:stage5:validate",
    ];
    expect(releaseCommands.map((command) => workflow.indexOf(command))).toEqual(
      [...releaseCommands].map((command) => workflow.indexOf(command)).sort((left, right) => left - right),
    );
    expect(workflow).toMatch(/- name: Upload Stage 5 release manifests\n\s+if: always\(\)/);
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
    expect(packageJson.scripts["docker:smoke:stage3"]).toBe(
      `${pythonLauncher} tools/docker_smoke.py --stage3-ai-review --stage3-ai-review-report data/stage3-ai-review.json`,
    );
    expect(packageJson.scripts["docker:smoke:stage3:validate"]).toBe(
      `${pythonLauncher} tools/docker_smoke.py --validate-stage3-ai-review-report data/stage3-ai-review.json`,
    );
    expect(packageJson.scripts["docker:smoke:stage3:live"]).toBe(
      `${pythonLauncher} tools/docker_smoke.py --stage3-ai-review-live-provider openai-compatible --stage3-ai-review-live-report data/stage3-ai-review-live.json`,
    );
    expect(packageJson.scripts["docker:smoke:stage4"]).toBe(
      `${pythonLauncher} tools/docker_smoke.py --stage4-portfolio-paper --stage4-portfolio-paper-report data/stage4-portfolio-paper.json`,
    );
    expect(packageJson.scripts["docker:smoke:stage4:validate"]).toBe(
      `${pythonLauncher} tools/docker_smoke.py --validate-stage4-portfolio-paper-report data/stage4-portfolio-paper.json`,
    );
    expect(packageJson.scripts["docker:smoke:stage5"]).toContain(
      "--stage3-ai-review --stage3-ai-review-report data/stage3-ai-review.json",
    );
    expect(packageJson.scripts["docker:smoke:stage5"]).toContain(
      "--stage5-exit-acceptance --stage5-exit-acceptance-report data/stage5-exit-acceptance.json",
    );
    expect(packageJson.scripts["docker:smoke:stage5:validate"]).toContain(
      "--validate-stage5-exit-acceptance-report data/stage5-exit-acceptance.json",
    );
    expect(packageJson.scripts["docker:smoke:stage6"]).toBe(
      `${pythonLauncher} tools/stage6_sandbox_acceptance.py --report data/stage6-sandbox-safety.json`,
    );
    expect(packageJson.scripts["docker:smoke:stage6:validate"]).toBe(
      `${pythonLauncher} tools/stage6_sandbox_acceptance.py --validate data/stage6-sandbox-safety.json`,
    );
    expect(packageJson.scripts["docker:smoke:stage7"]).toBe(
      `${pythonLauncher} tools/stage7_production_readonly_acceptance.py --report data/stage7-production-readonly-safety.json`,
    );
    expect(packageJson.scripts["docker:smoke:stage7:validate"]).toBe(
      `${pythonLauncher} tools/stage7_production_readonly_acceptance.py --validate data/stage7-production-readonly-safety.json`,
    );
    expect(packageJson.scripts["docker:smoke:stage7:real"]).toContain(
      "--real-request data/stage7-production-readonly-acceptance-request.json",
    );
    expect(packageJson.scripts["docker:smoke:stage7:real:validate"]).toBe(
      `${pythonLauncher} tools/stage7_production_readonly_acceptance.py --validate data/stage7-production-readonly.json`,
    );
    expect(packageJson.scripts["docker:smoke:stage8"]).toBe(
      `${pythonLauncher} tools/stage8_production_readonly_continuity_acceptance.py --report data/stage8-production-readonly-continuity.json`,
    );
    expect(packageJson.scripts["docker:smoke:stage8:validate"]).toBe(
      `${pythonLauncher} tools/stage8_production_readonly_continuity_acceptance.py --validate data/stage8-production-readonly-continuity.json`,
    );
    expect(existsSync(repoFile("tools/stage7_production_readonly_acceptance.py"))).toBe(true);
    expect(existsSync(repoFile("tools/stage8_production_readonly_continuity_acceptance.py"))).toBe(true);
    expect(existsSync(repoFile("tools/docker_smoke.py"))).toBe(true);
  });

  test("waits for the Stage 7 API before the first real acceptance request", () => {
    const acceptance = readRepoFile("tools/stage7_production_readonly_acceptance.py");
    const composeUp = acceptance.indexOf('"compose", "up", "-d"');
    const waitForApi = acceptance.indexOf("_wait_for_api(repo, env)", composeUp);
    const realRequest = acceptance.indexOf('"--container-real-request"', waitForApi);

    expect(composeUp).toBeGreaterThan(-1);
    expect(waitForApi).toBeGreaterThan(composeUp);
    expect(realRequest).toBeGreaterThan(waitForApi);
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
    expect(compose).toContain("CCXT_SANDBOX_API_KEY: ${CCXT_SANDBOX_API_KEY:-}");
    expect(compose).toContain("CCXT_SANDBOX_SECRET: ${CCXT_SANDBOX_SECRET:-}");
    expect(compose).toContain("CCXT_PRODUCTION_READONLY_API_KEY: ${CCXT_PRODUCTION_READONLY_API_KEY:-}");
    expect(compose).toContain("CCXT_PRODUCTION_READONLY_SECRET: ${CCXT_PRODUCTION_READONLY_SECRET:-}");
    expect(compose).toContain("HTTPS_PROXY: ${HTTPS_PROXY:-}");
    expect(compose).toContain("quant-data:/app/data");
    expect(compose).toContain("${AIQT_WEB_PORT:-5173}:80");
    expect(compose).toContain("condition: service_healthy");
    expect(compose).toContain("healthcheck:");
    expect(compose).toContain("volumes:");
    expect(compose).toContain("quant-data:");
  });

  test("passes Stage 3 provider environment to the API service only", () => {
    const compose = readRepoFile("compose.yaml");
    const apiService = composeService(compose, "api");
    const webService = composeService(compose, "web");
    const apiEnvironment = composeEnvironment(apiService);
    const webDockerfile = readRepoFile("apps/web/Dockerfile");

    const providerEnvironment = {
      OPENAI_API_KEY: "${OPENAI_API_KEY:-}",
      OPENAI_MODEL: "${OPENAI_MODEL:-}",
      OPENAI_COMPATIBLE_BASE_URL: "${OPENAI_COMPATIBLE_BASE_URL:-}",
      OPENAI_COMPATIBLE_API_KEY: "${OPENAI_COMPATIBLE_API_KEY:-}",
      OPENAI_COMPATIBLE_MODEL: "${OPENAI_COMPATIBLE_MODEL:-}",
      OLLAMA_BASE_URL: "${OLLAMA_BASE_URL:-http://host.docker.internal:11434}",
      OLLAMA_MODEL: "${OLLAMA_MODEL:-}",
    };
    for (const [name, value] of Object.entries(providerEnvironment)) {
      expect(apiEnvironment).toContain(`      ${name}: ${value}\n`);
      expect(webService).not.toContain(name);
      expect(webDockerfile).not.toContain(name);
    }
    expect(renderComposeDefaults(apiEnvironment)).toContain("OLLAMA_BASE_URL: http://host.docker.internal:11434");
    expect(composeEnvironment(apiService.replace("    environment:", "    labels:"))).toBe("");
  });

  test("passes an optional HTTPS proxy to the API service only", () => {
    const compose = readRepoFile("compose.yaml");
    const apiService = composeService(compose, "api");
    const webService = composeService(compose, "web");
    const example = readRepoFile(".env.example");

    expect(apiService).toContain("HTTPS_PROXY: ${HTTPS_PROXY:-}");
    expect(webService).not.toContain("HTTPS_PROXY");
    expect(example).toContain("HTTPS_PROXY=\n");
    expect(example).toContain("http://host.docker.internal:7890");
  });

  test("documents safe Stage 3 provider defaults in Chinese", () => {
    const example = readRepoFile(".env.example");

    expect(example).toContain("OPENAI_API_KEY=\n");
    expect(example).toContain("OPENAI_MODEL=\n");
    expect(example).toContain("OPENAI_COMPATIBLE_BASE_URL=\n");
    expect(example).toContain("OPENAI_COMPATIBLE_API_KEY=\n");
    expect(example).toContain("OPENAI_COMPATIBLE_MODEL=\n");
    expect(example).toContain("OLLAMA_BASE_URL=http://host.docker.internal:11434\n");
    expect(example).toContain("OLLAMA_MODEL=\n");
    expect(example).toContain("必须包含 Provider API 前缀");
    expect(example).toContain("不能包含 /chat/completions");
    expect(example).toContain('rstrip("/") + "/chat/completions"');
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
