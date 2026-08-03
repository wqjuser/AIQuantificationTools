import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const pagesRoot = fileURLToPath(new URL("../pages", import.meta.url));

function sourceFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) {
      return sourceFiles(path);
    }
    return /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe("page panel architecture", () => {
  test("keeps every page implementation below 1000 lines", () => {
    for (const path of sourceFiles(pagesRoot)) {
      const lineCount = readFileSync(path, "utf8").split("\n").length;
      expect(lineCount, relative(pagesRoot, path)).toBeLessThan(1000);
    }
  });
});
