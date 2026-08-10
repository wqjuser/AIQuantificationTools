import type { StrategyResearchCapability } from "./strategy-research";

export interface ResearchP0CapabilityContext {
  market: string;
  symbol: string;
  timeframe: string;
}

export type ResearchP0TemplateSelection = {
  mode: "legacy";
} | {
  mode: "registered";
  capability: StrategyResearchCapability;
};

export function matchingResearchP0Capabilities(
  capabilities: readonly StrategyResearchCapability[],
  context: ResearchP0CapabilityContext,
): StrategyResearchCapability[] {
  return capabilities.filter((capability) => (
    capability.market === context.market
    && capability.symbol === context.symbol
    && capability.timeframe === context.timeframe
  ));
}

export function resolveResearchP0TemplateSelection(
  capabilities: readonly StrategyResearchCapability[],
  selectedTemplateId: string,
  context: ResearchP0CapabilityContext,
): ResearchP0TemplateSelection {
  if (selectedTemplateId === "") {
    return { mode: "legacy" };
  }
  if (selectedTemplateId !== selectedTemplateId.trim()) {
    throw new TypeError("Selected registered template is not available for the current research context");
  }
  const capability = matchingResearchP0Capabilities(capabilities, context)
    .find((candidate) => candidate.templateId === selectedTemplateId);
  if (!capability) {
    throw new TypeError("Selected registered template is not available for the current research context");
  }
  return { mode: "registered", capability };
}
