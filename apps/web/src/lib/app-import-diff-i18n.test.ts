import { describe, expect, test } from "vitest";
import { researchImportDiffDetail } from "../App";
import { createI18n } from "./i18n";

describe("research import diff localization", () => {
  test("hides Review and Decision readback error suffixes in Chinese", () => {
    const i18n = createI18n("zh-CN");
    const internalSuffix = "decision store offline · token=internal-secret · trace_id=abc123";

    const reviewDetail = researchImportDiffDetail(
      i18n,
      `Authoritative Review readback unavailable; import is blocked fail-closed. ${internalSuffix}`
    );
    const decisionDetail = researchImportDiffDetail(
      i18n,
      `Decision readback unavailable; import is blocked fail-closed. ${internalSuffix}`
    );

    expect(reviewDetail).toBe("权威评审回读不可用；导入已按 fail-closed 阻断。");
    expect(decisionDetail).toBe("Decision 回读不可用；导入已按 fail-closed 阻断。");
    expect(reviewDetail).not.toContain(internalSuffix);
    expect(decisionDetail).not.toContain(internalSuffix);

    const englishReviewDetail = researchImportDiffDetail(
      createI18n("en-US"),
      `Authoritative Review readback unavailable; import is blocked fail-closed. ${internalSuffix}`
    );
    expect(englishReviewDetail).toBe("Authoritative Review readback unavailable; import is blocked fail-closed.");
    expect(englishReviewDetail).not.toContain(internalSuffix);
  });
});
