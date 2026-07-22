from __future__ import annotations

import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone

from quant_core.ai_review_providers import (
    AiReviewProviderError,
    AiReviewProviderRegistry,
    ProviderAttempt,
    ProviderStatus,
)
from quant_core.cache import MarketDataCache
from quant_core.domain import OHLCVBar
from quant_core.research_note_drafts import (
    RESEARCH_NOTE_EVIDENCE_ID,
    ResearchNoteDraftError,
    generate_research_note_draft,
    iter_generate_research_note_draft_stream_events,
    iter_research_note_draft_stream_events,
)


class _StubProvider:
    endpoint = "https://example.test/v1/chat/completions"

    def __init__(
        self,
        error: Exception | None = None,
        assessment: dict | None = None,
    ) -> None:
        self.calls = 0
        self.error = error
        self.rendered_prompt = ""
        self.assessment = assessment or {
            "stance": "caution",
            "summary": "价格处于区间整理阶段，当前假设需要后续量价证据验证。",
            "risks": [
                {
                    "severity": "medium",
                    "message": "样本只包含历史量价摘要，缺少基本面和事件信息。",
                    "evidenceReferences": [RESEARCH_NOTE_EVIDENCE_ID],
                }
            ],
            "invalidationConditions": ["后续价格结构与当前区间假设明显背离。"],
            "watchItems": ["关注波动和成交量是否同步变化。"],
            "evidenceGaps": ["尚未绑定公告、财务和行业对照证据。"],
            "consistency": "insufficient",
        }

    def assess(self, *, rendered_prompt, output_schema, known_evidence_ids):
        self.calls += 1
        self.rendered_prompt = rendered_prompt
        if self.error is not None:
            raise self.error
        return ProviderAttempt(
            provider_id="openai-compatible",
            model="note-model",
            sanitized_base_url="https://example.test/v1",
            assessment=self.assessment,
            usage={"inputTokens": 20, "outputTokens": 30, "totalTokens": 50},
            latency_ms=8,
        )


class _StreamingStubProvider(_StubProvider):
    def __init__(
        self,
        assessment: dict | None = None,
        *,
        chunk_size: int = 1,
    ) -> None:
        super().__init__(assessment=assessment)
        self.finished = False
        self.output_schema = None
        self.chunk_size = chunk_size

    def stream_assessment(
        self,
        *,
        rendered_prompt,
        output_schema,
        known_evidence_ids,
        cancelled=None,
        reasoning_effort=None,
    ):
        self.calls += 1
        self.rendered_prompt = rendered_prompt
        self.output_schema = output_schema
        self.reasoning_effort = reasoning_effort
        body = json.dumps(
            self.assessment,
            ensure_ascii=False,
            separators=(",", ":"),
        )
        for start in range(0, len(body), self.chunk_size):
            yield body[start : start + self.chunk_size]
        self.finished = True
        return ProviderAttempt(
            provider_id="openai-compatible",
            model="note-model",
            sanitized_base_url="https://example.test/v1",
            assessment=self.assessment,
            usage={"inputTokens": 20, "outputTokens": 30, "totalTokens": 50},
            latency_ms=8,
        )


class ResearchNoteDraftTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)
        self.cache = MarketDataCache(f"{self.temp_dir.name}/market.sqlite")
        started_at = datetime(2026, 5, 1, tzinfo=timezone.utc)
        self.cache.upsert_bars(
            [
                OHLCVBar(
                    symbol="600000",
                    market="ashare",
                    timeframe="1d",
                    timestamp=started_at + timedelta(days=index),
                    open=10 + index * 0.1,
                    high=10.3 + index * 0.1,
                    low=9.8 + index * 0.1,
                    close=10.1 + index * 0.1,
                    volume=1_000 + index * 25,
                )
                for index in range(30)
            ]
        )

    def _registry(self, provider=None) -> AiReviewProviderRegistry:
        statuses = (
            ProviderStatus("local", True, None, None),
            ProviderStatus(
                "openai-compatible",
                provider is not None,
                "note-model" if provider is not None else None,
                "https://example.test/v1" if provider is not None else None,
            ),
        )
        return AiReviewProviderRegistry(
            statuses,
            {"openai-compatible": provider} if provider is not None else {},
        )

    def _request(self, provider_id="local", approved=False):
        return {
            "market": "ashare",
            "symbol": "600000",
            "timeframe": "1d",
            "providerId": provider_id,
            "externalDataApproved": approved,
        }

    def test_local_generation_is_deterministic_and_never_calls_a_provider(self) -> None:
        first = generate_research_note_draft(
            cache=self.cache,
            provider_registry=self._registry(),
            payload=self._request(),
        )
        second = generate_research_note_draft(
            cache=self.cache,
            provider_registry=self._registry(),
            payload=self._request(),
        )

        self.assertEqual(first["draft"]["body"], second["draft"]["body"])
        self.assertIn("AI 草稿，需人工复核", first["draft"]["body"])
        self.assertIn("研究假设", first["draft"]["body"])
        self.assertIn("失效条件", first["draft"]["body"])
        self.assertEqual(first["generation"]["status"], "skipped")
        self.assertEqual(first["generation"]["usedProvider"], "local")
        self.assertFalse(first["boundary"]["saved"])

    def test_external_generation_uses_only_a_derived_market_summary(self) -> None:
        provider = _StubProvider()
        result = generate_research_note_draft(
            cache=self.cache,
            provider_registry=self._registry(provider),
            payload=self._request("openai-compatible", True),
        )

        self.assertEqual(provider.calls, 1)
        self.assertNotIn('"ohlcv"', provider.rendered_prompt.casefold())
        self.assertNotIn('"bars"', provider.rendered_prompt.casefold())
        self.assertNotIn('"note"', provider.rendered_prompt.casefold())
        self.assertNotIn("研究笔记", provider.rendered_prompt)
        self.assertIn("价格处于区间整理阶段", result["draft"]["body"])
        self.assertEqual(result["generation"]["status"], "completed")
        self.assertEqual(result["generation"]["usedProvider"], "openai-compatible")
        self.assertFalse(result["generation"]["fallbackUsed"])

    def test_external_generation_rejects_an_english_only_assessment(self) -> None:
        provider = _StubProvider(
            assessment={
                "stance": "caution",
                "summary": "Price is moving sideways and needs more evidence.",
                "risks": [
                    {
                        "severity": "medium",
                        "message": "Only derived price and volume evidence is available.",
                        "evidenceReferences": [RESEARCH_NOTE_EVIDENCE_ID],
                    }
                ],
                "invalidationConditions": ["The observed range structure changes."],
                "watchItems": ["Watch price and volume together."],
                "evidenceGaps": ["Fundamental and event evidence is missing."],
                "consistency": "insufficient",
            }
        )

        result = generate_research_note_draft(
            cache=self.cache,
            provider_registry=self._registry(provider),
            payload=self._request("openai-compatible", True),
        )

        self.assertEqual(provider.calls, 1)
        self.assertEqual(result["generation"]["status"], "failed")
        self.assertEqual(result["generation"]["usedProvider"], "local")
        self.assertTrue(result["generation"]["fallbackUsed"])
        self.assertIn("研究假设", result["draft"]["body"])

    def test_provider_failure_returns_the_exact_local_baseline(self) -> None:
        baseline = generate_research_note_draft(
            cache=self.cache,
            provider_registry=self._registry(),
            payload=self._request(),
        )
        provider = _StubProvider(
            AiReviewProviderError("timeout", "provider_request_timed_out")
        )

        result = generate_research_note_draft(
            cache=self.cache,
            provider_registry=self._registry(provider),
            payload=self._request("openai-compatible", True),
        )

        self.assertEqual(provider.calls, 1)
        self.assertEqual(result["draft"]["body"], baseline["draft"]["body"])
        self.assertEqual(result["generation"]["status"], "failed")
        self.assertEqual(result["generation"]["usedProvider"], "local")
        self.assertTrue(result["generation"]["fallbackUsed"])
        self.assertIn("本地结构化草稿", result["generation"]["warning"])

    def test_stream_events_only_chunk_the_validated_draft(self) -> None:
        result = generate_research_note_draft(
            cache=self.cache,
            provider_registry=self._registry(),
            payload=self._request(),
        )

        events = list(
            iter_research_note_draft_stream_events(result, chunk_size=17)
        )

        self.assertEqual(events[0], {"type": "ready", "payload": result})
        self.assertEqual(events[-1], {"type": "complete"})
        self.assertGreater(len(events), 3)
        self.assertEqual(
            "".join(
                event["text"]
                for event in events
                if event["type"] == "delta"
            ),
            result["draft"]["body"],
        )

    def test_stream_events_bound_long_validated_drafts(self) -> None:
        result = generate_research_note_draft(
            cache=self.cache,
            provider_registry=self._registry(),
            payload=self._request(),
        )
        result["draft"]["body"] = "研究" * 40_000

        events = list(iter_research_note_draft_stream_events(result))
        deltas = [event["text"] for event in events if event["type"] == "delta"]

        self.assertLessEqual(len(deltas), 256)
        self.assertEqual("".join(deltas), result["draft"]["body"])

    def test_external_stream_emits_multiple_incremental_drafts_before_provider_completion(
        self,
    ) -> None:
        provider = _StreamingStubProvider()
        events = iter_generate_research_note_draft_stream_events(
            cache=self.cache,
            provider_registry=self._registry(provider),
            payload=self._request("openai-compatible", True),
        )

        first = next(events)

        self.assertEqual(first["type"], "draft")
        self.assertIn("## 研究对象", first["body"])
        self.assertNotIn("## 已知观察", first["body"])
        self.assertFalse(provider.finished)

        remaining = list(events)
        drafts = [first, *[event for event in remaining if event["type"] == "draft"]]
        ready = next(event for event in remaining if event["type"] == "ready")
        self.assertTrue(provider.finished)
        self.assertEqual(provider.reasoning_effort, "none")
        self.assertEqual(
            list(provider.output_schema["properties"]),
            [
                "stance",
                "summary",
                "watchItems",
                "invalidationConditions",
                "risks",
                "evidenceGaps",
                "consistency",
            ],
        )
        self.assertGreater(
            len(drafts),
            10,
            "provider token deltas must reach the editor progressively instead of in five section jumps",
        )
        self.assertTrue(
            all(
                current["body"].startswith(previous["body"])
                and len(current["body"]) > len(previous["body"])
                for previous, current in zip(drafts, drafts[1:])
            )
        )
        self.assertEqual(drafts[-1]["body"], ready["payload"]["draft"]["body"])
        self.assertEqual(remaining[-1], {"type": "complete"})

    def test_external_stream_resets_a_valid_prefix_before_local_fallback(
        self,
    ) -> None:
        assessment = dict(_StubProvider().assessment)
        assessment["risks"] = [
            {
                "severity": "high",
                "message": "建议买入该标的。",
                "evidenceReferences": [RESEARCH_NOTE_EVIDENCE_ID],
            }
        ]
        provider = _StreamingStubProvider(assessment)

        events = list(
            iter_generate_research_note_draft_stream_events(
                cache=self.cache,
                provider_registry=self._registry(provider),
                payload=self._request("openai-compatible", True),
            )
        )

        self.assertEqual(events[0]["type"], "draft")
        reset_index = events.index({"type": "reset"})
        self.assertNotIn(
            "建议买入",
            "\n".join(
                event["body"]
                for event in events[:reset_index]
                if event["type"] == "draft"
            ),
        )
        ready = next(
            event for event in events[reset_index + 1 :] if event["type"] == "ready"
        )
        self.assertTrue(ready["payload"]["generation"]["fallbackUsed"])
        fallback_body = "".join(
            event["text"]
            for event in events[reset_index + 1 :]
            if event["type"] == "delta"
        )
        self.assertEqual(fallback_body, ready["payload"]["draft"]["body"])
        self.assertNotIn("建议买入", fallback_body)

    def test_external_stream_buffers_an_ambiguous_prefix_until_it_is_safe(
        self,
    ) -> None:
        assessment = dict(_StubProvider().assessment)
        assessment["summary"] = "买入信号尚未出现，继续观察量价结构。"

        events = list(
            iter_generate_research_note_draft_stream_events(
                cache=self.cache,
                provider_registry=self._registry(
                    _StreamingStubProvider(assessment)
                ),
                payload=self._request("openai-compatible", True),
            )
        )

        self.assertNotIn({"type": "reset"}, events)
        ready = next(event for event in events if event["type"] == "ready")
        self.assertFalse(ready["payload"]["generation"]["fallbackUsed"])
        self.assertIn(
            "买入信号尚未出现",
            ready["payload"]["draft"]["body"],
        )

    def test_external_stream_resets_an_oversized_assessment_before_local_fallback(
        self,
    ) -> None:
        class OversizedProvider(_StreamingStubProvider):
            def stream_assessment(
                self,
                *,
                rendered_prompt,
                output_schema,
                known_evidence_ids,
                cancelled=None,
                reasoning_effort=None,
            ):
                yield (
                    '{"stance":"caution","summary":'
                    '"价格处于区间整理阶段，需要继续观察。",'
                )
                yield " " * 65_536

        events = list(
            iter_generate_research_note_draft_stream_events(
                cache=self.cache,
                provider_registry=self._registry(OversizedProvider()),
                payload=self._request("openai-compatible", True),
            )
        )

        self.assertEqual(events[0]["type"], "draft")
        reset_index = events.index({"type": "reset"})
        ready = next(
            event for event in events[reset_index + 1 :] if event["type"] == "ready"
        )
        self.assertTrue(ready["payload"]["generation"]["fallbackUsed"])
        self.assertNotIn(
            "价格处于区间整理阶段，需要继续观察。",
            ready["payload"]["draft"]["body"],
        )

    def test_external_stream_accepts_empty_completed_sections(self) -> None:
        assessment = dict(_StubProvider().assessment)
        assessment.update(
            {
                "watchItems": [],
                "invalidationConditions": [],
                "evidenceGaps": [],
            }
        )

        events = list(
            iter_generate_research_note_draft_stream_events(
                cache=self.cache,
                provider_registry=self._registry(
                    _StreamingStubProvider(assessment)
                ),
                payload=self._request("openai-compatible", True),
            )
        )

        self.assertNotIn({"type": "reset"}, events)
        ready = next(event for event in events if event["type"] == "ready")
        drafts = [event for event in events if event["type"] == "draft"]
        self.assertEqual(drafts[-1]["body"], ready["payload"]["draft"]["body"])
        self.assertIn("- 暂无，需人工补充。", drafts[-1]["body"])

    def test_external_stream_stays_within_the_client_wire_budget(self) -> None:
        long_text = "量价结构仍需持续观察。" * 160
        assessment = dict(_StubProvider().assessment)
        assessment.update(
            {
                "summary": long_text,
                "watchItems": [long_text] * 7,
                "invalidationConditions": [long_text] * 7,
                "evidenceGaps": [long_text] * 7,
            }
        )

        events = list(
            iter_generate_research_note_draft_stream_events(
                cache=self.cache,
                provider_registry=self._registry(
                    _StreamingStubProvider(assessment, chunk_size=64)
                ),
                payload=self._request("openai-compatible", True),
            )
        )

        wire_bytes = len('{"type": "started"}\n'.encode("utf-8")) + sum(
            len(
                (
                    json.dumps(event, ensure_ascii=False)
                    + "\n"
                ).encode("utf-8")
            )
            for event in events
        )
        self.assertLess(wire_bytes, 1_000_000)
        ready = next(event for event in events if event["type"] == "ready")
        self.assertEqual(events[-1], {"type": "complete"})
        self.assertFalse(ready["payload"]["generation"]["fallbackUsed"])

    def test_external_provider_requires_explicit_approval(self) -> None:
        with self.assertRaisesRegex(
            ResearchNoteDraftError,
            "research_note_draft_provider_approval_invalid",
        ):
            generate_research_note_draft(
                cache=self.cache,
                provider_registry=self._registry(_StubProvider()),
                payload=self._request("openai-compatible", False),
            )

    def test_generation_requires_cached_market_data(self) -> None:
        with self.assertRaisesRegex(
            ResearchNoteDraftError,
            "research_note_draft_data_required",
        ):
            generate_research_note_draft(
                cache=self.cache,
                provider_registry=self._registry(),
                payload={
                    **self._request(),
                    "symbol": "000001",
                },
            )


if __name__ == "__main__":
    unittest.main()
