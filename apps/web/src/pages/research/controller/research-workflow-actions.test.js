import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./research-workflow-actions.tsx", import.meta.url), "utf8");
const runPipelineSource = source.slice(
  source.indexOf("const runPipeline = useCallback"),
  source.indexOf("const copyResearchContextLink = useCallback"),
);

describe("production research P0 action", () => {
  it("uses only an explicit registered-template selection for a formal sealed source run", () => {
    expect(runPipelineSource).toContain("loadStrategyResearchCapabilities(quantCoreBaseUrl");
    expect(runPipelineSource).toContain("selectedResearchP0TemplateId");
    expect(runPipelineSource).toContain("resolveResearchP0TemplateSelection(");
    expect(runPipelineSource).toContain("buildFormalSealedDatasetWindow(");
    expect(runPipelineSource).toContain("formalCapability.sealedData");
    expect(runPipelineSource).toContain("registeredTemplateId: formalCapability.templateId");
    expect(runPipelineSource).toContain("sealedDataset: formalSealedDataset");
    expect(runPipelineSource).not.toMatch(
      /capabilities\.find\(\(capability\)\s*=>\s*capability\.market/,
    );
    expect(runPipelineSource).toContain("setWorkspaceState(result)");
  });

  it("keeps the legacy strategy preflight as the default P0 branch", () => {
    expect(runPipelineSource).toContain("if (selectedResearchP0TemplateId)");
    expect(runPipelineSource).toContain("validateStrategySnapshot(quantCoreBaseUrl");
    expect(runPipelineSource).toContain("strategy: workspace.strategy");
  });
});
