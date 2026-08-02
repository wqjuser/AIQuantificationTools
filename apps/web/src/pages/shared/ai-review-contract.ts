import type { ReactNode } from "react";
import type {
  AiReviewDecision,
  AiReviewProviderId,
  AiReviewProviderStatus,
  AppendAiReviewDecisionRequest,
  AuthoritativeAiReviewRun,
} from "../../lib/ai-review-stage3";
import type {
  ProductionStrategyHandoffResult,
  StrategyProductionBinding,
} from "../../lib/terminal-api";
import type { StrategyExperimentListItem } from "../../lib/terminal-workbench";

export interface AiReviewController {
  appendingDecision: boolean;
  busy: boolean;
  running: boolean;
  comparisonExperimentIds: string[];
  currentReview: AuthoritativeAiReviewRun | null;
  decisionDraft: AppendAiReviewDecisionRequest;
  decisions: AiReviewDecision[];
  error: string | null;
  experiments: StrategyExperimentListItem[];
  externalDataApproved: boolean;
  history: AuthoritativeAiReviewRun[];
  onAppendDecision: () => void;
  onComparisonToggle: (experimentId: string) => void;
  onDecisionDraftChange: (draft: AppendAiReviewDecisionRequest) => void;
  onExternalDataApprovedChange: (approved: boolean) => void;
  onOpenProductionHandoff: () => void;
  onProviderChange: (providerId: AiReviewProviderId) => void;
  onStagePrimaryCandidate: () => void;
  primaryExperimentId: string | null;
  primaryCandidateAvailable: boolean;
  providerId: AiReviewProviderId;
  providers: AiReviewProviderStatus[];
  researchLoop?: ReactNode;
}

export interface AiReviewProductionPathProjection {
  binding: StrategyProductionBinding | null;
  errorLabel: string | null;
  switchBlockedReasonLabel?: string | null;
  onOpenDynamicTrading: () => void;
  result: ProductionStrategyHandoffResult;
}

export type AiReviewProductionPathAction =
  | "stage-primary-candidate"
  | "open-production-handoff"
  | "open-dynamic-trading"
  | null;

export interface AiReviewProductionPath {
  action: AiReviewProductionPathAction;
  actionLabel: string | null;
  detail: string;
  label: string;
  tone: "neutral" | "positive" | "warning" | "risk";
}
