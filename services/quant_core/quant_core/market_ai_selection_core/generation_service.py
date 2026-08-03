from __future__ import annotations

import json
from collections.abc import Mapping, Sequence
from concurrent.futures import (
    ThreadPoolExecutor,
    TimeoutError as FutureTimeoutError,
)
from datetime import datetime
from typing import Any

from quant_core.ai_review_providers import AiReviewProviderError
from quant_core.ai_review_stage3 import assert_external_evidence_safe
from quant_core.market_information import MarketInformationQuery

from .contracts import MARKET_AI_SELECTION_OUTPUT_SCHEMA, _RECOMMENDATION_LIMIT
from .output_validation import validate_market_ai_selection_output
from .recommendations import (
    _baseline_recommendations,
    _external_evidence,
    _failed_generation,
    _normalize_news,
    _recommendation,
)

class _GenerationMixin:
    def _load_news(
            self,
            candidates: Sequence[Mapping[str, Any]],
            *,
            request: Mapping[str, Any],
            generated_at: datetime,
            deadline: float,
        ) -> tuple[dict[str, list[dict[str, Any]]], list[str]]:
            result: dict[str, list[dict[str, Any]]] = {
                "market": [],
                **{str(item["evidenceId"]): [] for item in candidates},
            }
            if self.market_information_service is None:
                return result, ["新闻服务未配置，选股按行情与基本面证据继续。"]
            warnings: list[str] = []
            if self.monotonic() >= deadline:
                return result, ["证据组装预算已用尽，新闻证据本次未加载。"]
            executor = ThreadPoolExecutor(
                max_workers=1,
                thread_name_prefix="market-ai-news",
            )
            budget_exhausted = False

            def read_with_budget(query: MarketInformationQuery) -> Mapping[str, Any]:
                remaining = deadline - self.monotonic()
                if remaining <= 0:
                    raise FutureTimeoutError()
                future = executor.submit(self.market_information_service.read, query)
                try:
                    value = future.result(timeout=remaining)
                except FutureTimeoutError:
                    future.cancel()
                    raise
                if not isinstance(value, Mapping):
                    raise ValueError("market_ai_selection_news_payload_invalid")
                return value

            try:
                payload = read_with_budget(
                    MarketInformationQuery(
                        market=str(request["market"]),
                        limit=10,
                        section="news",
                        scope="market",
                    )
                )
                result["market"] = _normalize_news(
                    payload.get("news") if isinstance(payload, Mapping) else None,
                    cutoff=generated_at,
                    prefix="market",
                )
                if isinstance(payload, Mapping):
                    warnings.extend(
                        str(item)
                        for item in payload.get("warnings", [])
                        if isinstance(item, str) and item.strip()
                    )
            except FutureTimeoutError:
                budget_exhausted = True
                warnings.append("证据组装预算已用尽，新闻证据本次未完整加载。")
            except Exception:
                warnings.append("市场级新闻暂不可用，其他证据不受影响。")
            if not budget_exhausted:
                for candidate in candidates:
                    if self.monotonic() >= deadline:
                        warnings.append("证据组装预算已用尽，部分个股新闻本次未加载。")
                        break
                    try:
                        payload = read_with_budget(
                            MarketInformationQuery(
                                market=str(request["market"]),
                                symbol=str(candidate["symbol"]),
                                name=str(candidate["name"]),
                                limit=3,
                                section="news",
                                scope="instrument",
                            )
                        )
                        result[str(candidate["evidenceId"])] = _normalize_news(
                            payload.get("news"),
                            cutoff=generated_at,
                            prefix=str(candidate["evidenceId"]),
                        )[:3]
                    except FutureTimeoutError:
                        warnings.append(
                            "证据组装预算已用尽，部分个股新闻本次未加载。"
                        )
                        break
                    except Exception:
                        warnings.append(f"{candidate['symbol']} 个股新闻暂不可用。")
            executor.shutdown(wait=False, cancel_futures=True)
            return result, list(dict.fromkeys(warnings))

    def _generate_recommendations(
            self,
            candidates: Sequence[Mapping[str, Any]],
            *,
            request: Mapping[str, Any],
            news: Mapping[str, Sequence[Mapping[str, Any]]],
            market_context: Mapping[str, Any],
            market_snapshot: Mapping[str, Any],
        ) -> tuple[list[dict[str, Any]], dict[str, Any]]:
            baseline = _baseline_recommendations(
                candidates[:_RECOMMENDATION_LIMIT],
                horizon=str(request["horizon"]),
            )
            provider_id = str(request["providerId"])
            if provider_id == "local":
                return baseline, {
                    "requestedProvider": "local",
                    "usedProvider": "local",
                    "status": "skipped",
                    "fallbackUsed": False,
                    "model": None,
                    "sanitizedBaseUrl": None,
                    "latencyMs": 0,
                    "externalDataApproved": False,
                    "outboundFields": [],
                    "errorCode": None,
                }
            provider_status = next(
                (
                    item
                    for item in self.provider_registry.statuses()
                    if item.provider_id == provider_id
                ),
                None,
            )
            provider = self.provider_registry.get(provider_id)
            if (
                provider_status is None
                or not provider_status.configured
                or provider_status.model is None
                or provider_status.sanitized_base_url is None
                or provider is None
            ):
                return baseline, _failed_generation(
                    provider_id,
                    provider_status,
                    "market_ai_selection_provider_not_configured",
                )
            outbound = _external_evidence(
                candidates,
                request=request,
                news=news,
                market_context=market_context,
                market_snapshot=market_snapshot,
            )
            try:
                assert_external_evidence_safe(outbound)
                known_evidence_ids = frozenset(
                    {
                        str(item["evidenceId"])
                        for item in candidates
                    }
                    | {
                        str(item["evidenceId"])
                        for values in news.values()
                        for item in values
                        if isinstance(item, Mapping) and item.get("evidenceId")
                    }
                    | {
                        reference
                        for item in candidates
                        for reference in item["newsReferences"]
                    }
                )
                candidate_evidence_ids = frozenset(
                    str(item["evidenceId"]) for item in candidates
                )

                def response_validator(
                    value: Mapping[str, Any],
                    known_ids: frozenset[str],
                ) -> dict[str, Any]:
                    return validate_market_ai_selection_output(
                        value,
                        known_ids,
                        candidate_evidence_ids=candidate_evidence_ids,
                    )

                attempt = provider.assess(
                    rendered_prompt=json.dumps(
                        {
                            "instruction": (
                                "仅在合格候选内重排并用中文解释研究优先级。"
                                "不得输出买卖、仓位、数量、目标价、订单或收益保证。"
                            ),
                            "untrustedInput": outbound,
                        },
                        ensure_ascii=False,
                        sort_keys=True,
                    ),
                    output_schema=MARKET_AI_SELECTION_OUTPUT_SCHEMA,
                    known_evidence_ids=known_evidence_ids,
                    response_validator=response_validator,
                )
                if (
                    attempt.provider_id != provider_id
                    or attempt.model != provider_status.model
                    or attempt.sanitized_base_url
                    != provider_status.sanitized_base_url
                ):
                    raise ValueError("provider_attempt_identity_mismatch")
                assessment = response_validator(
                    attempt.assessment,
                    known_evidence_ids,
                )
                by_id = {
                    str(item["evidenceId"]): item
                    for item in candidates
                }
                recommendations = [
                    _recommendation(
                        by_id[str(item["evidenceId"])],
                        item,
                    )
                    for item in assessment["selections"]
                ]
                return recommendations, {
                    "requestedProvider": provider_id,
                    "usedProvider": provider_id,
                    "status": "completed",
                    "fallbackUsed": False,
                    "model": attempt.model,
                    "sanitizedBaseUrl": attempt.sanitized_base_url,
                    "latencyMs": max(0, int(attempt.latency_ms)),
                    "externalDataApproved": True,
                    "outboundFields": [
                        "候选身份",
                        "市场环境",
                        "确定性分数",
                        "支柱分数",
                        "技术因子",
                        "基本面事实",
                        "新闻引用",
                        "个股新闻",
                    ],
                    "errorCode": None,
                }
            except AiReviewProviderError as error:
                return baseline, _failed_generation(
                    provider_id,
                    provider_status,
                    error.code,
                )
            except Exception:
                return baseline, _failed_generation(
                    provider_id,
                    provider_status,
                    "market_ai_selection_provider_failed",
                )
