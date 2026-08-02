import type {
  ExecutionAdapterCertificationCheck,
  ExecutionAdapterProductionRouteReviewResult,
  PlatformSettingsStatus
} from "../../lib/terminal-api";

export function buildAdapterCertificationEvidenceChecks(
  adapter: PlatformSettingsStatus["executionAdapters"][number]
): ExecutionAdapterCertificationCheck[] {
  const hasPaperReadyContract = adapter.status === "paper_ready";
  return [
    {
      id: "sandbox-credentials",
      label: "Sandbox credential reference",
      status: hasPaperReadyContract ? "passed" : "blocked",
      detail: hasPaperReadyContract
        ? "Paper or sandbox route is present without exposing secret material."
        : "Sandbox or paper credential reference has not been certified.",
      metadata: {
        adapterStatus: adapter.status,
        credentialReference: "not-requested"
      }
    },
    {
      id: "order-lifecycle",
      label: "Order lifecycle evidence",
      status: "blocked",
      detail: "Submit, cancel, fill, reject, and reconnect evidence must be replayed before live routing."
    },
    {
      id: "emergency-stop",
      label: "Emergency stop and limits",
      status: "blocked",
      detail: "Max order, position, drawdown, and emergency-stop controls require operator evidence."
    },
    {
      id: "controlled-restart",
      label: "Controlled restart evidence",
      status: "review",
      detail: "Controlled restart and account sync evidence is not bound to this certification run."
    }
  ];
}

export function latestRecordedProductionRouteReviewIdForAdapter(
  reviews: ExecutionAdapterProductionRouteReviewResult[],
  adapterId: string
): string | undefined {
  return reviews
    .filter((review) => review.adapterId === adapterId && review.status === "route_review_recorded")
    .sort((left, right) => Date.parse(right.recordedAt) - Date.parse(left.recordedAt))[0]?.productionRouteReviewId;
}
