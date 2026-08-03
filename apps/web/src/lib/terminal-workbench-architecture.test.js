import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import ts from "typescript";

const libRoot = dirname(fileURLToPath(import.meta.url));
const seamPath = join(libRoot, "terminal-workbench.ts");
const implementationRoot = join(libRoot, "terminal-workbench");

function source(path) {
  return readFileSync(path, "utf8");
}

function lineCount(path) {
  return source(path).split("\n").length - 1;
}

function implementationFiles() {
  return readdirSync(implementationRoot, { recursive: true })
    .map((entry) => join(implementationRoot, entry))
    .filter((path) => statSync(path).isFile() && path.endsWith(".ts"));
}

describe("terminal workbench architecture", () => {
  test("keeps the compatibility seam and implementation modules below 1000 lines", () => {
    expect(lineCount(seamPath)).toBeLessThan(1000);
    for (const path of implementationFiles()) {
      expect(lineCount(path), relative(libRoot, path)).toBeLessThan(1000);
    }
  });

  test("keeps the compatibility seam as declarations-only re-exports", () => {
    const seam = ts.createSourceFile(seamPath, source(seamPath), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    expect(seam.statements.length).toBeGreaterThan(0);
    for (const statement of seam.statements) {
      expect(ts.isExportDeclaration(statement)).toBe(true);
      expect(statement.moduleSpecifier?.text).toMatch(/^\.\/terminal-workbench\//);
    }
  });

  test("keeps implementation modules independent from the compatibility seam", () => {
    for (const path of implementationFiles()) {
      expect(source(path), relative(libRoot, path)).not.toMatch(/from ["']\.\.\/terminal-workbench["']/);
    }
  });

  test("uses responsibility names instead of numbered chunks", () => {
    for (const path of implementationFiles()) {
      expect(relative(implementationRoot, path)).not.toMatch(/(?:^|\/)(?:chunk|part|module|segment)[-_]?\d/i);
    }
  });
});
