import type { createI18n, TranslationKey } from "../lib/i18n";
import {
  AI_REVIEW_EXTERNAL_DATA_FIELDS,
  aiReviewRequiresExternalApproval,
  buildAiReviewAssessmentColumns,
  buildComparisonEligibility,
  canRunAiReviewStage3,
  type AiReviewAssessment,
  type AiReviewDecision,
  type AiReviewDecisionStatus,
  type AiReviewProviderId,
  type AiReviewProviderStatus,
  type AppendAiReviewDecisionRequest,
  type AuthoritativeAiReviewRun,
  type LegacyAiReviewHistoryRecord
} from "../lib/ai-review-stage3";
import type { StrategyExperimentListItem } from "../lib/terminal-workbench";

export interface AiReviewStage3SectionProps {
  i18n: ReturnType<typeof createI18n>;
  experiments: StrategyExperimentListItem[];
  primaryExperimentId: string | null;
  comparisonExperimentIds: string[];
  providers: AiReviewProviderStatus[];
  providerId: AiReviewProviderId;
  externalDataApproved: boolean;
  currentReview: AuthoritativeAiReviewRun | null;
  decisions: AiReviewDecision[];
  history: AuthoritativeAiReviewRun[];
  legacyHistory: LegacyAiReviewHistoryRecord[];
  decisionDraft: AppendAiReviewDecisionRequest;
  loading: boolean;
  running: boolean;
  appendingDecision: boolean;
  error: string | null;
  onPrimaryChange: (experimentId: string) => void;
  onComparisonToggle: (experimentId: string) => void;
  onProviderChange: (providerId: AiReviewProviderId) => void;
  onExternalDataApprovedChange: (approved: boolean) => void;
  onRunReview: () => void;
  onLoadReview: (aiReviewId: string) => void;
  onDecisionDraftChange: (draft: AppendAiReviewDecisionRequest) => void;
  onAppendDecision: () => void;
}

const decisionStatuses: AiReviewDecisionStatus[] = [
  "accepted_for_research",
  "revision_requested",
  "rejected",
  "insufficient_evidence"
];

export function AiReviewStage3Section({
  appendingDecision,
  comparisonExperimentIds,
  currentReview,
  decisionDraft,
  decisions,
  error,
  experiments,
  externalDataApproved,
  history,
  i18n,
  legacyHistory,
  loading,
  onAppendDecision,
  onComparisonToggle,
  onDecisionDraftChange,
  onExternalDataApprovedChange,
  onLoadReview,
  onPrimaryChange,
  onProviderChange,
  onRunReview,
  primaryExperimentId,
  providerId,
  providers,
  running
}: AiReviewStage3SectionProps) {
  const primary = experiments.find((experiment) => experiment.experimentId === primaryExperimentId) ?? null;
  const selectedProvider = providers.find((provider) => provider.providerId === providerId) ?? null;
  const requiresApproval = aiReviewRequiresExternalApproval(providerId);
  const busy = loading || running || appendingDecision;
  const canRun = canRunAiReviewStage3({
    primaryExperimentId,
    providers,
    providerId,
    externalDataApproved,
    busy
  });
  const latestPredecessor = decisions.at(-1)?.decisionId ?? null;
  const canAppendDecision = Boolean(currentReview)
    && decisionDraft.operator.trim().length > 0
    && decisionDraft.rationale.trim().length > 0
    && !busy;
  const columns = currentReview ? buildAiReviewAssessmentColumns(currentReview) : null;

  return (
    <section className="ai-review-stage3-section">
      <header className="ai-review-stage3-heading">
        <div>
          <span>{i18n.t("aiReviewStage3.title")}</span>
          <strong>{i18n.t("aiReviewStage3.subtitle")}</strong>
        </div>
        <span className="ai-review-stage3-boundary">{i18n.t("aiReviewStage3.paperBoundary")}</span>
      </header>

      {error ? <p className="ai-review-stage3-error" role="alert">{error}</p> : null}

      <div className="ai-review-stage3-grid">
        <section className="ai-review-stage3-card">
          <h3>{i18n.t("aiReviewStage3.draftSelection")}</h3>
          <label>
            <span>{i18n.t("aiReviewStage3.primary")}</span>
            <select
              data-testid="ai-review-stage3-primary"
              disabled={busy}
              onChange={(event) => onPrimaryChange(event.target.value)}
              value={primaryExperimentId ?? ""}
            >
              <option value="">{i18n.t("aiReviewStage3.noCompletedExperiment")}</option>
              {experiments.filter((experiment) => experiment.status === "completed").map((experiment) => (
                <option key={experiment.experimentId} value={experiment.experimentId}>
                  {experiment.experimentId}
                </option>
              ))}
            </select>
          </label>
          <div className="ai-review-stage3-comparisons">
            <strong>{i18n.t("aiReviewStage3.comparisons")}</strong>
            {primary ? experiments.filter((experiment) => experiment.experimentId !== primary.experimentId).map((experiment) => {
              const selected = comparisonExperimentIds.includes(experiment.experimentId);
              const eligibility = selected
                ? { eligible: true, reason: null }
                : buildComparisonEligibility(primary, experiment, comparisonExperimentIds);
              return (
                <label className={eligibility.eligible ? "eligible" : "ineligible"} key={experiment.experimentId}>
                  <input
                    checked={selected}
                    data-testid="ai-review-stage3-comparison"
                    disabled={busy || (!selected && !eligibility.eligible)}
                    onChange={() => onComparisonToggle(experiment.experimentId)}
                    type="checkbox"
                  />
                  <span>
                    <b>{experiment.experimentId}</b>
                    <small>
                      {eligibility.reason
                        ? `${i18n.t(`aiReviewStage3.reason.${eligibility.reason}` as TranslationKey)} · ${eligibility.reason}`
                        : i18n.t("aiReviewStage3.eligible")}
                    </small>
                  </span>
                </label>
              );
            }) : <p>{i18n.t("aiReviewStage3.noCompletedExperiment")}</p>}
          </div>
        </section>

        <section className="ai-review-stage3-card">
          <h3>{i18n.t("aiReviewStage3.provider")}</h3>
          <label>
            <span>{i18n.t("aiReviewStage3.provider")}</span>
            <select
              data-testid="ai-review-stage3-provider"
              disabled={busy}
              onChange={(event) => onProviderChange(event.target.value as AiReviewProviderId)}
              value={providerId}
            >
              {providers.map((provider) => (
                <option key={provider.providerId} value={provider.providerId}>
                  {provider.providerId} · {provider.configured
                    ? i18n.t("aiReviewStage3.configured")
                    : i18n.t("aiReviewStage3.notConfigured")}
                </option>
              ))}
            </select>
          </label>
          <dl className="ai-review-stage3-provider-detail">
            <div><dt>{i18n.t("aiReviewStage3.model")}</dt><dd>{selectedProvider?.model ?? "—"}</dd></div>
            <div><dt>{i18n.t("aiReviewStage3.baseUrl")}</dt><dd>{selectedProvider?.sanitizedBaseUrl ?? "—"}</dd></div>
          </dl>
          {requiresApproval ? (
            <div className="ai-review-stage3-outbound">
              <strong>{i18n.t("aiReviewStage3.outboundFields")}</strong>
              <ul>
                {AI_REVIEW_EXTERNAL_DATA_FIELDS.map((field) => (
                  <li key={field}>{i18n.t(`aiReviewStage3.outbound.${field}` as TranslationKey)}</li>
                ))}
              </ul>
              <label className="ai-review-stage3-approval">
                <input
                  checked={externalDataApproved}
                  data-testid="ai-review-stage3-approval"
                  disabled={busy}
                  onChange={(event) => onExternalDataApprovedChange(event.target.checked)}
                  type="checkbox"
                />
                <span>{i18n.t("aiReviewStage3.externalApproval")}</span>
              </label>
            </div>
          ) : null}
          <div className="ai-review-stage3-actions">
            <button
              data-testid="ai-review-stage3-run"
              disabled={!canRun}
              onClick={onRunReview}
              type="button"
            >
              {running ? i18n.t("aiReviewStage3.running") : i18n.t("aiReviewStage3.run")}
            </button>
          </div>
        </section>
      </div>

      {currentReview && columns ? (
        <section className="ai-review-stage3-result">
          <header>
            <span>{i18n.t("aiReviewStage3.loadedRecord")}</span>
            <strong>{currentReview.aiReviewId}</strong>
          </header>
          <ReviewMetadata i18n={i18n} review={currentReview} />
          <div className="ai-review-stage3-assessments">
            <AssessmentCard assessment={columns.deterministic} i18n={i18n} titleKey="aiReviewStage3.deterministic" />
            <AssessmentCard
              assessment={columns.external}
              emptyText={columns.externalError
                ? externalFailureText(i18n, columns.externalError.code)
                : i18n.t(`aiReviewStage3.external.${columns.externalStatus}` as TranslationKey)}
              i18n={i18n}
              titleKey="aiReviewStage3.external"
            />
          </div>
          <dl className="ai-review-stage3-hashes">
            <div><dt>{i18n.t("aiReviewStage3.evidenceHash")}</dt><dd className="ai-review-stage3-hash">{currentReview.evidenceHash}</dd></div>
            <div><dt>{i18n.t("aiReviewStage3.recordHash")}</dt><dd className="ai-review-stage3-hash">{currentReview.recordHash}</dd></div>
          </dl>
          <p className="ai-review-stage3-boundary-detail">{i18n.t("aiReviewStage3.safetyDetail")}</p>

          <section className="ai-review-stage3-decision">
            <h3>{i18n.t("aiReviewStage3.decision")}</h3>
            <p className="ai-review-stage3-hash">
              {i18n.t("aiReviewStage3.predecessor")}: {latestPredecessor ?? i18n.t("aiReviewStage3.noPredecessor")}
            </p>
            <div className="ai-review-stage3-decision-chain">
              {decisions.map((decision) => (
                <article key={decision.decisionId}>
                  <strong>{i18n.t(`aiReviewStage3.decision.${decision.status}` as TranslationKey)}</strong>
                  <p>{decision.rationale}</p>
                  <small className="ai-review-stage3-hash">{decision.recordHash}</small>
                </article>
              ))}
            </div>
            <div className="ai-review-stage3-decision-form">
              <label>
                <span>{i18n.t("aiReviewStage3.operator")}</span>
                <input
                  data-testid="ai-review-stage3-operator"
                  disabled={busy}
                  maxLength={80}
                  onChange={(event) => onDecisionDraftChange({ ...decisionDraft, operator: event.target.value })}
                  value={decisionDraft.operator}
                />
              </label>
              <label>
                <span>{i18n.t("aiReviewStage3.decisionStatus")}</span>
                <select
                  data-testid="ai-review-stage3-status"
                  disabled={busy}
                  onChange={(event) => onDecisionDraftChange({
                    ...decisionDraft,
                    status: event.target.value as AiReviewDecisionStatus
                  })}
                  value={decisionDraft.status}
                >
                  {decisionStatuses.map((status) => (
                    <option key={status} value={status}>
                      {i18n.t(`aiReviewStage3.decision.${status}` as TranslationKey)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ai-review-stage3-rationale">
                <span>{i18n.t("aiReviewStage3.rationale")}</span>
                <textarea
                  data-testid="ai-review-stage3-rationale"
                  disabled={busy}
                  maxLength={2000}
                  onChange={(event) => onDecisionDraftChange({ ...decisionDraft, rationale: event.target.value })}
                  value={decisionDraft.rationale}
                />
              </label>
              <div className="ai-review-stage3-actions">
                <button
                  data-testid="ai-review-stage3-append"
                  disabled={!canAppendDecision}
                  onClick={onAppendDecision}
                  type="button"
                >
                  {appendingDecision ? i18n.t("aiReviewStage3.appending") : i18n.t("aiReviewStage3.appendDecision")}
                </button>
              </div>
            </div>
          </section>
        </section>
      ) : <p className="ai-review-stage3-empty">{i18n.t("aiReviewStage3.noCurrentReview")}</p>}

      <section className="ai-review-stage3-history">
        <h3>{i18n.t("aiReviewStage3.history")}</h3>
        <div>
          {history.map((review) => (
            <article key={review.aiReviewId}>
              <div className="ai-review-stage3-history-heading">
                <span>{i18n.t("aiReviewStage3.authoritative")}</span>
                <strong>{review.aiReviewId}</strong>
                <small>{review.createdAt}</small>
              </div>
              <ReviewMetadata compact i18n={i18n} review={review} />
              <button
                data-testid="ai-review-stage3-inspect"
                disabled={busy}
                onClick={() => onLoadReview(review.aiReviewId)}
                type="button"
              >
                {i18n.t("aiReviewStage3.inspect")}
              </button>
            </article>
          ))}
          {legacyHistory.map((review) => (
            <article className="legacy" key={review.aiReviewId}>
              <span>{i18n.t("aiReviewStage3.legacyNonAuthoritative")}</span>
              <strong>{review.aiReviewId}</strong>
              <small>{review.createdAt}</small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function AssessmentCard({
  assessment,
  emptyText,
  i18n,
  titleKey
}: {
  assessment: AiReviewAssessment | null;
  emptyText?: string;
  i18n: ReturnType<typeof createI18n>;
  titleKey: TranslationKey;
}) {
  return (
    <article className="ai-review-stage3-assessment">
      <span>{i18n.t(titleKey)}</span>
      {assessment ? (
        <>
          <strong>{i18n.t(`aiReviewStage3.stance.${assessment.stance}` as TranslationKey)}</strong>
          <p>{assessment.summary}</p>
          <dl className="ai-review-stage3-assessment-meta">
            <div>
              <dt>{i18n.t("aiReviewStage3.consistency")}</dt>
              <dd>{i18n.t(`aiReviewStage3.consistency.${assessment.consistency}` as TranslationKey)}</dd>
            </div>
          </dl>
          {assessment.risks.map((risk, index) => (
            <div className={`ai-review-stage3-risk ${risk.severity}`} key={`${risk.message}-${index}`}>
              <b>{i18n.t(`aiReviewStage3.severity.${risk.severity}` as TranslationKey)}</b>
              <p>{risk.message}</p>
              <small className="ai-review-stage3-hash">{risk.evidenceReferences.join(" · ")}</small>
            </div>
          ))}
          <AssessmentList
            i18n={i18n}
            items={assessment.invalidationConditions}
            titleKey="aiReviewStage3.invalidationConditions"
          />
          <AssessmentList i18n={i18n} items={assessment.watchItems} titleKey="aiReviewStage3.watchItems" />
          <AssessmentList i18n={i18n} items={assessment.evidenceGaps} titleKey="aiReviewStage3.evidenceGaps" />
        </>
      ) : <p>{emptyText ?? i18n.t("aiReviewStage3.external.skipped")}</p>}
    </article>
  );
}

function AssessmentList({
  i18n,
  items,
  titleKey
}: {
  i18n: ReturnType<typeof createI18n>;
  items: string[];
  titleKey: TranslationKey;
}) {
  return (
    <section className="ai-review-stage3-assessment-list">
      <b>{i18n.t(titleKey)}</b>
      {items.length
        ? <ul>{items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>
        : <p>{i18n.t("aiReviewStage3.none")}</p>}
    </section>
  );
}

function ReviewMetadata({
  compact = false,
  i18n,
  review
}: {
  compact?: boolean;
  i18n: ReturnType<typeof createI18n>;
  review: AuthoritativeAiReviewRun;
}) {
  return (
    <dl className={compact ? "ai-review-stage3-record-meta compact" : "ai-review-stage3-record-meta"}>
      <div><dt>{i18n.t("aiReviewStage3.primary")}</dt><dd>{review.primaryExperiment.experimentId}</dd></div>
      <div>
        <dt>{i18n.t("aiReviewStage3.comparisonRecords")}</dt>
        <dd>{review.comparisonExperiments.map((item) => item.experimentId).join(" · ") || i18n.t("aiReviewStage3.none")}</dd>
      </div>
      <div><dt>{i18n.t("aiReviewStage3.provider")}</dt><dd>{review.externalAssessment.provider}</dd></div>
      <div><dt>{i18n.t("aiReviewStage3.model")}</dt><dd>{review.externalAssessment.model ?? i18n.t("aiReviewStage3.none")}</dd></div>
      <div>
        <dt>{i18n.t("aiReviewStage3.baseUrl")}</dt>
        <dd>{review.externalAssessment.sanitizedBaseUrl ?? i18n.t("aiReviewStage3.none")}</dd>
      </div>
      <div>
        <dt>{i18n.t("aiReviewStage3.externalAttemptStatus")}</dt>
        <dd>{i18n.t(`aiReviewStage3.external.status.${review.externalAssessment.status}` as TranslationKey)}</dd>
      </div>
      <div><dt>{i18n.t("aiReviewStage3.evidenceHash")}</dt><dd className="ai-review-stage3-hash">{review.evidenceHash}</dd></div>
      <div><dt>{i18n.t("aiReviewStage3.recordHash")}</dt><dd className="ai-review-stage3-hash">{review.recordHash}</dd></div>
    </dl>
  );
}

function externalFailureText(
  i18n: ReturnType<typeof createI18n>,
  code: string
): string {
  const detail = code === "ai_review_provider_not_configured"
    ? i18n.t("aiReviewStage3.external.error.ai_review_provider_not_configured")
    : code === "timeout"
      ? i18n.t("aiReviewStage3.external.error.timeout")
      : code === "invalid_schema"
        ? i18n.t("aiReviewStage3.external.error.invalid_schema")
    : i18n.t("aiReviewStage3.external.error.generic");
  return `${i18n.t("aiReviewStage3.external.failed")} ${detail} · ${code}`;
}
