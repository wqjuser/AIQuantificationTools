from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib
import json
import math
import os
from typing import Any, Callable

from quant_core.stage4_portfolio import validate_stage4_portfolio_workflow_snapshot
from quant_core.stage6_sandbox import validate_stage6_sandbox_batch_authorization
from quant_core.stage8_continuity import validate_production_readonly_continuity


_ALLOWED_SYMBOLS = {"BTC/USDT", "ETH/USDT"}
_CANDIDATE_TTL = timedelta(minutes=10)
PRODUCTION_ADMISSION_REVIEW_SCOPE_IDS = [
    "candidate-hash-reviewed",
    "production-envelope-reviewed",
    "market-and-funding-checks-reviewed",
    "stage8-continuity-current",
    "no-production-execution-authority",
]
_BOUNDARY = {
    "productionReadOnly": True,
    "liveTradingAllowed": False,
    "orderSubmissionEnabled": False,
    "orderRoutingEnabled": False,
    "liveOrderSubmitted": False,
    "liveRouteExecuted": False,
    "liveBlockedBoundary": True,
}


class BinanceSpotProductionAdmissionRoute:
    def __init__(
        self,
        *,
        env: dict[str, str] | None = None,
        exchange_factory: Callable[[str, dict[str, Any]], Any] | None = None,
    ) -> None:
        self.env = dict(os.environ if env is None else env)
        self.exchange_factory = exchange_factory

    def observe(self, orders: list[dict[str, Any]], *, observed_at: datetime | None = None) -> dict[str, Any]:
        now = (observed_at or datetime.now(timezone.utc)).astimezone(timezone.utc)
        _validate_orders(orders)
        api_key = self.env.get("CCXT_PRODUCTION_READONLY_API_KEY", "").strip()
        secret = self.env.get("CCXT_PRODUCTION_READONLY_SECRET", "").strip()
        if not api_key or not secret:
            raise ValueError("stage9_production_readonly_credentials_required")
        if (self.env.get("CCXT_DEFAULT_TYPE", "spot").strip().lower() or "spot") != "spot":
            raise ValueError("stage9_production_spot_required")

        common_config: dict[str, Any] = {"enableRateLimit": True, "options": {"defaultType": "spot"}}
        timeout = _positive_int(self.env.get("CCXT_TIMEOUT"))
        if timeout is not None:
            common_config["timeout"] = timeout
        proxy = (self.env.get("HTTPS_PROXY") or self.env.get("https_proxy") or "").strip()
        if proxy:
            common_config["httpsProxy"] = proxy

        factory = self._factory()
        public_exchange = factory("binance", dict(common_config))
        markets = public_exchange.load_markets()
        if not isinstance(markets, dict):
            raise ValueError("stage9_production_markets_unavailable")

        market_checks = []
        price_checks = []
        order_requirements: list[tuple[str, str, float]] = []
        blockers: list[str] = []
        for order in orders:
            order_id = order["orderId"]
            symbol = order["symbol"]
            market = markets.get(symbol)
            market_passed = _market_rule_passed(public_exchange, market, order)
            market_checks.append({"orderId": order_id, "passed": market_passed})
            if not market_passed:
                blockers.append(f"production_market_rule_blocked:{order_id}")

            ticker = public_exchange.fetch_ticker(symbol)
            reference, quoted_at = _reference_quote(ticker, order["side"])
            age_seconds = (now - quoted_at).total_seconds()
            adverse = (
                max(0.0, float(order["price"]) / reference - 1.0)
                if order["side"] == "buy"
                else max(0.0, 1.0 - float(order["price"]) / reference)
            )
            price_passed = 0 <= age_seconds <= 30 and adverse <= 0.01
            price_checks.append({
                "orderId": order_id,
                "quoteObservedAt": quoted_at.isoformat(),
                "referencePrice": reference,
                "adverseDeviationPct": round(adverse * 100, 8),
                "passed": price_passed,
            })
            if not price_passed:
                blockers.append(f"production_price_check_blocked:{order_id}")

            if not isinstance(market, dict):
                continue
            currency = str((market.get("quote") if order["side"] == "buy" else market.get("base")) or "")
            needed = float(order["notionalValue"] if order["side"] == "buy" else order["quantity"])
            if not currency:
                blockers.append(f"production_market_currency_blocked:{order_id}")
                continue
            order_requirements.append((order_id, currency, needed))

        private_exchange = factory("binance", {**common_config, "apiKey": api_key, "secret": secret})
        balance = private_exchange.fetch_balance({"type": "spot", "omitZeroBalances": False})
        free = balance.get("free") if isinstance(balance, dict) else None
        if not isinstance(free, dict):
            raise ValueError("stage9_production_balance_unavailable")
        cumulative: dict[str, float] = {}
        funding_checks = []
        for order_id, currency, needed in order_requirements:
            cumulative[currency] = cumulative.get(currency, 0.0) + needed
            available = free.get(currency)
            passed = (
                isinstance(available, (int, float))
                and not isinstance(available, bool)
                and math.isfinite(float(available))
                and float(available) + 1e-12 >= cumulative[currency]
            )
            funding_checks.append({"orderId": order_id, "passed": passed})
            if not passed:
                blockers.append(f"production_funding_check_blocked:{order_id}")

        value = {
            "kind": "aiqt.stage9ProductionAdmissionObservation",
            "schemaVersion": 1,
            "observedAt": now.isoformat(),
            "exchangeId": "binance",
            "marketChecks": market_checks,
            "priceChecks": price_checks,
            "fundingChecks": funding_checks,
            "passed": not blockers,
            "blockedReasons": list(dict.fromkeys(blockers)),
            **_BOUNDARY,
        }
        value["observationHash"] = _hash(value)
        return value

    def _factory(self) -> Callable[[str, dict[str, Any]], Any]:
        if self.exchange_factory is not None:
            return self.exchange_factory
        try:
            import ccxt  # type: ignore
        except ImportError as error:
            raise RuntimeError("stage9_ccxt_dependency_required") from error
        exchange_class = getattr(ccxt, "binance", None)
        if not callable(exchange_class):
            raise RuntimeError("stage9_binance_exchange_unavailable")
        return lambda _exchange_id, config: exchange_class(config)


def canonical_production_order_admission_continuity(value: dict[str, Any]) -> dict[str, Any]:
    continuity = validate_production_readonly_continuity(value)
    if continuity["status"] != "current" or not isinstance(continuity["latestProbe"], dict):
        raise ValueError("stage9_production_admission_current_continuity_required")
    source_times = [_utc(continuity["latestProbe"]["generatedAt"])]
    if isinstance(continuity["accessControl"], dict):
        source_times.append(_utc(continuity["accessControl"]["recordedAt"]))
    snapshot = json.loads(json.dumps(continuity))
    snapshot["generatedAt"] = max(source_times).isoformat()
    snapshot["continuityHash"] = _hash({
        key: item for key, item in snapshot.items() if key != "continuityHash"
    })
    return validate_production_readonly_continuity(snapshot)


def validate_production_order_admission_preconditions(
    workflow: dict[str, Any],
    authorization: dict[str, Any],
    sandbox_batch: dict[str, Any],
    continuity: dict[str, Any],
) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any], dict[str, Any]]:
    workflow = validate_stage4_portfolio_workflow_snapshot(workflow)
    authorization = validate_stage6_sandbox_batch_authorization(authorization)
    continuity = validate_production_readonly_continuity(continuity)
    if (
        authorization["baseRunId"] != workflow["baseRunId"]
        or authorization["workflowId"] != workflow["workflowId"]
        or authorization["workflowHash"] != workflow["workflowHash"]
        or authorization["batchId"] != workflow["batch"]["batchId"]
    ):
        raise ValueError("stage9_production_admission_authority_mismatch")
    if (
        not isinstance(sandbox_batch, dict)
        or sandbox_batch.get("authorizationId") != authorization["authorizationId"]
        or sandbox_batch.get("baseRunId") != authorization["baseRunId"]
        or sandbox_batch.get("batchId") != authorization["batchId"]
        or sandbox_batch.get("status") != "reconciled"
        or not isinstance(sandbox_batch.get("orders"), list)
    ):
        raise ValueError("stage9_production_admission_sandbox_batch_invalid")
    order_fields = {
        "orderId", "clientOrderId", "symbol", "side", "type", "timeInForce",
        "quantity", "price", "notionalValue",
    }
    batch_orders = sandbox_batch["orders"]
    if (
        [
            {field: row.get(field) for field in order_fields}
            for row in batch_orders if isinstance(row, dict)
        ] != authorization["orders"]
        or any(row.get("state") not in {"filled", "canceled"} for row in batch_orders)
    ):
        raise ValueError("stage9_production_admission_sandbox_terminal_evidence_required")
    if continuity["status"] != "current" or not isinstance(continuity["latestProbe"], dict):
        raise ValueError("stage9_production_admission_current_continuity_required")
    _validate_orders(authorization["orders"])
    return workflow, authorization, sandbox_batch, continuity


def build_production_order_admission_candidate(
    workflow: dict[str, Any],
    authorization: dict[str, Any],
    sandbox_batch: dict[str, Any],
    continuity: dict[str, Any],
    observation: dict[str, Any],
    *,
    operator: str,
    generated_at: str | None = None,
) -> dict[str, Any]:
    workflow, authorization, _sandbox_batch, continuity = validate_production_order_admission_preconditions(
        workflow, authorization, sandbox_batch, continuity
    )
    continuity = canonical_production_order_admission_continuity(continuity)
    observation = validate_production_admission_observation(observation)
    operator = operator.strip() if isinstance(operator, str) else ""
    if not operator:
        raise ValueError("stage9_production_admission_operator_required")
    if not observation["passed"]:
        raise ValueError("stage9_production_admission_observation_blocked")

    orders = json.loads(json.dumps(authorization["orders"]))
    order_ids = [row["orderId"] for row in orders]
    if any(
        [row["orderId"] for row in observation[field]] != order_ids
        for field in ("marketChecks", "priceChecks", "fundingChecks")
    ):
        raise ValueError("stage9_production_admission_observation_orders_mismatch")
    generated = _utc(generated_at or datetime.now(timezone.utc).isoformat())
    observed = _utc(observation["observedAt"])
    if not observed <= generated <= observed + timedelta(seconds=30):
        raise ValueError("stage9_production_admission_time_invalid")
    orders_hash = _hash(orders)
    if orders_hash != authorization["ordersHash"]:
        raise ValueError("stage9_production_admission_orders_hash_mismatch")
    candidate_key = _hash({
        "workflowHash": workflow["workflowHash"],
        "authorizationHash": authorization["authorizationHash"],
        "continuityHash": continuity["continuityHash"],
        "ordersHash": orders_hash,
    })
    candidate_id = "stage9-production-admission-" + hashlib.sha256(
        f"{candidate_key}:{observation['observationHash']}".encode()
    ).hexdigest()[:24]
    value = {
        "kind": "aiqt.stage9ProductionOrderAdmissionCandidate",
        "schemaVersion": 1,
        "candidateId": candidate_id,
        "candidateKey": candidate_key,
        "generatedAt": generated.isoformat(),
        "expiresAt": (generated + _CANDIDATE_TTL).isoformat(),
        "baseRunId": workflow["baseRunId"],
        "workflowId": workflow["workflowId"],
        "workflowHash": workflow["workflowHash"],
        "batchId": authorization["batchId"],
        "sandboxAuthorizationId": authorization["authorizationId"],
        "sandboxAuthorizationHash": authorization["authorizationHash"],
        "sandboxBatchStatus": "reconciled",
        "stage8Continuity": json.loads(json.dumps(continuity)),
        "stage8ContinuityHash": continuity["continuityHash"],
        "productionRouteReviewId": continuity["latestProbe"]["productionRouteReviewId"],
        "orders": orders,
        "ordersHash": orders_hash,
        "observation": observation,
        "operator": operator,
        "status": "ready_for_review",
        **_BOUNDARY,
    }
    value["candidateHash"] = _hash(value)
    return validate_production_order_admission_candidate(value)


def validate_production_order_admission_candidate(value: Any) -> dict[str, Any]:
    fields = {
        "kind", "schemaVersion", "candidateId", "candidateKey", "candidateHash", "generatedAt", "expiresAt",
        "baseRunId", "workflowId", "workflowHash", "batchId", "sandboxAuthorizationId",
        "sandboxAuthorizationHash", "sandboxBatchStatus", "stage8Continuity", "stage8ContinuityHash",
        "productionRouteReviewId",
        "orders", "ordersHash", "observation", "operator", "status", *_BOUNDARY,
    }
    if not isinstance(value, dict) or set(value) != fields:
        raise ValueError("stage9_production_admission_candidate_fields_invalid")
    if (
        value["kind"] != "aiqt.stage9ProductionOrderAdmissionCandidate"
        or value["schemaVersion"] != 1
        or value["status"] != "ready_for_review"
        or value["sandboxBatchStatus"] != "reconciled"
    ):
        raise ValueError("stage9_production_admission_candidate_schema_invalid")
    for field in (
        "candidateId", "baseRunId", "workflowId", "batchId", "sandboxAuthorizationId",
        "productionRouteReviewId", "operator",
    ):
        if not isinstance(value[field], str) or not value[field].strip():
            raise ValueError("stage9_production_admission_candidate_identity_invalid")
    for field in (
        "candidateKey", "candidateHash", "workflowHash", "sandboxAuthorizationHash",
        "stage8ContinuityHash", "ordersHash",
    ):
        if not _is_hash(value[field]):
            raise ValueError("stage9_production_admission_candidate_hash_invalid")
    generated, expires = _utc(value["generatedAt"]), _utc(value["expiresAt"])
    if expires - generated != _CANDIDATE_TTL:
        raise ValueError("stage9_production_admission_candidate_expiry_invalid")
    _validate_boundary(value, "stage9_production_admission_candidate_boundary_invalid")
    _validate_orders(value["orders"])
    if value["ordersHash"] != _hash(value["orders"]):
        raise ValueError("stage9_production_admission_candidate_orders_hash_invalid")
    observation = validate_production_admission_observation(value["observation"])
    observed = _utc(observation["observedAt"])
    if not observed <= generated <= observed + timedelta(seconds=30):
        raise ValueError("stage9_production_admission_candidate_time_invalid")
    continuity = validate_production_readonly_continuity(value["stage8Continuity"])
    if (
        canonical_production_order_admission_continuity(continuity) != continuity
        or continuity["status"] != "current"
        or continuity["continuityHash"] != value["stage8ContinuityHash"]
        or continuity["latestProbe"]["productionRouteReviewId"] != value["productionRouteReviewId"]
        or _utc(continuity["generatedAt"]) > observed
        or _utc(continuity["expiresAt"]) < generated
    ):
        raise ValueError("stage9_production_admission_candidate_continuity_invalid")
    order_ids = [row["orderId"] for row in value["orders"]]
    if not observation["passed"] or any(
        [row["orderId"] for row in observation[field]] != order_ids
        for field in ("marketChecks", "priceChecks", "fundingChecks")
    ):
        raise ValueError("stage9_production_admission_candidate_observation_invalid")
    expected_key = _hash({
        "workflowHash": value["workflowHash"],
        "authorizationHash": value["sandboxAuthorizationHash"],
        "continuityHash": value["stage8ContinuityHash"],
        "ordersHash": value["ordersHash"],
    })
    expected_id = "stage9-production-admission-" + hashlib.sha256(
        f"{expected_key}:{observation['observationHash']}".encode()
    ).hexdigest()[:24]
    if value["candidateKey"] != expected_key or value["candidateId"] != expected_id:
        raise ValueError("stage9_production_admission_candidate_identity_invalid")
    if value["candidateHash"] != _hash({key: item for key, item in value.items() if key != "candidateHash"}):
        raise ValueError("stage9_production_admission_candidate_hash_invalid")
    return json.loads(json.dumps(value))


def production_order_admission_candidate_to_audit_event(value: dict[str, Any]) -> dict[str, Any]:
    candidate = validate_production_order_admission_candidate(value)
    return {
        "schemaVersion": 1,
        "eventId": candidate["candidateId"],
        "eventType": "stage9_production_order_admission_candidate",
        "runId": candidate["baseRunId"],
        "createdAt": candidate["generatedAt"],
        "stage": "stage9-production-order-admission",
        "source": candidate["operator"],
        "summary": f"Prepared Stage 9 production admission candidate {candidate['batchId']}.",
        "detail": "Production read-only evidence prepared; production orders remain disabled.",
        "metadata": {"snapshot": candidate},
    }


def production_order_admission_candidate_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "stage9_production_order_admission_candidate":
        return None
    metadata = getattr(event, "metadata", None)
    try:
        return validate_production_order_admission_candidate(
            metadata.get("snapshot") if isinstance(metadata, dict) else None
        )
    except ValueError:
        return None


def build_production_order_admission_review(
    candidate: dict[str, Any],
    continuity: dict[str, Any],
    observation: dict[str, Any],
    *,
    reviewer: str,
    outcome: str,
    reason: str,
    confirmations: dict[str, Any],
    reviewed_at: str | None = None,
) -> dict[str, Any]:
    candidate = validate_production_order_admission_candidate(candidate)
    continuity = canonical_production_order_admission_continuity(continuity)
    observation = validate_production_admission_observation(observation)
    reviewer = reviewer.strip() if isinstance(reviewer, str) else ""
    reason = reason.strip() if isinstance(reason, str) else ""
    if not reviewer or not reason or outcome not in {"approved", "rejected"}:
        raise ValueError("stage9_production_admission_review_decision_invalid")
    if not isinstance(confirmations, dict) or set(confirmations) != set(PRODUCTION_ADMISSION_REVIEW_SCOPE_IDS):
        raise ValueError("stage9_production_admission_review_confirmations_invalid")
    if any(confirmations[item] is not True for item in PRODUCTION_ADMISSION_REVIEW_SCOPE_IDS):
        raise ValueError("stage9_production_admission_review_confirmations_incomplete")
    if continuity["status"] != "current" or continuity["continuityHash"] != candidate["stage8ContinuityHash"]:
        raise ValueError("stage9_production_admission_review_continuity_drift")
    if not observation["passed"]:
        raise ValueError("stage9_production_admission_review_observation_blocked")
    order_ids = [row["orderId"] for row in candidate["orders"]]
    if any(
        [row["orderId"] for row in observation[field]] != order_ids
        for field in ("marketChecks", "priceChecks", "fundingChecks")
    ):
        raise ValueError("stage9_production_admission_review_orders_mismatch")
    reviewed = _utc(reviewed_at or datetime.now(timezone.utc).isoformat())
    observed = _utc(observation["observedAt"])
    if not _utc(candidate["generatedAt"]) <= observed <= reviewed <= _utc(candidate["expiresAt"]):
        raise ValueError("stage9_production_admission_review_candidate_expired")
    if reviewed - observed > timedelta(seconds=30):
        raise ValueError("stage9_production_admission_review_observation_stale")
    review_id = "stage9-production-admission-review-" + hashlib.sha256(
        candidate["candidateHash"].encode()
    ).hexdigest()[:24]
    value = {
        "kind": "aiqt.stage9ProductionOrderAdmissionReview",
        "schemaVersion": 1,
        "reviewId": review_id,
        "reviewedAt": reviewed.isoformat(),
        "baseRunId": candidate["baseRunId"],
        "candidateId": candidate["candidateId"],
        "candidateHash": candidate["candidateHash"],
        "sandboxAuthorizationId": candidate["sandboxAuthorizationId"],
        "stage8ContinuityHash": continuity["continuityHash"],
        "reviewObservation": observation,
        "reviewer": reviewer,
        "outcome": outcome,
        "reason": reason,
        "confirmedScopeIds": list(PRODUCTION_ADMISSION_REVIEW_SCOPE_IDS),
        "status": "admission_review_recorded",
        "authorizationEffective": False,
        **_BOUNDARY,
    }
    value["reviewHash"] = _hash(value)
    return validate_production_order_admission_review(value)


def validate_production_order_admission_review(value: Any) -> dict[str, Any]:
    fields = {
        "kind", "schemaVersion", "reviewId", "reviewHash", "reviewedAt", "baseRunId",
        "candidateId", "candidateHash", "sandboxAuthorizationId", "stage8ContinuityHash",
        "reviewObservation", "reviewer", "outcome", "reason", "confirmedScopeIds", "status",
        "authorizationEffective", *_BOUNDARY,
    }
    if not isinstance(value, dict) or set(value) != fields:
        raise ValueError("stage9_production_admission_review_fields_invalid")
    if (
        value["kind"] != "aiqt.stage9ProductionOrderAdmissionReview"
        or value["schemaVersion"] != 1
        or value["status"] != "admission_review_recorded"
        or value["outcome"] not in {"approved", "rejected"}
        or value["authorizationEffective"] is not False
        or value["confirmedScopeIds"] != PRODUCTION_ADMISSION_REVIEW_SCOPE_IDS
    ):
        raise ValueError("stage9_production_admission_review_schema_invalid")
    for field in ("reviewId", "baseRunId", "candidateId", "sandboxAuthorizationId", "reviewer", "reason"):
        if not isinstance(value[field], str) or not value[field].strip():
            raise ValueError("stage9_production_admission_review_identity_invalid")
    for field in ("reviewHash", "candidateHash", "stage8ContinuityHash"):
        if not _is_hash(value[field]):
            raise ValueError("stage9_production_admission_review_hash_invalid")
    reviewed = _utc(value["reviewedAt"])
    _validate_boundary(value, "stage9_production_admission_review_boundary_invalid")
    observation = validate_production_admission_observation(value["reviewObservation"])
    if not observation["passed"]:
        raise ValueError("stage9_production_admission_review_observation_invalid")
    observed = _utc(observation["observedAt"])
    if not observed <= reviewed <= observed + timedelta(seconds=30):
        raise ValueError("stage9_production_admission_review_time_invalid")
    expected_id = "stage9-production-admission-review-" + hashlib.sha256(
        value["candidateHash"].encode()
    ).hexdigest()[:24]
    if value["reviewId"] != expected_id:
        raise ValueError("stage9_production_admission_review_identity_invalid")
    if value["reviewHash"] != _hash({key: item for key, item in value.items() if key != "reviewHash"}):
        raise ValueError("stage9_production_admission_review_hash_invalid")
    return json.loads(json.dumps(value))


def production_order_admission_review_to_audit_event(value: dict[str, Any]) -> dict[str, Any]:
    review = validate_production_order_admission_review(value)
    return {
        "schemaVersion": 1,
        "eventId": review["reviewId"],
        "eventType": "stage9_production_order_admission_review",
        "runId": review["baseRunId"],
        "createdAt": review["reviewedAt"],
        "stage": "stage9-production-order-admission-review",
        "source": review["reviewer"],
        "summary": f"Recorded Stage 9 production admission review for {review['candidateId']}.",
        "detail": "Human admission review only; production order authorization remains ineffective.",
        "metadata": {"snapshot": review},
    }


def production_order_admission_review_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "stage9_production_order_admission_review":
        return None
    metadata = getattr(event, "metadata", None)
    try:
        return validate_production_order_admission_review(
            metadata.get("snapshot") if isinstance(metadata, dict) else None
        )
    except ValueError:
        return None


def validate_production_admission_observation(value: Any) -> dict[str, Any]:
    fields = {
        "kind", "schemaVersion", "observedAt", "exchangeId", "marketChecks", "priceChecks",
        "fundingChecks", "passed", "blockedReasons", "observationHash", *_BOUNDARY,
    }
    if not isinstance(value, dict) or set(value) != fields:
        raise ValueError("stage9_production_admission_observation_fields_invalid")
    if value["kind"] != "aiqt.stage9ProductionAdmissionObservation" or value["schemaVersion"] != 1 or value["exchangeId"] != "binance":
        raise ValueError("stage9_production_admission_observation_schema_invalid")
    observed_at = _utc(value["observedAt"])
    _validate_boundary(value, "stage9_production_admission_observation_boundary_invalid")
    simple_fields = ("marketChecks", "fundingChecks")
    for field in simple_fields:
        if not isinstance(value[field], list) or not value[field] or any(
            not isinstance(row, dict) or set(row) != {"orderId", "passed"}
            or not isinstance(row["orderId"], str) or not row["orderId"] or type(row["passed"]) is not bool
            for row in value[field]
        ):
            raise ValueError("stage9_production_admission_observation_checks_invalid")
    if not isinstance(value["priceChecks"], list) or not value["priceChecks"] or any(
        not isinstance(row, dict)
        or set(row) != {"orderId", "quoteObservedAt", "referencePrice", "adverseDeviationPct", "passed"}
        or not isinstance(row["orderId"], str) or not row["orderId"]
        or type(row["passed"]) is not bool
        or _positive(row["referencePrice"]) <= 0
        or not isinstance(row["adverseDeviationPct"], (int, float))
        or isinstance(row["adverseDeviationPct"], bool)
        or not math.isfinite(float(row["adverseDeviationPct"]))
        or row["adverseDeviationPct"] < 0
        or not 0 <= (observed_at - _utc(row["quoteObservedAt"])).total_seconds() <= 30
        or (row["passed"] and row["adverseDeviationPct"] > 1)
        for row in value["priceChecks"]
    ):
        raise ValueError("stage9_production_admission_observation_price_checks_invalid")
    if type(value["passed"]) is not bool or not isinstance(value["blockedReasons"], list) or any(
        not isinstance(reason, str) or not reason for reason in value["blockedReasons"]
    ):
        raise ValueError("stage9_production_admission_observation_status_invalid")
    checks_passed = all(
        row["passed"] for field in ("marketChecks", "priceChecks", "fundingChecks") for row in value[field]
    )
    if value["passed"] != (checks_passed and not value["blockedReasons"]):
        raise ValueError("stage9_production_admission_observation_status_invalid")
    if not _is_hash(value["observationHash"]) or value["observationHash"] != _hash(
        {key: item for key, item in value.items() if key != "observationHash"}
    ):
        raise ValueError("stage9_production_admission_observation_hash_invalid")
    return json.loads(json.dumps(value))


def _validate_orders(orders: Any) -> None:
    fields = {
        "orderId", "clientOrderId", "symbol", "side", "type", "timeInForce",
        "quantity", "price", "notionalValue",
    }
    if not isinstance(orders, list) or not 1 <= len(orders) <= 2:
        raise ValueError("stage9_production_order_count_blocked")
    if len({order.get("orderId") for order in orders if isinstance(order, dict)}) != len(orders):
        raise ValueError("stage9_production_order_identity_blocked")
    gross = 0.0
    for order in orders:
        if not isinstance(order, dict) or set(order) != fields:
            raise ValueError("stage9_production_order_fields_blocked")
        if (
            not all(isinstance(order[field], str) and order[field] for field in ("orderId", "clientOrderId"))
            or order["symbol"] not in _ALLOWED_SYMBOLS
            or order["side"] not in {"buy", "sell"}
            or order["type"] != "limit"
            or order["timeInForce"] != "GTC"
        ):
            raise ValueError("stage9_production_order_scope_blocked")
        quantity = _positive(order["quantity"])
        price = _positive(order["price"])
        notional = _positive(order["notionalValue"])
        if not math.isclose(quantity * price, notional, rel_tol=1e-9) or notional > 10:
            raise ValueError("stage9_production_order_notional_blocked")
        gross += notional
    if gross > 20:
        raise ValueError("stage9_production_batch_notional_blocked")


def _market_rule_passed(exchange: Any, market: Any, order: dict[str, Any]) -> bool:
    if not isinstance(market, dict) or market.get("active") is False:
        return False
    try:
        quantity = float(order["quantity"])
        price = float(order["price"])
        cost = float(order["notionalValue"])
        if not math.isclose(float(exchange.amount_to_precision(order["symbol"], quantity)), quantity, rel_tol=1e-12):
            return False
        if not math.isclose(float(exchange.price_to_precision(order["symbol"], price)), price, rel_tol=1e-12):
            return False
        limits = market.get("limits") if isinstance(market.get("limits"), dict) else {}
        return all(
            _within(value, limits.get(name))
            for name, value in (("amount", quantity), ("price", price), ("cost", cost))
        )
    except (TypeError, ValueError):
        return False


def _within(value: float, limit: Any) -> bool:
    if not isinstance(limit, dict):
        return False
    minimum, maximum = limit.get("min"), limit.get("max")
    if (
        isinstance(minimum, bool)
        or not isinstance(minimum, (int, float))
        or not math.isfinite(float(minimum))
        or float(minimum) <= 0
    ):
        return False
    if maximum is not None and (
        isinstance(maximum, bool)
        or not isinstance(maximum, (int, float))
        or not math.isfinite(float(maximum))
        or float(maximum) < float(minimum)
    ):
        return False
    return value >= float(minimum) and (maximum is None or value <= float(maximum))


def _reference_quote(value: Any, side: str) -> tuple[float, datetime]:
    if not isinstance(value, dict):
        raise ValueError("stage9_production_quote_unavailable")
    reference = _positive(value.get("ask") if side == "buy" else value.get("bid"))
    timestamp = value.get("timestamp")
    if not isinstance(timestamp, (int, float)) or isinstance(timestamp, bool):
        raise ValueError("stage9_production_quote_time_unavailable")
    return reference, datetime.fromtimestamp(float(timestamp) / 1000, tz=timezone.utc)


def _positive(value: Any) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(float(value)) or value <= 0:
        raise ValueError("stage9_production_positive_number_required")
    return float(value)


def _positive_int(value: str | None) -> int | None:
    try:
        parsed = int(value) if value is not None else 0
    except ValueError:
        return None
    return parsed if parsed > 0 else None


def _utc(value: Any) -> datetime:
    try:
        parsed = datetime.fromisoformat(value)
    except (TypeError, ValueError) as error:
        raise ValueError("stage9_production_admission_time_invalid") from error
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError("stage9_production_admission_time_invalid")
    return parsed.astimezone(timezone.utc)


def _validate_boundary(value: dict[str, Any], error: str) -> None:
    if any(value.get(field) is not expected for field, expected in _BOUNDARY.items()):
        raise ValueError(error)


def _is_hash(value: Any) -> bool:
    return isinstance(value, str) and len(value) == 64 and all(character in "0123456789abcdef" for character in value)


def _hash(value: Any) -> str:
    return hashlib.sha256(
        json.dumps(value, allow_nan=False, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()
