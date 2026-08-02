import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const srcRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pagesRoot = join(srcRoot, "pages");

function source(path) {
  return readFileSync(path, "utf8");
}

function filesBelow(root) {
  return readdirSync(root, { recursive: true })
    .map((entry) => join(root, entry))
    .filter((path) => statSync(path).isFile());
}

function lineCount(path) {
  return source(path).split("\n").length - 1;
}

describe("App controller architecture", () => {
  test("keeps the root controller and extracted controller/view modules below 1000 lines", () => {
    const rootController = join(pagesRoot, "app-shell/AppController.tsx");
    const constrainedFiles = filesBelow(pagesRoot).filter((path) =>
      /\/controller\/.*\.(ts|tsx)$/.test(path)
      || /\/view\/.*\.tsx$/.test(path)
    );

    expect(lineCount(rootController)).toBeLessThan(1000);
    for (const path of constrainedFiles) {
      expect(lineCount(path), relative(srcRoot, path)).toBeLessThan(1000);
    }
  });

  test("uses responsibility names for extracted controller modules", () => {
    const controllerFiles = filesBelow(pagesRoot).filter((path) => /\/controller\/.*\.(ts|tsx)$/.test(path));
    for (const path of controllerFiles) {
      expect(relative(srcRoot, path), relative(srcRoot, path)).not.toMatch(/\/controller-(?:\d+)\.(?:ts|tsx)$/);
    }
  });

  test("keeps extracted views on semantic actions instead of raw state setters", () => {
    const viewFiles = filesBelow(pagesRoot).filter((path) => /\/view\/.*\.tsx$/.test(path));
    for (const path of viewFiles) {
      expect(source(path), relative(srcRoot, path)).not.toMatch(/"set[A-Z][A-Za-z0-9_]*"/);
    }
  });

  test("keeps page controllers independent from root entries and sibling page controllers", () => {
    const controllerFiles = filesBelow(pagesRoot).filter((path) => /\/controller\/.*\.(ts|tsx)$/.test(path));
    for (const path of controllerFiles) {
      const contents = source(path);
      expect(contents, relative(srcRoot, path)).not.toMatch(/from ["'][^"']*\bApp(?:Controller)?["']/);
      const page = relative(pagesRoot, path).split("/")[0];
      for (const match of contents.matchAll(/from ["']([^"']*\/controller\/[^"']+)["']/g)) {
        const target = relative(pagesRoot, resolve(dirname(path), match[1]));
        if (target === "app-shell/controller/bindings") continue;
        expect(target.split("/")[0], `${relative(srcRoot, path)} -> ${match[1]}`).toBe(page);
      }
    }
  });

  test("does not introduce a second React state container", () => {
    const controllerSource = filesBelow(pagesRoot)
      .filter((path) => /\/controller\/.*\.(ts|tsx)$/.test(path))
      .map(source)
      .join("\n");
    expect(controllerSource).not.toMatch(/\bcreateContext\b|\buseContext\b|\buseReducer\b/);
  });

  test("preserves the App compatibility seam exports", () => {
    const appSource = source(join(srcRoot, "App.tsx"));
    const exports = [...appSource.matchAll(/export \{([^}]+)\} from/g)]
      .flatMap((match) => match[1].split(","))
      .map((name) => name.trim())
      .filter(Boolean)
      .sort();
    expect(exports).toEqual([
      "App",
      "StrategyConditionMenu",
      "researchContextReadinessDetail",
      "researchContextReadinessValue",
      "researchImportDiffDetail",
      "strategyAiConditionSummary",
      "strategyAiConfirmationSummary",
      "strategyAiDraftDiffRows",
      "strategyGovernanceContextLabel",
      "strategyGovernanceDetailLabel",
    ].sort());
  });
});
