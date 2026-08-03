import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, test } from "vitest";

const stylesEntryUrl = new URL("../styles.css", import.meta.url);
const stylesDirectoryUrl = new URL("../styles/", import.meta.url);

describe("global stylesheet architecture", () => {
  test("keeps the compatibility entry and every imported stylesheet below 1000 lines", () => {
    const files = [stylesEntryUrl];
    try {
      files.push(
        ...readdirSync(stylesDirectoryUrl)
          .filter((file) => file.endsWith(".css"))
          .map((file) => new URL(file, stylesDirectoryUrl))
      );
    } catch {
      // The directory is introduced by the split; the entry limit still fails first.
    }

    for (const file of files) {
      const lineCount = readFileSync(file, "utf8").split("\n").length;
      expect(lineCount, file.pathname).toBeLessThan(1000);
    }
  });

  test("keeps styles.css as an ordered import-only compatibility entry", () => {
    const source = readFileSync(stylesEntryUrl, "utf8");
    const imports = [...source.matchAll(/^@import "\.\/styles\/([^"/]+\.css)";$/gm)].map(
      ([, file]) => file
    );
    const remaining = source.replace(/^@import "\.\/styles\/[^"/]+\.css";\s*$/gm, "").trim();

    expect(imports.length).toBeGreaterThan(0);
    expect(new Set(imports).size).toBe(imports.length);
    expect(remaining).toBe("");
    expect(readdirSync(stylesDirectoryUrl).filter((file) => file.endsWith(".css")).sort()).toEqual(
      [...imports].sort()
    );
  });
});
