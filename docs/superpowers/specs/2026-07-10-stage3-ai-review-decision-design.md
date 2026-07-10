# Stage 3 Auditable AI Review Design

## Goal

Formally close Stage 2 after its final main-branch acceptance, open Stage 3 as the only current product stage, and ship an auditable AI review decision loop over persisted Strategy Experiment evidence.

Every review has a deterministic local baseline. A user may explicitly add one external-model enrichment through a configured OpenAI, OpenAI-compatible, or Ollama provider. External availability never determines whether the local review can complete, and neither AI output nor a human research decision authorizes paper or live execution.

## Approved Product Decisions

- AI review is audit-first and retains a deterministic local baseline.
- Human decisions are separate, append-only records rather than mutable fields on a review.
- A review supports one primary experiment and optional comparison experiments.
- Comparison experiments must share market, symbol, timeframe, and a derived strategy lineage while allowing different audited runs and canonical snapshots.
- Comparisons assess consistency, robustness, and evidence quality; they do not rank a global winner by raw return.
- Human decision states are `accepted_for_research`, `revision_requested`, `rejected`, and `insufficient_evidence`.
- External models are optional enhancements.
- Initial provider adapters are official OpenAI, generic OpenAI-compatible, and native Ollama.
- The user explicitly chooses one provider. There is no silent cross-provider failover or multi-model fan-out.

## Stage Boundary

The stage transition happens only after the full acceptance ladder passes on the implementation branch:

- Stage 0 remains `maintenance`.
- Stage 1 remains `maintenance` and its complete acceptance chain remains a regression gate.
- Stage 2 moves from `current` to `maintenance`.
- Stage 3 moves from `planned` to `current`.
- Stages 4 and 5 remain `planned`.

Existing AI, portfolio, paper, adapter, and audit capabilities outside this design remain supporting infrastructure. This design does not expand Stage 4 or Stage 5.

## Non-Goals

- No autonomous order, paper approval, portfolio change, or live authorization.
- No raw OHLCV, research-note text, account, position, order, or execution payload is sent to an external model.
- No provider registry UI, dynamic model discovery, automatic provider fallback, retry queue, streaming UI, tool calling, web search, RAG, or background job system.
- No Anthropic, Gemini, or other provider adapter in the first Stage 3 release.
- No mutable AI review or human-decision record.

## Architecture

### Evidence Assembler

`AiReviewEvidenceAssembler` accepts a primary experiment ID and up to four comparison experiment IDs. It loads evidence from `ResearchRunStore` and `StrategyExperimentStore`; clients cannot submit metrics, hashes, candidates, or review conclusions.

The assembler verifies:

- every experiment exists and is `completed`;
- experiment, definition, snapshot, source run, strategy revision, selected candidate, definition hash, and result hash agree;
- the selected candidate has test metrics and non-selected candidates do not;
- comparison IDs are unique and do not repeat the primary ID;
- all comparisons share the required context and strategy lineage;
- no more than five experiments are included.

It emits a canonical evidence bundle plus `evidenceHash`.

### Strategy Lineage

No new strategy-family table is introduced. `strategyLineageKey` is the canonical hash of:

- market, symbol, and timeframe;
- normalized strategy name;
- ordered entry and exit condition kinds;
- the sorted parameter-key set for each condition.

Parameter values, strategy revisions, audited runs, and snapshots may differ. A changed strategy name, condition order, condition kind, or parameter shape creates a different lineage.

### Deterministic Review Engine

`DeterministicAiReviewEngine` always runs. It evaluates evidence completeness, data-quality state, validation/test consistency, drawdown, trade count, walk-forward stability, comparison consistency, and live-safety boundaries.

It returns the same structured assessment schema used by external providers:

- `stance`: `supported`, `caution`, `blocked`, or `insufficient_evidence`;
- `summary`;
- `risks[]` with severity, text, and evidence references;
- `invalidationConditions[]`;
- `watchItems[]`;
- `evidenceGaps[]`;
- comparison `consistency`: `consistent`, `mixed`, `divergent`, or `insufficient`.

The engine never emits orders, target prices, position instructions, guaranteed returns, or execution authorization.

### External Provider Layer

One small `AiReviewProvider` protocol has three real implementations because three providers are in scope:

- `OpenAiResponsesProvider` calls the official OpenAI Responses API with structured output.
- `OpenAiCompatibleProvider` calls a configured Chat Completions-compatible endpoint.
- `OllamaChatProvider` calls Ollama's native chat endpoint with a JSON Schema format.

The selected provider receives the same bounded canonical evidence summary. The prompt treats all evidence strings as data, not instructions. Provider output is accepted only after strict JSON-schema validation and evidence-reference validation.

The deterministic and external assessments remain separate in the saved record. External output cannot overwrite the deterministic stance or any safety boundary.

## Provider Configuration

### Official OpenAI

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- fixed request URL: `https://api.openai.com/v1/responses`

### Generic OpenAI-Compatible

- `OPENAI_COMPATIBLE_BASE_URL`
- `OPENAI_COMPATIBLE_API_KEY`
- `OPENAI_COMPATIBLE_MODEL`
- request URL: `OPENAI_COMPATIBLE_BASE_URL.rstrip("/") + "/chat/completions"`

The configured base URL includes the provider's API prefix, such as `https://example.com/v1`, and excludes the final `/chat/completions` endpoint.

### Native Ollama

- `OLLAMA_BASE_URL`, default `http://127.0.0.1:11434`
- `OLLAMA_MODEL`
- request URL: `OLLAMA_BASE_URL.rstrip("/") + "/api/chat"`

Compose explicitly passes these variables to the API container. Provider status reports only configured/unconfigured state, model, and a sanitized base URL that retains scheme, host, port, and path while removing user info, query, and fragment. Keys are never returned or logged.

Each provider has one configured model in the first release. The UI does not discover remote models or accept an arbitrary endpoint.

## External Data Boundary

External requests may contain:

- experiment and evidence IDs/hashes;
- market, symbol, timeframe, and snapshot date range;
- strategy condition structure and risk parameters;
- train, validation, selected-test, and walk-forward metric summaries;
- data-quality status and warnings;
- deterministic evidence references.

External requests exclude:

- raw bars;
- free-form research-note content;
- API keys or secret-like metadata;
- account, position, portfolio, order, paper-execution, and live-adapter payloads;
- audit signing material;
- hidden model reasoning.

The frontend displays the provider, model, sanitized base URL, and outbound field groups before enabling the confirmation checkbox.

## Review Run Schema

`aiqt.aiReviewRun` schema v2 is backend-generated and immutable.

Required top-level fields:

- `schemaVersion`, `recordType`, `aiReviewId`, `createdAt`;
- `mode`: `single` or `comparison`;
- `primaryExperiment` and `comparisonExperiments`;
- `strategyLineageKey`, `evidenceHash`;
- `deterministicAssessment`;
- `externalAssessment`;
- `recordHash`;
- the fixed evidence-only and paper/live-blocked boundary.

Each experiment reference contains experiment ID, source run ID, strategy revision, snapshot ID, definition hash, result hash, selected candidate ID, candidate revision, canonical data hash, and data range.

`externalAssessment` contains:

- `status`: `completed`, `failed`, or `skipped`;
- provider, model, sanitized base URL, and endpoint hash;
- prompt-template and output-schema versions, the exact bounded rendered prompt, rendered-prompt hash, and evidence/request/response hashes;
- validated structured output when completed;
- token usage when returned, latency, and bounded error category/detail;
- no API key and no hidden-reasoning field.

The existing `ai_review_runs` table gains nullable v2 query columns. V2 insert is immutable: an ID conflict may return the existing row only when `recordHash` is identical; otherwise it is a conflict. Schema v1 records remain readable, importable, exportable, and visibly labeled legacy/non-authoritative.

The old run-scoped HTTP POST that accepts a complete client-generated v1 record is retired. Internal package import may still restore valid v1 records.

## Human Decision Schema

`aiqt.aiReviewDecision` schema v1 is stored in a new `ai_review_decisions` table.

Required fields:

- `decisionId`, `aiReviewId`, `createdAt`, and `operator`;
- `status`: `accepted_for_research`, `revision_requested`, `rejected`, or `insufficient_evidence`;
- bounded `rationale`;
- `supersedesDecisionId`;
- `reviewRecordHash` and `evidenceHash`;
- paper-only/live-blocked boundary fields.

The first decision has no predecessor. A later decision must reference the current latest decision. An outdated predecessor returns `decision_conflict`; old rows are never updated or deleted.

No decision status authorizes paper or live execution. `accepted_for_research` means only that the reviewed evidence may continue through research iteration.

## API

### Provider Status

`GET /api/ai-review/providers`

Returns local, OpenAI, OpenAI-compatible, and Ollama readiness without making a network request.

### Generate Review

`POST /api/ai-reviews`

The exact request fields are:

- `primaryExperimentId`;
- `comparisonExperimentIds`;
- `providerId`;
- `externalDataApproved`.

Provider `local` requires `externalDataApproved=false`. An external provider requires explicit approval and a complete configuration.

### Read Reviews

- `GET /api/ai-reviews/{aiReviewId}`
- `GET /api/ai-reviews?runId=&experimentId=&limit=&offset=&query=`

The existing run-scoped GET remains a compatible projection across v1 and v2 history.

### Human Decisions

- `GET /api/ai-reviews/{aiReviewId}/decisions`
- `POST /api/ai-reviews/{aiReviewId}/decisions`

The decision request contains only operator, status, rationale, and `supersedesDecisionId`.

## Processing Flow

1. Validate the exact request shape.
2. Load and validate primary/comparison evidence before any provider call.
3. Assemble and hash the canonical evidence bundle.
4. Generate the deterministic assessment.
5. If an external provider is selected, verify external-data approval and configuration.
6. If configuration is incomplete, record a failed external assessment without making an outbound request.
7. Otherwise call the selected provider once with hard connection, total-time, response-size, and output-token limits.
8. Validate the structured response and every evidence reference.
9. Build and insert the immutable v2 record.
10. Return the saved record and latest human-decision projection.

An external configuration or runtime failure does not fail the local review. The record is saved with `externalAssessment.status=failed`; only evidence and request-shape errors prevent record creation.

## Frontend

The existing AI Review workspace gains one authoritative Stage 3 panel rather than a new work area.

- The active completed Strategy Experiment is the default primary experiment.
- Up to four eligible comparison experiments are selectable.
- Ineligible experiments show a concise context or lineage reason and cannot be selected.
- Provider controls show configuration state, model, and sanitized base URL.
- External providers require a visible outbound-data confirmation.
- Results display deterministic and external assessments side by side without merging their stances.
- History displays evidence hash, experiment set, provider attempt, record hash, and legacy/authoritative status.
- The decision form requires operator, one approved state, rationale, and the latest decision predecessor.
- Decision history displays the complete append-only chain.

Loading a strategy candidate, changing research context, or losing the exact experiment binding clears the active review selection and keeps execution blocked. Stale async review/history/provider responses cannot commit into a new workspace context.

## Error Handling

Evidence failures happen before any external request:

- missing experiment: 404;
- incomplete experiment, lineage/context/hash mismatch, or consumed evidence inconsistency: 409;
- duplicate IDs, comparison overflow, unknown fields, or invalid values: 400.

An unconfigured selected provider produces a completed local review with `externalAssessment.status=failed`, error `ai_review_provider_not_configured`, and no outbound request. For a configured provider, timeout, HTTP failure, oversized response, invalid JSON, invalid schema, or unknown evidence references also produce a completed local review with failed external metadata.

Provider error details are bounded and recursively redact secret, token, API-key, private-key, password, and authorization fields. Raw provider responses are not logged.

Decision creation validates the review record/evidence hashes and the latest predecessor. Concurrent stale writes return `decision_conflict`.

## Testing

### Backend

- canonical evidence and lineage hashes;
- single and comparison assembly;
- source run, revision, snapshot, definition, result, and candidate binding;
- comparison context and limit failures;
- selected-only test evidence;
- deterministic assessment output;
- v2 record immutability and v1 compatibility;
- decision append order and concurrency conflicts.

### Provider Contracts

Tests use local fake HTTP servers; CI never calls a real provider.

- official OpenAI Responses request/structured response;
- generic Chat Completions URL and response mapping;
- native Ollama `/api/chat` schema request and usage mapping;
- missing configuration, timeout, HTTP failure, invalid JSON/schema, oversized response, and redaction;
- no cross-provider fallback and exactly one outbound request.

### Web

- provider readiness and explicit consent;
- primary/comparison selection and eligibility reasons;
- deterministic/external rendering;
- legacy labeling;
- decision creation and append-only history;
- stale async suppression, refresh restoration, translations, and narrow layout.

## Acceptance

The final gate includes:

- focused backend and Web tests;
- complete `npm test`;
- production Web build;
- Docker rebuild without deleting persistent volumes;
- full Stage 1 acceptance and current DMG;
- Stage 2 smoke and saved-manifest validation;
- new deterministic Stage 3 Docker smoke and saved-manifest validation;
- browser acceptance for single review, comparison review, refresh restoration, decision replacement chain, unconfigured-provider state, and narrow layout;
- one explicitly authorized live OpenAI-compatible smoke using the configured `.env` provider.

The live smoke sends only the approved minimal evidence summary, makes one request, performs no fallback or retry, validates the structured result and audit hashes, redacts logs, and keeps paper/live routing blocked whether it succeeds or fails.

Only after all non-optional gates pass does the stage status change from Stage 2 current to Stage 2 maintenance and Stage 3 current. A live-provider outage is recorded but does not block Stage 3 because the deterministic baseline and provider contract tests are authoritative.

## Migration and Compatibility

- Existing v1 review records and export packages remain readable and importable.
- V1 records are labeled legacy/non-authoritative and cannot satisfy the Stage 3 authoritative-review gate.
- Existing research-run export/import continues to carry v1 records and gains v2 Review Run plus Decision artifacts and manifest counts.
- Import validates record/evidence hashes, experiment references, decision predecessor chains, artifact counts, and live-blocked boundaries before writing.
- Import rollback snapshots and restores both v2 reviews and decisions with existing research-run artifacts.

## Completion Criteria

Stage 3 opening is complete when:

- backend-generated v2 reviews work in single and comparison modes;
- local deterministic review always completes for valid evidence;
- all three external provider adapters pass local contract tests;
- the configured OpenAI-compatible live smoke is auditable and safe;
- human decisions form a linear append-only chain;
- review/export/import/replay preserve all hashes and boundaries;
- Stage 1, Stage 2, Stage 3, build, Docker, browser, and desktop gates pass;
- Stage 2 is maintenance and Stage 3 is current in source and documentation.
