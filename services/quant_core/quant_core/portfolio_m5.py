from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any, Callable

from quant_core.ai_review_runs import contains_secret_like_archive_text
from quant_core.audit_events import AuditEventRecord, AuditEventStore
from quant_core.canonical import canonical_sha256
from quant_core.stage4_portfolio import validate_stage4_portfolio_workflow_snapshot


_SAFETY = {
    "paperOnly": True,
    "liveTradingAllowed": False,
    "orderSubmissionEnabled": False,
    "routeExecuted": False,
    "liveBlockedBoundary": True,
}
_REQUEST_KEYS = {"workflowId", "operator", "classifications", "observations", "limits"}
_LIMIT_KEYS = {
    "maxDrawdownPct",
    "maxDailyLossPct",
    "maxTradesPerDay",
    "maxTotalExposureWeight",
    "maxSymbolWeight",
    "maxIndustryWeight",
    "maxMarketWeight",
    "maxCurrencyWeight",
    "maxCorrelation",
    "maxRiskContributionPct",
}
_ASSESSMENT_KEYS = {
    "kind",
    "schemaVersion",
    "assessmentId",
    "createdAt",
    "baseRunId",
    "workflowId",
    "workflowHash",
    "operator",
    "classifications",
    "observations",
    "limits",
    "account",
    "allocations",
    "cash",
    "exposures",
    "correlations",
    "riskContributions",
    "checks",
    "batch",
    "summary",
    *_SAFETY,
    "recordHash",
}
_CHECK_STATUSES = {"passed", "reduced", "blocked"}


class PortfolioM5Service:
    def __init__(
        self,
        *,
        audit_store: AuditEventStore,
        now: Callable[[], datetime] | None = None,
    ) -> None:
        self.audit_store = audit_store
        self.now = now or (lambda: datetime.now(timezone.utc))

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        request = validate_portfolio_risk_assessment_request(payload)
        source_event = self.audit_store.get(request["workflowId"])
        if source_event is None or source_event.event_type != "stage4_portfolio_workflow":
            raise LookupError("portfolio_m5_workflow_not_found")
        workflow = _workflow_from_event(source_event)
        identity_hash = canonical_sha256(
            {
                "workflowHash": workflow["workflowHash"],
                "request": request,
            }
        )
        assessment_id = f"portfolio-risk-{identity_hash[:32]}"
        existing = self.audit_store.get(assessment_id)
        if existing is not None:
            return _assessment_from_event(existing)

        assessment = build_portfolio_risk_assessment(
            workflow,
            request,
            assessment_id=assessment_id,
            created_at=_utc(self.now()),
        )
        stored, _ = self.audit_store.record_if_absent(
            {
                "schemaVersion": 1,
                "eventId": assessment_id,
                "eventType": "portfolio_risk_assessment",
                "runId": assessment["baseRunId"],
                "createdAt": assessment["createdAt"],
                "stage": "m5-portfolio-risk",
                "source": request["operator"],
                "summary": (
                    f"Recorded M5 portfolio risk assessment for "
                    f"{assessment['baseRunId']}."
                ),
                "detail": (
                    f"batch={assessment['batch']['status']} "
                    f"checks={len(assessment['checks'])} "
                    f"unmatched={len(assessment['account']['unmatchedSymbols'])} "
                    "liveBlocked=true"
                ),
                "metadata": {"assessment": assessment},
            }
        )
        return _assessment_from_event(stored)

    def list_recent(self, base_run_id: str, limit: int = 20) -> list[dict[str, Any]]:
        base_run_id = _text(base_run_id, 200, "portfolio_m5_base_run_id_invalid")
        if type(limit) is not int or not 1 <= limit <= 100:
            raise ValueError("portfolio_m5_limit_invalid")
        return [
            _assessment_from_event(event)
            for event in self.audit_store.list_recent(
                run_id=base_run_id,
                event_type="portfolio_risk_assessment",
                limit=limit,
            )
        ]


def validate_portfolio_risk_assessment_request(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != _REQUEST_KEYS:
        raise ValueError("portfolio_m5_request_fields_invalid")
    workflow_id = _text(value.get("workflowId"), 200, "portfolio_m5_workflow_id_invalid")
    operator = _text(value.get("operator"), 100, "portfolio_m5_operator_invalid")

    raw_classifications = value.get("classifications")
    if (
        not isinstance(raw_classifications, list)
        or len(raw_classifications) < 2
        or not all(isinstance(row, dict) for row in raw_classifications)
    ):
        raise ValueError("portfolio_m5_classifications_invalid")
    classifications = []
    for row in raw_classifications:
        if set(row) != {"symbol", "industry", "currency"}:
            raise ValueError("portfolio_m5_classification_fields_invalid")
        classifications.append(
            {
                "symbol": _text(row.get("symbol"), 64, "portfolio_m5_symbol_invalid"),
                "industry": _text(row.get("industry"), 100, "portfolio_m5_industry_invalid"),
                "currency": _text(row.get("currency"), 20, "portfolio_m5_currency_invalid").upper(),
            }
        )
    if len({row["symbol"] for row in classifications}) != len(classifications):
        raise ValueError("portfolio_m5_classification_symbols_duplicate")

    observations = value.get("observations")
    if not isinstance(observations, dict) or set(observations) != {"dailyLossPct", "tradesToday"}:
        raise ValueError("portfolio_m5_observations_invalid")
    normalized_observations = {
        "dailyLossPct": _bounded_number(
            observations.get("dailyLossPct"),
            minimum=0,
            maximum=100,
            code="portfolio_m5_daily_loss_invalid",
        ),
        "tradesToday": _bounded_integer(
            observations.get("tradesToday"),
            minimum=0,
            maximum=1_000_000,
            code="portfolio_m5_trades_today_invalid",
        ),
    }

    raw_limits = value.get("limits")
    if not isinstance(raw_limits, dict) or set(raw_limits) != _LIMIT_KEYS:
        raise ValueError("portfolio_m5_limits_invalid")
    limits = {
        "maxDrawdownPct": _positive_number(raw_limits.get("maxDrawdownPct"), 100, "portfolio_m5_limit_invalid"),
        "maxDailyLossPct": _positive_number(raw_limits.get("maxDailyLossPct"), 100, "portfolio_m5_limit_invalid"),
        "maxTradesPerDay": _bounded_integer(
            raw_limits.get("maxTradesPerDay"),
            minimum=1,
            maximum=1_000_000,
            code="portfolio_m5_limit_invalid",
        ),
        "maxTotalExposureWeight": _weight(raw_limits.get("maxTotalExposureWeight")),
        "maxSymbolWeight": _weight(raw_limits.get("maxSymbolWeight")),
        "maxIndustryWeight": _weight(raw_limits.get("maxIndustryWeight")),
        "maxMarketWeight": _weight(raw_limits.get("maxMarketWeight")),
        "maxCurrencyWeight": _weight(raw_limits.get("maxCurrencyWeight")),
        "maxCorrelation": _bounded_number(
            raw_limits.get("maxCorrelation"),
            minimum=0,
            maximum=1,
            code="portfolio_m5_limit_invalid",
        ),
        "maxRiskContributionPct": _positive_number(
            raw_limits.get("maxRiskContributionPct"),
            100,
            "portfolio_m5_limit_invalid",
        ),
    }
    return {
        "workflowId": workflow_id,
        "operator": operator,
        "classifications": classifications,
        "observations": normalized_observations,
        "limits": limits,
    }


def build_portfolio_risk_assessment(
    workflow: dict[str, Any],
    request: dict[str, Any],
    *,
    assessment_id: str,
    created_at: datetime,
) -> dict[str, Any]:
    workflow = validate_stage4_portfolio_workflow_snapshot(workflow)
    request = validate_portfolio_risk_assessment_request(request)
    if request["workflowId"] != workflow["workflowId"]:
        raise ValueError("portfolio_m5_workflow_binding_invalid")
    assessment_id = _text(assessment_id, 200, "portfolio_m5_assessment_id_invalid")
    created_at = _utc(created_at)

    legs = workflow["portfolioRequest"]["legs"]
    target_symbols = [leg["symbol"] for leg in legs]
    classifications = {row["symbol"]: row for row in request["classifications"]}
    if set(classifications) != set(target_symbols):
        raise ValueError("portfolio_m5_classifications_do_not_match_portfolio")

    replay = workflow["replay"]
    account = replay["account"]
    equity = _finite(account.get("equity"), "portfolio_m5_account_equity_invalid")
    cash_value = _finite(account.get("cash"), "portfolio_m5_account_cash_invalid")
    if equity <= 0:
        raise ValueError("portfolio_m5_account_equity_invalid")
    positions: dict[str, dict[str, Any]] = {}
    for position in replay["positions"]:
        symbol = _text(position.get("symbol"), 64, "portfolio_m5_account_position_invalid")
        if symbol in positions:
            raise ValueError("portfolio_m5_account_positions_duplicate")
        positions[symbol] = position
    unmatched_symbols = sorted(
        symbol
        for symbol, position in positions.items()
        if symbol not in target_symbols
        and (
            abs(_finite(position.get("quantity"), "portfolio_m5_account_position_invalid")) > 1e-12
            or abs(_finite(position.get("marketValue"), "portfolio_m5_account_position_invalid")) > 0.005
        )
    )

    requested = {leg["symbol"]: float(leg["targetWeight"]) for leg in legs}
    adjusted, reduction_reasons = _adjust_targets(
        requested,
        legs=legs,
        classifications=classifications,
        limits=request["limits"],
    )
    blocked_checks, checks = _risk_checks(
        workflow=workflow,
        request=request,
        requested=requested,
        adjusted=adjusted,
        classifications=classifications,
        unmatched_symbols=unmatched_symbols,
        equity=equity,
        cash_value=cash_value,
        positions=positions,
    )
    batch_status = (
        "blocked"
        if blocked_checks
        else "reduced"
        if any(adjusted[symbol] < requested[symbol] - 1e-12 for symbol in target_symbols)
        else "ready"
    )

    allocations = []
    orders = []
    for leg in legs:
        symbol = leg["symbol"]
        position = positions.get(symbol, {})
        current_value = _finite(position.get("marketValue", 0), "portfolio_m5_account_position_invalid")
        current_quantity = _finite(position.get("quantity", 0), "portfolio_m5_account_position_invalid")
        current_weight = current_value / equity
        target_weight = requested[symbol]
        adjusted_weight = adjusted[symbol]
        delta_value = equity * adjusted_weight - current_value
        side = "buy" if delta_value > 0.005 else "sell" if delta_value < -0.005 else "hold"
        order_status = "blocked" if batch_status == "blocked" and side != "hold" else "candidate" if side != "hold" else "no_action"
        reason_parts = reduction_reasons[symbol]
        reason = (
            "组合级风险检查已阻断整个候选批次。"
            if order_status == "blocked"
            else "；".join(reason_parts)
            if reason_parts
            else "按当前账户与风险调整目标生成纸面调仓候选。"
            if order_status == "candidate"
            else "当前市值已达到风险调整后的目标，无需调仓。"
        )
        row = {
            "symbol": symbol,
            "sourceRunId": leg["runId"],
            "market": leg["market"],
            "industry": classifications[symbol]["industry"],
            "currency": classifications[symbol]["currency"],
            "currentQuantity": _round(current_quantity, 8),
            "currentValue": _round(current_value, 4),
            "currentWeight": _round(current_weight, 10),
            "targetWeight": _round(target_weight, 10),
            "adjustedTargetWeight": _round(adjusted_weight, 10),
            "driftPct": _round((current_weight - target_weight) * 100, 4),
            "proposedDeltaValue": _round(delta_value, 4),
            "side": side,
            "status": order_status,
            "reason": reason,
        }
        allocations.append(row)
        orders.append(
            {
                "symbol": symbol,
                "sourceRunId": leg["runId"],
                "side": side,
                "notionalValue": _round(abs(delta_value), 4),
                "status": order_status,
                "reason": reason,
            }
        )

    requested_exposure = math.fsum(requested.values())
    adjusted_exposure = math.fsum(adjusted.values())
    current_exposure = math.fsum(
        _finite(position.get("marketValue"), "portfolio_m5_account_position_invalid")
        for position in positions.values()
    ) / equity
    cash = {
        "currentValue": _round(cash_value, 4),
        "currentWeight": _round(cash_value / equity, 10),
        "targetWeight": _round(1 - requested_exposure, 10),
        "adjustedTargetWeight": _round(1 - adjusted_exposure, 10),
        "proposedDeltaValue": _round(equity * (1 - adjusted_exposure) - cash_value, 4),
    }
    exposures = _exposure_rows(
        legs=legs,
        classifications=classifications,
        positions=positions,
        equity=equity,
        requested=requested,
        adjusted=adjusted,
        limits=request["limits"],
    )
    correlations = _correlation_rows(workflow, request["limits"]["maxCorrelation"])
    risk_contributions = _risk_contribution_rows(
        workflow,
        request["limits"]["maxRiskContributionPct"],
    )
    summary = {
        "currentExposureWeight": _round(current_exposure, 10),
        "targetExposureWeight": _round(requested_exposure, 10),
        "adjustedTargetExposureWeight": _round(adjusted_exposure, 10),
        "currentWeightSum": _round(current_exposure + cash_value / equity, 10),
        "targetWeightSum": _round(requested_exposure + cash["targetWeight"], 10),
        "adjustedTargetWeightSum": _round(adjusted_exposure + cash["adjustedTargetWeight"], 10),
        "proposedTradeCount": sum(order["side"] != "hold" for order in orders),
        "reducedTargetCount": sum(
            adjusted[symbol] < requested[symbol] - 1e-12 for symbol in target_symbols
        ),
        "unmatchedHoldingCount": len(unmatched_symbols),
        "blockedCheckCount": sum(check["status"] == "blocked" for check in checks),
    }
    assessment: dict[str, Any] = {
        "kind": "aiqt.portfolioRiskAssessment",
        "schemaVersion": 1,
        "assessmentId": assessment_id,
        "createdAt": created_at.isoformat(),
        "baseRunId": workflow["baseRunId"],
        "workflowId": workflow["workflowId"],
        "workflowHash": workflow["workflowHash"],
        "operator": request["operator"],
        "classifications": request["classifications"],
        "observations": request["observations"],
        "limits": request["limits"],
        "account": {
            "source": "stage4_paper_replay",
            "observedAt": replay["generatedAt"],
            "equity": _round(equity, 4),
            "cash": _round(cash_value, 4),
            "unmatchedSymbols": unmatched_symbols,
        },
        "allocations": allocations,
        "cash": cash,
        "exposures": exposures,
        "correlations": correlations,
        "riskContributions": risk_contributions,
        "checks": checks,
        "batch": {
            "status": batch_status,
            "orders": orders,
            "blockedReasons": [check["reason"] for check in checks if check["status"] == "blocked"],
        },
        "summary": summary,
        **_SAFETY,
    }
    assessment["recordHash"] = canonical_sha256(assessment)
    return validate_portfolio_risk_assessment(assessment)


def validate_portfolio_risk_assessment(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != _ASSESSMENT_KEYS:
        raise ValueError("portfolio_m5_assessment_fields_invalid")
    if value.get("kind") != "aiqt.portfolioRiskAssessment" or value.get("schemaVersion") != 1:
        raise ValueError("portfolio_m5_assessment_schema_invalid")
    for field in ("assessmentId", "baseRunId", "workflowId", "operator"):
        _text(value.get(field), 200, "portfolio_m5_assessment_text_invalid")
    _timestamp(value.get("createdAt"), "portfolio_m5_assessment_timestamp_invalid")
    _hash(value.get("workflowHash"), "portfolio_m5_workflow_hash_invalid")
    for field, expected in _SAFETY.items():
        if value.get(field) is not expected:
            raise ValueError("portfolio_m5_safety_boundary_invalid")
    request = validate_portfolio_risk_assessment_request(
        {
            "workflowId": value["workflowId"],
            "operator": value["operator"],
            "classifications": value.get("classifications"),
            "observations": value.get("observations"),
            "limits": value.get("limits"),
        }
    )
    if request["classifications"] != value["classifications"]:
        raise ValueError("portfolio_m5_classifications_not_normalized")

    account = _exact_object(
        value.get("account"),
        {"source", "observedAt", "equity", "cash", "unmatchedSymbols"},
        "portfolio_m5_account_invalid",
    )
    if account.get("source") != "stage4_paper_replay":
        raise ValueError("portfolio_m5_account_source_invalid")
    _timestamp(account.get("observedAt"), "portfolio_m5_account_timestamp_invalid")
    if _finite(account.get("equity"), "portfolio_m5_account_invalid") <= 0:
        raise ValueError("portfolio_m5_account_invalid")
    _finite(account.get("cash"), "portfolio_m5_account_invalid")
    if not isinstance(account.get("unmatchedSymbols"), list) or not all(
        isinstance(symbol, str) and symbol for symbol in account["unmatchedSymbols"]
    ):
        raise ValueError("portfolio_m5_account_invalid")

    allocations = value.get("allocations")
    if not isinstance(allocations, list) or len(allocations) < 2:
        raise ValueError("portfolio_m5_allocations_invalid")
    symbols = []
    for row in allocations:
        row = _exact_object(
            row,
            {
                "symbol",
                "sourceRunId",
                "market",
                "industry",
                "currency",
                "currentQuantity",
                "currentValue",
                "currentWeight",
                "targetWeight",
                "adjustedTargetWeight",
                "driftPct",
                "proposedDeltaValue",
                "side",
                "status",
                "reason",
            },
            "portfolio_m5_allocation_invalid",
        )
        symbols.append(_text(row.get("symbol"), 64, "portfolio_m5_allocation_invalid"))
        for field in (
            "currentQuantity",
            "currentValue",
            "currentWeight",
            "targetWeight",
            "adjustedTargetWeight",
            "driftPct",
            "proposedDeltaValue",
        ):
            _finite(row.get(field), "portfolio_m5_allocation_invalid")
        if row["adjustedTargetWeight"] < -1e-12 or row["adjustedTargetWeight"] > row["targetWeight"] + 1e-12:
            raise ValueError("portfolio_m5_risk_increased_exposure")
        if row.get("side") not in {"buy", "sell", "hold"} or row.get("status") not in {
            "candidate",
            "blocked",
            "no_action",
        }:
            raise ValueError("portfolio_m5_allocation_invalid")
    if len(set(symbols)) != len(symbols):
        raise ValueError("portfolio_m5_allocations_invalid")

    cash = _numeric_object(
        value.get("cash"),
        {
            "currentValue",
            "currentWeight",
            "targetWeight",
            "adjustedTargetWeight",
            "proposedDeltaValue",
        },
        "portfolio_m5_cash_invalid",
    )
    if cash["adjustedTargetWeight"] < -1e-12:
        raise ValueError("portfolio_m5_cash_invalid")
    _validate_exposures(value.get("exposures"))
    _validate_correlations(value.get("correlations"))
    _validate_risk_contributions(value.get("riskContributions"))
    checks = _validate_checks(value.get("checks"))

    batch = _exact_object(
        value.get("batch"),
        {"status", "orders", "blockedReasons"},
        "portfolio_m5_batch_invalid",
    )
    if batch.get("status") not in {"ready", "reduced", "blocked"}:
        raise ValueError("portfolio_m5_batch_invalid")
    if not isinstance(batch.get("blockedReasons"), list) or not all(
        isinstance(reason, str) for reason in batch["blockedReasons"]
    ):
        raise ValueError("portfolio_m5_batch_invalid")
    orders = batch.get("orders")
    if not isinstance(orders, list) or len(orders) != len(allocations):
        raise ValueError("portfolio_m5_batch_invalid")
    for order, allocation in zip(orders, allocations, strict=True):
        order = _exact_object(
            order,
            {"symbol", "sourceRunId", "side", "notionalValue", "status", "reason"},
            "portfolio_m5_batch_invalid",
        )
        if (
            order.get("symbol") != allocation["symbol"]
            or order.get("sourceRunId") != allocation["sourceRunId"]
            or order.get("side") != allocation["side"]
            or order.get("status") != allocation["status"]
            or _finite(order.get("notionalValue"), "portfolio_m5_batch_invalid") < 0
        ):
            raise ValueError("portfolio_m5_batch_invalid")
    if batch["status"] == "blocked" and not any(check["status"] == "blocked" for check in checks):
        raise ValueError("portfolio_m5_batch_invalid")

    summary = _numeric_object(
        value.get("summary"),
        {
            "currentExposureWeight",
            "targetExposureWeight",
            "adjustedTargetExposureWeight",
            "currentWeightSum",
            "targetWeightSum",
            "adjustedTargetWeightSum",
            "proposedTradeCount",
            "reducedTargetCount",
            "unmatchedHoldingCount",
            "blockedCheckCount",
        },
        "portfolio_m5_summary_invalid",
    )
    if abs(summary["targetWeightSum"] - 1) > 1e-8 or abs(summary["adjustedTargetWeightSum"] - 1) > 1e-8:
        raise ValueError("portfolio_m5_weight_sum_invalid")
    if summary["adjustedTargetExposureWeight"] > summary["targetExposureWeight"] + 1e-12:
        raise ValueError("portfolio_m5_risk_increased_exposure")

    record_hash = value.get("recordHash")
    _hash(record_hash, "portfolio_m5_record_hash_invalid")
    expected = canonical_sha256({key: item for key, item in value.items() if key != "recordHash"})
    if record_hash != expected:
        raise ValueError("portfolio_m5_record_hash_mismatch")
    return value


def _adjust_targets(
    requested: dict[str, float],
    *,
    legs: list[dict[str, Any]],
    classifications: dict[str, dict[str, str]],
    limits: dict[str, float],
) -> tuple[dict[str, float], dict[str, list[str]]]:
    adjusted = dict(requested)
    reasons = {symbol: [] for symbol in requested}
    for symbol, weight in requested.items():
        if weight > limits["maxSymbolWeight"]:
            adjusted[symbol] = limits["maxSymbolWeight"]
            reasons[symbol].append("单一标的集中度已下调至组合限额")

    dimensions = (
        ("industry", "maxIndustryWeight", "行业集中度"),
        ("market", "maxMarketWeight", "市场集中度"),
        ("currency", "maxCurrencyWeight", "币种集中度"),
    )
    leg_by_symbol = {leg["symbol"]: leg for leg in legs}
    for dimension, limit_field, label in dimensions:
        groups: dict[str, list[str]] = {}
        for symbol in requested:
            group = (
                str(leg_by_symbol[symbol]["market"])
                if dimension == "market"
                else classifications[symbol][dimension]
            )
            groups.setdefault(group, []).append(symbol)
        for symbols in groups.values():
            total = math.fsum(adjusted[symbol] for symbol in symbols)
            limit = limits[limit_field]
            if total > limit + 1e-12:
                scale = limit / total
                for symbol in symbols:
                    adjusted[symbol] *= scale
                    reasons[symbol].append(f"{label}已按比例下调至组合限额")

    total = math.fsum(adjusted.values())
    limit = limits["maxTotalExposureWeight"]
    if total > limit + 1e-12:
        scale = limit / total
        for symbol in adjusted:
            adjusted[symbol] *= scale
            reasons[symbol].append("组合总暴露已按比例下调至组合限额")
    return adjusted, reasons


def _risk_checks(
    *,
    workflow: dict[str, Any],
    request: dict[str, Any],
    requested: dict[str, float],
    adjusted: dict[str, float],
    classifications: dict[str, dict[str, str]],
    unmatched_symbols: list[str],
    equity: float,
    cash_value: float,
    positions: dict[str, dict[str, Any]],
) -> tuple[bool, list[dict[str, Any]]]:
    limits = request["limits"]
    observations = request["observations"]
    requested_total = math.fsum(requested.values())
    adjusted_total = math.fsum(adjusted.values())
    current_exposure = math.fsum(
        _finite(position.get("marketValue"), "portfolio_m5_account_position_invalid")
        for position in positions.values()
    ) / equity
    drawdown = abs(
        _finite(workflow["portfolio"]["metrics"].get("maxDrawdownPct"), "portfolio_m5_drawdown_invalid")
    )
    max_correlation = max(
        (
            max(0.0, _finite(pair.get("correlation"), "portfolio_m5_correlation_invalid"))
            for pair in workflow["portfolio"].get("correlationPairs", [])
        ),
        default=0.0,
    )
    max_risk_contribution = max(
        (
            max(0.0, _finite(row.get("contributionPct"), "portfolio_m5_risk_contribution_invalid"))
            for row in workflow["portfolio"].get("covarianceRisk", {}).get("contributions", [])
        ),
        default=0.0,
    )
    current_weights = {
        symbol: (
            _finite(positions.get(symbol, {}).get("marketValue", 0), "portfolio_m5_account_position_invalid")
            / equity
        )
        for symbol in requested
    }
    symbol_peak = max(
        max(requested.values(), default=0.0),
        max(current_weights.values(), default=0.0),
    )
    dimension_peaks = {
        dimension: max(
            max(
                _group_weights(
                    workflow["portfolioRequest"]["legs"],
                    classifications,
                    requested,
                    dimension,
                ).values(),
                default=0.0,
            ),
            max(
                _group_weights(
                    workflow["portfolioRequest"]["legs"],
                    classifications,
                    current_weights,
                    dimension,
                ).values(),
                default=0.0,
            ),
        )
        for dimension in ("industry", "market", "currency")
    }
    checks = [
        _check(
            "account_reconciliation",
            "account",
            "blocked" if unmatched_symbols else "passed",
            len(unmatched_symbols),
            0,
            "count",
            "账户存在不属于本地目标组合的持仓，候选批次已阻断。"
            if unmatched_symbols
            else "账户持仓与本地目标组合已逐项匹配。",
        ),
        _check(
            "cash_preservation",
            "portfolio",
            "blocked" if cash_value < -0.005 else "reduced" if adjusted_total < requested_total - 1e-12 else "passed",
            1 - adjusted_total,
            1 - limits["maxTotalExposureWeight"],
            "weight",
            "风险调整后现金权重不低于总暴露限额要求。",
        ),
        _limit_check(
            "max_drawdown",
            drawdown,
            limits["maxDrawdownPct"],
            "pct",
            "组合历史最大回撤",
        ),
        _limit_check(
            "daily_loss",
            observations["dailyLossPct"],
            limits["maxDailyLossPct"],
            "pct",
            "账户当日损失",
        ),
        _limit_check(
            "trade_rate",
            observations["tradesToday"],
            limits["maxTradesPerDay"],
            "count",
            "账户当日交易次数",
        ),
        _reduction_check(
            "total_exposure",
            max(current_exposure, requested_total),
            limits["maxTotalExposureWeight"],
            "weight",
            "组合总暴露",
            max(current_exposure, requested_total) > limits["maxTotalExposureWeight"] + 1e-12,
        ),
        _reduction_check(
            "symbol_concentration",
            symbol_peak,
            limits["maxSymbolWeight"],
            "weight",
            "单一标的集中度",
            symbol_peak > limits["maxSymbolWeight"] + 1e-12,
        ),
        _reduction_check(
            "industry_concentration",
            dimension_peaks["industry"],
            limits["maxIndustryWeight"],
            "weight",
            "行业集中度",
            dimension_peaks["industry"] > limits["maxIndustryWeight"] + 1e-12,
        ),
        _reduction_check(
            "market_concentration",
            dimension_peaks["market"],
            limits["maxMarketWeight"],
            "weight",
            "市场集中度",
            dimension_peaks["market"] > limits["maxMarketWeight"] + 1e-12,
        ),
        _reduction_check(
            "currency_concentration",
            dimension_peaks["currency"],
            limits["maxCurrencyWeight"],
            "weight",
            "币种集中度",
            dimension_peaks["currency"] > limits["maxCurrencyWeight"] + 1e-12,
        ),
        _limit_check(
            "correlation_concentration",
            max_correlation,
            limits["maxCorrelation"],
            "correlation",
            "标的最大正相关性",
        ),
        _limit_check(
            "risk_contribution",
            max_risk_contribution,
            limits["maxRiskContributionPct"],
            "pct",
            "单一标的最大风险贡献",
        ),
    ]
    return any(check["status"] == "blocked" for check in checks), checks


def _exposure_rows(
    *,
    legs: list[dict[str, Any]],
    classifications: dict[str, dict[str, str]],
    positions: dict[str, dict[str, Any]],
    equity: float,
    requested: dict[str, float],
    adjusted: dict[str, float],
    limits: dict[str, float],
) -> list[dict[str, Any]]:
    rows = []
    for dimension, limit_field in (
        ("industry", "maxIndustryWeight"),
        ("market", "maxMarketWeight"),
        ("currency", "maxCurrencyWeight"),
    ):
        requested_groups = _group_weights(legs, classifications, requested, dimension)
        adjusted_groups = _group_weights(legs, classifications, adjusted, dimension)
        current_groups: dict[str, float] = {}
        leg_by_symbol = {leg["symbol"]: leg for leg in legs}
        for symbol, position in positions.items():
            if symbol not in classifications:
                continue
            group = (
                str(leg_by_symbol[symbol]["market"])
                if dimension == "market"
                else classifications[symbol][dimension]
            )
            current_groups[group] = current_groups.get(group, 0.0) + _finite(
                position.get("marketValue"),
                "portfolio_m5_account_position_invalid",
            ) / equity
        for group in sorted(requested_groups):
            requested_weight = requested_groups[group]
            adjusted_weight = adjusted_groups[group]
            limit = limits[limit_field]
            rows.append(
                {
                    "dimension": dimension,
                    "group": group,
                    "currentWeight": _round(current_groups.get(group, 0.0), 10),
                    "targetWeight": _round(requested_weight, 10),
                    "adjustedTargetWeight": _round(adjusted_weight, 10),
                    "limit": limit,
                    "status": "reduced" if adjusted_weight < requested_weight - 1e-12 else "passed",
                }
            )
    return rows


def _correlation_rows(workflow: dict[str, Any], limit: float) -> list[dict[str, Any]]:
    return [
        {
            "leftSymbol": pair["leftSymbol"],
            "rightSymbol": pair["rightSymbol"],
            "correlation": pair["correlation"],
            "limit": limit,
            "status": "blocked" if pair["correlation"] > limit else "passed",
        }
        for pair in workflow["portfolio"].get("correlationPairs", [])
    ]


def _risk_contribution_rows(workflow: dict[str, Any], limit: float) -> list[dict[str, Any]]:
    return [
        {
            "symbol": row["symbol"],
            "sourceRunId": row.get("sourceRunId"),
            "contributionPct": row["contributionPct"],
            "limitPct": limit,
            "status": "blocked" if row["contributionPct"] > limit else "passed",
        }
        for row in workflow["portfolio"].get("covarianceRisk", {}).get("contributions", [])
    ]


def _group_weights(
    legs: list[dict[str, Any]],
    classifications: dict[str, dict[str, str]],
    weights: dict[str, float],
    dimension: str,
) -> dict[str, float]:
    groups: dict[str, float] = {}
    for leg in legs:
        symbol = leg["symbol"]
        group = str(leg["market"]) if dimension == "market" else classifications[symbol][dimension]
        groups[group] = groups.get(group, 0.0) + weights[symbol]
    return groups


def _limit_check(
    check_id: str,
    value: float,
    limit: float,
    unit: str,
    label: str,
) -> dict[str, Any]:
    blocked = value > limit + 1e-12
    return _check(
        check_id,
        "portfolio",
        "blocked" if blocked else "passed",
        value,
        limit,
        unit,
        f"{label}{'超过' if blocked else '未超过'}组合限额。",
    )


def _reduction_check(
    check_id: str,
    value: float,
    limit: float,
    unit: str,
    label: str,
    reduced: bool,
) -> dict[str, Any]:
    return _check(
        check_id,
        "portfolio",
        "reduced" if reduced else "passed",
        value,
        limit,
        unit,
        f"{label}{'已下调至' if reduced else '未超过'}组合限额。",
    )


def _check(
    check_id: str,
    scope: str,
    status: str,
    value: float,
    limit: float,
    unit: str,
    reason: str,
) -> dict[str, Any]:
    return {
        "checkId": check_id,
        "scope": scope,
        "status": status,
        "value": _round(float(value), 10),
        "limit": _round(float(limit), 10),
        "unit": unit,
        "reason": reason,
    }


def _workflow_from_event(event: AuditEventRecord) -> dict[str, Any]:
    workflow = validate_stage4_portfolio_workflow_snapshot(event.metadata.get("snapshot"))
    if (
        event.event_id != workflow["workflowId"]
        or event.run_id != workflow["baseRunId"]
        or event.created_at != datetime.fromisoformat(workflow["generatedAt"])
    ):
        raise ValueError("portfolio_m5_workflow_audit_binding_invalid")
    return workflow


def _assessment_from_event(event: AuditEventRecord) -> dict[str, Any]:
    if event.event_type != "portfolio_risk_assessment":
        raise ValueError("portfolio_m5_audit_event_type_invalid")
    assessment = validate_portfolio_risk_assessment(event.metadata.get("assessment"))
    if (
        event.event_id != assessment["assessmentId"]
        or event.run_id != assessment["baseRunId"]
        or event.created_at != datetime.fromisoformat(assessment["createdAt"])
    ):
        raise ValueError("portfolio_m5_audit_binding_invalid")
    return assessment


def _validate_exposures(value: Any) -> None:
    if not isinstance(value, list):
        raise ValueError("portfolio_m5_exposures_invalid")
    for row in value:
        row = _exact_object(
            row,
            {
                "dimension",
                "group",
                "currentWeight",
                "targetWeight",
                "adjustedTargetWeight",
                "limit",
                "status",
            },
            "portfolio_m5_exposures_invalid",
        )
        if row.get("dimension") not in {"industry", "market", "currency"} or row.get("status") not in {
            "passed",
            "reduced",
        }:
            raise ValueError("portfolio_m5_exposures_invalid")
        _text(row.get("group"), 100, "portfolio_m5_exposures_invalid")
        for field in ("currentWeight", "targetWeight", "adjustedTargetWeight", "limit"):
            _finite(row.get(field), "portfolio_m5_exposures_invalid")
        if row["adjustedTargetWeight"] > row["targetWeight"] + 1e-12:
            raise ValueError("portfolio_m5_risk_increased_exposure")


def _validate_correlations(value: Any) -> None:
    if not isinstance(value, list):
        raise ValueError("portfolio_m5_correlations_invalid")
    for row in value:
        row = _exact_object(
            row,
            {"leftSymbol", "rightSymbol", "correlation", "limit", "status"},
            "portfolio_m5_correlations_invalid",
        )
        _text(row.get("leftSymbol"), 64, "portfolio_m5_correlations_invalid")
        _text(row.get("rightSymbol"), 64, "portfolio_m5_correlations_invalid")
        _finite(row.get("correlation"), "portfolio_m5_correlations_invalid")
        _finite(row.get("limit"), "portfolio_m5_correlations_invalid")
        if row.get("status") not in {"passed", "blocked"}:
            raise ValueError("portfolio_m5_correlations_invalid")


def _validate_risk_contributions(value: Any) -> None:
    if not isinstance(value, list):
        raise ValueError("portfolio_m5_risk_contributions_invalid")
    for row in value:
        row = _exact_object(
            row,
            {"symbol", "sourceRunId", "contributionPct", "limitPct", "status"},
            "portfolio_m5_risk_contributions_invalid",
        )
        _text(row.get("symbol"), 64, "portfolio_m5_risk_contributions_invalid")
        if row.get("sourceRunId") is not None:
            _text(row.get("sourceRunId"), 200, "portfolio_m5_risk_contributions_invalid")
        _finite(row.get("contributionPct"), "portfolio_m5_risk_contributions_invalid")
        _finite(row.get("limitPct"), "portfolio_m5_risk_contributions_invalid")
        if row.get("status") not in {"passed", "blocked"}:
            raise ValueError("portfolio_m5_risk_contributions_invalid")


def _validate_checks(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list) or not value:
        raise ValueError("portfolio_m5_checks_invalid")
    check_ids = []
    for row in value:
        row = _exact_object(
            row,
            {"checkId", "scope", "status", "value", "limit", "unit", "reason"},
            "portfolio_m5_checks_invalid",
        )
        check_ids.append(_text(row.get("checkId"), 100, "portfolio_m5_checks_invalid"))
        if row.get("scope") not in {"account", "portfolio"} or row.get("status") not in _CHECK_STATUSES:
            raise ValueError("portfolio_m5_checks_invalid")
        if row.get("unit") not in {"count", "pct", "weight", "correlation"}:
            raise ValueError("portfolio_m5_checks_invalid")
        _finite(row.get("value"), "portfolio_m5_checks_invalid")
        _finite(row.get("limit"), "portfolio_m5_checks_invalid")
        _text(row.get("reason"), 300, "portfolio_m5_checks_invalid")
    if len(set(check_ids)) != len(check_ids):
        raise ValueError("portfolio_m5_checks_invalid")
    return value


def _exact_object(value: Any, keys: set[str], code: str) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != keys:
        raise ValueError(code)
    return value


def _numeric_object(value: Any, keys: set[str], code: str) -> dict[str, Any]:
    value = _exact_object(value, keys, code)
    for field in keys:
        _finite(value.get(field), code)
    return value


def _text(value: Any, maximum: int, code: str) -> str:
    if not isinstance(value, str):
        raise ValueError(code)
    normalized = value.strip()
    if not normalized or len(normalized) > maximum or contains_secret_like_archive_text(normalized):
        raise ValueError(code)
    return normalized


def _finite(value: Any, code: str) -> float:
    if type(value) not in {int, float} or not math.isfinite(float(value)):
        raise ValueError(code)
    return float(value)


def _bounded_number(value: Any, *, minimum: float, maximum: float, code: str) -> float:
    number = _finite(value, code)
    if not minimum <= number <= maximum:
        raise ValueError(code)
    return number


def _positive_number(value: Any, maximum: float, code: str) -> float:
    number = _bounded_number(value, minimum=0, maximum=maximum, code=code)
    if number <= 0:
        raise ValueError(code)
    return number


def _bounded_integer(value: Any, *, minimum: int, maximum: int, code: str) -> int:
    if type(value) is not int or not minimum <= value <= maximum:
        raise ValueError(code)
    return value


def _weight(value: Any) -> float:
    number = _bounded_number(
        value,
        minimum=0,
        maximum=1,
        code="portfolio_m5_limit_invalid",
    )
    if number <= 0:
        raise ValueError("portfolio_m5_limit_invalid")
    return number


def _timestamp(value: Any, code: str) -> datetime:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(code)
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise ValueError(code) from None
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError(code)
    return parsed


def _hash(value: Any, code: str) -> str:
    if (
        not isinstance(value, str)
        or len(value) != 64
        or any(character not in "0123456789abcdef" for character in value)
    ):
        raise ValueError(code)
    return value


def _utc(value: datetime) -> datetime:
    if not isinstance(value, datetime) or value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("portfolio_m5_datetime_invalid")
    return value.astimezone(timezone.utc)


def _round(value: float, digits: int) -> float:
    rounded = round(value, digits)
    return 0.0 if rounded == 0 else rounded
