from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib
import json
import math
import os
from threading import Lock
from typing import Any

from quant_core.audit_events import AuditEventStore
from quant_core.stage4_portfolio import validate_stage4_portfolio_workflow_snapshot
from quant_core.stage5_shadow import (
    validate_stage5_sandbox_authorization_preflight,
    validate_stage5_sandbox_authorization_review,
    validate_stage5_sandbox_readiness_decision,
    validate_stage5_shadow_session,
)


_CCXT_UNSET = object()
_AUTH_TTL = timedelta(minutes=10)
_NONTERMINAL = {"submission_pending", "open", "partially_filled", "reconciliation_required"}
_SAFETY = {
    "sandboxOnly": True,
    "sandboxOrderSubmissionAllowed": True,
    "sandboxOrderSubmitted": False,
    "sandboxRouteExecuted": False,
    "liveTradingAllowed": False,
    "liveOrderSubmissionAllowed": False,
    "liveOrderSubmitted": False,
    "liveRouteExecuted": False,
    "liveBlockedBoundary": True,
}


class BinanceSpotTestnetRoute:
    def __init__(self, *, env: dict[str, str] | None = None, ccxt_module: Any = _CCXT_UNSET) -> None:
        self.env = dict(os.environ if env is None else env)
        self.ccxt_module = ccxt_module
        self._exchange: Any | None = None

    def exchange(self) -> Any:
        if self._exchange is not None:
            return self._exchange
        api_key = self.env.get("CCXT_SANDBOX_API_KEY", "").strip()
        secret = self.env.get("CCXT_SANDBOX_SECRET", "").strip()
        if not api_key or not secret:
            raise ValueError("stage6_sandbox_credentials_required")
        ccxt = self._load_ccxt()
        exchange_class = getattr(ccxt, "binance", None)
        if exchange_class is None:
            raise RuntimeError("stage6_binance_exchange_unavailable")
        exchange = exchange_class(
            {
                "apiKey": api_key,
                "secret": secret,
                "enableRateLimit": True,
                "timeout": _positive_int(self.env.get("CCXT_TIMEOUT"), 10_000),
                "options": {"defaultType": "spot"},
            }
        )
        exchange.set_sandbox_mode(True)
        self._exchange = exchange
        return exchange

    def normalize_orders(self, workflow: dict[str, Any]) -> list[dict[str, Any]]:
        workflow = validate_stage4_portfolio_workflow_snapshot(workflow)
        exchange = self.exchange()
        markets = exchange.load_markets()
        balance = exchange.fetch_balance()
        free = balance.get("free") if isinstance(balance, dict) else None
        if not isinstance(markets, dict) or not isinstance(free, dict):
            raise ValueError("stage6_sandbox_market_or_balance_unavailable")
        normalized = []
        required: dict[str, float] = {}
        for source in workflow["batch"]["orders"]:
            symbol = str(source.get("symbol") or "").strip()
            side = str(source.get("side") or "").strip().lower()
            quantity = _positive_number(source.get("quantity"), "quantity")
            notional = _positive_number(source.get("notionalValue"), "notionalValue")
            market = markets.get(symbol)
            if side not in {"buy", "sell"} or not isinstance(market, dict) or market.get("active") is False:
                raise ValueError("stage6_sandbox_order_market_invalid")
            amount = _positive_number(float(exchange.amount_to_precision(symbol, quantity)), "normalized quantity")
            price = _positive_number(float(exchange.price_to_precision(symbol, notional / quantity)), "normalized price")
            normalized_notional = amount * price
            _validate_limits(market, amount, price, normalized_notional)
            base, quote = _market_currencies(market, symbol)
            currency, needed = (quote, normalized_notional) if side == "buy" else (base, amount)
            required[currency] = required.get(currency, 0.0) + needed
            client_order_id = _client_order_id(workflow["workflowHash"], str(source["orderId"]))
            normalized.append(
                {
                    "orderId": source["orderId"],
                    "clientOrderId": client_order_id,
                    "symbol": symbol,
                    "side": side,
                    "type": "limit",
                    "timeInForce": "GTC",
                    "quantity": amount,
                    "price": price,
                    "notionalValue": normalized_notional,
                }
            )
        if math.fsum(order["notionalValue"] for order in normalized) > float(workflow["riskTemplate"]["maxBatchNotional"]):
            raise ValueError("stage6_sandbox_batch_notional_exceeded")
        if any(_available(free, currency) + 1e-12 < needed for currency, needed in required.items()):
            raise ValueError("stage6_sandbox_balance_insufficient")
        return normalized

    def create_order(self, order: dict[str, Any]) -> dict[str, Any]:
        response = self.exchange().create_order(
            order["symbol"],
            "limit",
            order["side"],
            order["quantity"],
            order["price"],
            {"timeInForce": "GTC", "newClientOrderId": order["clientOrderId"]},
        )
        return normalize_exchange_order(response, expected_client_order_id=order["clientOrderId"])

    def fetch_order(self, order: dict[str, Any], exchange_order_id: str | None = None) -> dict[str, Any]:
        response = self.exchange().fetch_order(
            exchange_order_id,
            order["symbol"],
            {"origClientOrderId": order["clientOrderId"]},
        )
        return normalize_exchange_order(response, expected_client_order_id=order["clientOrderId"])

    def cancel_order(self, order: dict[str, Any], exchange_order_id: str | None = None) -> dict[str, Any]:
        response = self.exchange().cancel_order(
            exchange_order_id,
            order["symbol"],
            {"origClientOrderId": order["clientOrderId"]},
        )
        return normalize_exchange_order(response, expected_client_order_id=order["clientOrderId"])

    def _load_ccxt(self) -> Any:
        if self.ccxt_module is not _CCXT_UNSET:
            if self.ccxt_module is None:
                raise RuntimeError("stage6_ccxt_dependency_required")
            return self.ccxt_module
        try:
            import ccxt  # type: ignore
        except ImportError as error:
            raise RuntimeError("stage6_ccxt_dependency_required") from error
        return ccxt


def build_stage6_sandbox_batch_authorization(
    workflow: dict[str, Any],
    shadow_session: dict[str, Any],
    readiness: dict[str, Any],
    preflight: dict[str, Any],
    review: dict[str, Any],
    orders: list[dict[str, Any]],
    *,
    operator: str,
    generated_at: str | None = None,
) -> dict[str, Any]:
    workflow = validate_stage4_portfolio_workflow_snapshot(workflow)
    shadow = validate_stage5_shadow_session(shadow_session)
    readiness = validate_stage5_sandbox_readiness_decision(readiness)
    preflight = validate_stage5_sandbox_authorization_preflight(preflight)
    review = validate_stage5_sandbox_authorization_review(review)
    operator = operator.strip() if isinstance(operator, str) else ""
    if not operator or review["outcome"] != "approved":
        raise ValueError("stage6_sandbox_approved_operator_authorization_required")
    if not isinstance(orders, list) or not orders:
        raise ValueError("stage6_sandbox_normalized_orders_required")
    identity = (workflow["baseRunId"], workflow["workflowId"], workflow["workflowHash"])
    if (
        (shadow["baseRunId"], shadow["workflowId"], shadow["workflowHash"]) != identity
        or (readiness["baseRunId"], readiness["workflowId"], readiness["workflowHash"]) != identity
        or preflight["baseRunId"] != identity[0]
        or review["baseRunId"] != identity[0]
        or readiness["shadowSessionHash"] != shadow["sessionHash"]
        or preflight["readinessDecisionHash"] != readiness["decisionHash"]
        or review["preflightHash"] != preflight["preflightHash"]
    ):
        raise ValueError("stage6_sandbox_authority_chain_mismatch")
    if shadow["status"] != "reconciled" or readiness["adapterId"] != "ccxt-live" or readiness["market"] != "crypto":
        raise ValueError("stage6_sandbox_authority_chain_not_ready")
    source_orders = workflow["batch"]["orders"]
    if [order.get("orderId") for order in orders] != [order.get("orderId") for order in source_orders]:
        raise ValueError("stage6_sandbox_order_sequence_mismatch")
    for order in orders:
        _validate_normalized_order(order, workflow["workflowHash"])
    generated_at = generated_at or datetime.now(timezone.utc).isoformat()
    generated = _utc(generated_at)
    if generated < _utc(review["generatedAt"]):
        raise ValueError("stage6_sandbox_authorization_time_invalid")
    orders_hash = _hash(orders)
    batch_id = str(workflow["batch"]["batchId"])
    authorization_id = "stage6-sandbox-auth-" + hashlib.sha256(
        f"{workflow['workflowHash']}:{batch_id}:{orders_hash}".encode()
    ).hexdigest()[:24]
    authorization = {
        "kind": "aiqt.stage6SandboxBatchAuthorization",
        "schemaVersion": 1,
        "authorizationId": authorization_id,
        "generatedAt": generated_at,
        "expiresAt": (generated + _AUTH_TTL).isoformat(),
        "baseRunId": workflow["baseRunId"],
        "workflowId": workflow["workflowId"],
        "workflowHash": workflow["workflowHash"],
        "batchId": batch_id,
        "shadowSessionHash": shadow["sessionHash"],
        "readinessDecisionHash": readiness["decisionHash"],
        "preflightHash": preflight["preflightHash"],
        "reviewHash": review["reviewHash"],
        "orders": json.loads(json.dumps(orders)),
        "ordersHash": orders_hash,
        "operator": operator,
        "status": "authorized",
        **_SAFETY,
    }
    authorization["authorizationHash"] = stage6_authorization_hash(authorization)
    return validate_stage6_sandbox_batch_authorization(authorization)


def validate_stage6_sandbox_batch_authorization(value: Any, *, now: datetime | None = None, require_fresh: bool = False) -> dict[str, Any]:
    required = {
        "kind", "schemaVersion", "authorizationId", "authorizationHash", "generatedAt", "expiresAt",
        "baseRunId", "workflowId", "workflowHash", "batchId", "shadowSessionHash",
        "readinessDecisionHash", "preflightHash", "reviewHash", "orders", "ordersHash",
        "operator", "status", *_SAFETY,
    }
    if not isinstance(value, dict) or set(value) != required:
        raise ValueError("stage6 sandbox authorization must contain exact fields")
    if value["kind"] != "aiqt.stage6SandboxBatchAuthorization" or value["schemaVersion"] != 1 or value["status"] != "authorized":
        raise ValueError("stage6 sandbox authorization schema is invalid")
    for field in required - {"schemaVersion", "orders", *_SAFETY}:
        if not isinstance(value[field], str) or not value[field]:
            raise ValueError(f"stage6 sandbox authorization {field} is required")
    generated, expires = _utc(value["generatedAt"]), _utc(value["expiresAt"])
    if expires - generated != _AUTH_TTL or (require_fresh and (now or datetime.now(timezone.utc)) > expires):
        raise ValueError("stage6 sandbox authorization expired")
    for field, expected in _SAFETY.items():
        if value[field] is not expected:
            raise ValueError(f"stage6 sandbox authorization {field} is immutable")
    if not isinstance(value["orders"], list) or not value["orders"]:
        raise ValueError("stage6 sandbox authorization orders are required")
    for order in value["orders"]:
        _validate_normalized_order(order, value["workflowHash"])
    if value["ordersHash"] != _hash(value["orders"]) or value["authorizationHash"] != stage6_authorization_hash(value):
        raise ValueError("stage6 sandbox authorization hash does not match")
    expected_id = "stage6-sandbox-auth-" + hashlib.sha256(
        f"{value['workflowHash']}:{value['batchId']}:{value['ordersHash']}".encode()
    ).hexdigest()[:24]
    if value["authorizationId"] != expected_id:
        raise ValueError("stage6 sandbox authorization id does not match")
    return json.loads(json.dumps(value))


def stage6_authorization_hash(value: dict[str, Any]) -> str:
    return _hash({key: item for key, item in value.items() if key != "authorizationHash"})


def authorization_to_audit_event(value: dict[str, Any]) -> dict[str, Any]:
    authorization = validate_stage6_sandbox_batch_authorization(value)
    return {
        "schemaVersion": 1,
        "eventId": authorization["authorizationId"],
        "eventType": "stage6_sandbox_batch_authorization",
        "runId": authorization["baseRunId"],
        "createdAt": authorization["generatedAt"],
        "stage": "stage6-sandbox-batch-authorization",
        "source": authorization["operator"],
        "summary": f"Authorized Stage 6 sandbox batch {authorization['batchId']}.",
        "detail": "Binance Spot Testnet only; live trading remains blocked.",
        "metadata": {"snapshot": authorization},
    }


def validate_stage6_order_transition(value: Any) -> dict[str, Any]:
    required = {
        "authorizationId", "batchId", "orderId", "clientOrderId", "sequence", "recordedAt",
        "state", "attempt", "exchangeEvidence", "error", "transitionHash",
    }
    if not isinstance(value, dict) or set(value) != required:
        raise ValueError("stage6 sandbox transition must contain exact fields")
    if (
        not all(isinstance(value[field], str) and value[field] for field in ("authorizationId", "batchId", "orderId", "clientOrderId", "state"))
        or type(value["sequence"]) is not int or value["sequence"] <= 0
        or type(value["attempt"]) is not int or value["attempt"] <= 0
        or value["state"] not in {"submission_pending", "open", "partially_filled", "filled", "canceled", "expired", "rejected", "reconciliation_required"}
        or not isinstance(value["exchangeEvidence"], dict)
        or not isinstance(value["error"], str)
    ):
        raise ValueError("stage6 sandbox transition contract is invalid")
    _utc(value["recordedAt"])
    if value["transitionHash"] != _hash({key: item for key, item in value.items() if key != "transitionHash"}):
        raise ValueError("stage6 sandbox transition hash is invalid")
    return json.loads(json.dumps(value))


def normalize_exchange_order(value: Any, *, expected_client_order_id: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("stage6_sandbox_exchange_order_invalid")
    client_id = str(value.get("clientOrderId") or value.get("info", {}).get("clientOrderId") or "")
    if client_id != expected_client_order_id:
        raise ValueError("stage6_sandbox_exchange_client_order_id_mismatch")
    status = str(value.get("status") or "").lower()
    filled = _nonnegative_number(value.get("filled", 0), "filled")
    amount = _positive_number(value.get("amount"), "amount")
    state = {
        "open": "partially_filled" if filled > 0 else "open",
        "closed": "filled",
        "canceled": "canceled",
        "cancelled": "canceled",
        "expired": "expired",
        "rejected": "rejected",
    }.get(status)
    if state is None:
        raise ValueError("stage6_sandbox_exchange_order_status_unknown")
    return {
        "exchangeOrderId": str(value.get("id") or ""),
        "clientOrderId": client_id,
        "state": state,
        "filledQuantity": filled,
        "remainingQuantity": _nonnegative_number(value.get("remaining", max(0.0, amount - filled)), "remaining"),
        "averagePrice": _nonnegative_number(value.get("average", 0) or 0, "average"),
        "exchangeStatus": status,
        "timestamp": value.get("timestamp"),
    }


def is_active_batch(orders: list[dict[str, Any]]) -> bool:
    return any(isinstance(order, dict) and order.get("state") in _NONTERMINAL for order in orders)


def validate_stage6_kill_switch(value: Any) -> dict[str, Any]:
    if (
        not isinstance(value, dict) or set(value) != {"enabled", "triggered", "recordedAt", "operator"}
        or value["enabled"] is not True or type(value["triggered"]) is not bool
        or not isinstance(value["operator"], str) or not value["operator"].strip()
    ):
        raise ValueError("stage6 sandbox kill switch contract is invalid")
    _utc(value["recordedAt"])
    return json.loads(json.dumps(value))


class Stage6SandboxExecutionService:
    # ponytail: one API process owns the single sandbox account; use a DB lease if multi-worker deployment is introduced.
    _lock = Lock()

    def __init__(self, audit_store: AuditEventStore, route: BinanceSpotTestnetRoute) -> None:
        self.audit_store = audit_store
        self.route = route

    def record_authorization(self, authorization: dict[str, Any]) -> dict[str, Any]:
        authorization = validate_stage6_sandbox_batch_authorization(authorization)
        stored, _created = self.audit_store.record_if_absent(authorization_to_audit_event(authorization))
        existing = stored.metadata.get("snapshot")
        if existing != authorization:
            raise ValueError("stage6_sandbox_authorization_conflict")
        return authorization

    def get_authorization(
        self, authorization_id: str, *, require_fresh: bool = False, allow_detached: bool = False
    ) -> dict[str, Any]:
        event = self.audit_store.get(authorization_id)
        snapshot = event.metadata.get("snapshot") if event and event.event_type == "stage6_sandbox_batch_authorization" else None
        if not isinstance(snapshot, dict):
            raise ValueError("stage6_sandbox_authorization_not_found")
        if event and event.metadata.get("detached") is True and not allow_detached:
            raise ValueError("stage6_sandbox_import_is_detached")
        return validate_stage6_sandbox_batch_authorization(snapshot, require_fresh=require_fresh)

    def batch(self, authorization_id: str) -> dict[str, Any]:
        authorization = self.get_authorization(authorization_id, allow_detached=True)
        transitions = self._transitions(authorization_id)
        latest = {order["orderId"]: {**order, "state": "authorized", "attempt": 0, "exchangeEvidence": {}} for order in authorization["orders"]}
        for transition in transitions:
            latest[transition["orderId"]] = {**latest[transition["orderId"]], **transition}
        orders = [latest[order["orderId"]] for order in authorization["orders"]]
        evidence = [order.get("exchangeEvidence", {}) for order in orders]
        return {
            "authorizationId": authorization_id,
            "baseRunId": authorization["baseRunId"],
            "batchId": authorization["batchId"],
            "status": _batch_status(orders),
            "orders": orders,
            "killSwitch": self.kill_switch(),
            "sandboxOnly": True,
            "sandboxOrderSubmitted": any(isinstance(row, dict) and row.get("clientOrderId") for row in evidence),
            "sandboxRouteExecuted": any(isinstance(row, dict) and row.get("operation") for row in evidence),
            "liveTradingAllowed": False,
            "liveOrderSubmissionAllowed": False,
            "liveOrderSubmitted": False,
            "liveRouteExecuted": False,
            "liveBlockedBoundary": True,
        }

    def submit(self, authorization_id: str) -> dict[str, Any]:
        with self._lock:
            authorization = self.get_authorization(authorization_id)
            if self.kill_switch()["triggered"]:
                raise ValueError("stage6_sandbox_kill_switch_triggered")
            for event in self._events("stage6_sandbox_batch_authorization"):
                other = event.metadata.get("snapshot")
                if (
                    event.metadata.get("detached") is not True
                    and isinstance(other, dict)
                    and other.get("authorizationId") != authorization_id
                ):
                    if is_active_batch(self.batch(str(other.get("authorizationId")))["orders"]):
                        raise ValueError("stage6_sandbox_active_batch_exists")
            batch = self.batch(authorization_id)
            if all(order["state"] == "authorized" for order in batch["orders"]):
                validate_stage6_sandbox_batch_authorization(authorization, require_fresh=True)
            for order in authorization["orders"]:
                current = next(row for row in batch["orders"] if row["orderId"] == order["orderId"])
                if current["state"] in {"filled", "canceled", "expired", "rejected", "open", "partially_filled"}:
                    continue
                if current["state"] == "reconciliation_required":
                    break
                attempt = int(current.get("attempt") or 0) + 1
                self._record_transition(authorization, order, "submission_pending", attempt=attempt)
                evidence = self._submit_with_query_first(order, attempt=attempt)
                self._record_exchange_evidence(authorization, order, evidence, attempt=attempt)
                confirmed = self._reconcile_order(
                    authorization,
                    order,
                    {**current, "state": evidence["state"], "attempt": attempt, "exchangeEvidence": evidence},
                )
                if confirmed["state"] in {"rejected", "reconciliation_required"}:
                    self._cancel_open_orders(authorization)
                    break
            return self.batch(authorization_id)

    def reconcile(self, authorization_id: str) -> dict[str, Any]:
        with self._lock:
            authorization = self.get_authorization(authorization_id)
            for row in self.batch(authorization_id)["orders"]:
                if row["state"] not in _NONTERMINAL:
                    continue
                order = next(item for item in authorization["orders"] if item["orderId"] == row["orderId"])
                self._reconcile_order(authorization, order, row)
            return self.batch(authorization_id)

    def cancel(self, authorization_id: str, order_id: str) -> dict[str, Any]:
        with self._lock:
            authorization = self.get_authorization(authorization_id)
            row = next((item for item in self.batch(authorization_id)["orders"] if item["orderId"] == order_id), None)
            order = next((item for item in authorization["orders"] if item["orderId"] == order_id), None)
            if not row or not order:
                raise ValueError("stage6_sandbox_order_not_found")
            if row["state"] not in {"open", "partially_filled", "submission_pending", "reconciliation_required"}:
                return self.batch(authorization_id)
            self._cancel_and_reconcile(authorization, order, row)
            return self.batch(authorization_id)

    def recover_active_batches(self) -> list[dict[str, Any]]:
        recovered = []
        for event in self._events("stage6_sandbox_batch_authorization"):
            if event.metadata.get("detached") is True:
                continue
            try:
                batch = self.batch(event.event_id)
                if is_active_batch(batch["orders"]):
                    recovered.append(self.reconcile(event.event_id))
            except (LookupError, ValueError, RuntimeError):
                continue
        return recovered

    def kill_switch(self) -> dict[str, Any]:
        events = [event for event in self._events("stage6_sandbox_kill_switch")
                  if event.metadata.get("detached") is not True]
        if not events:
            return {"enabled": True, "triggered": False, "recordedAt": None, "operator": None}
        snapshot = events[0].metadata.get("snapshot")
        return validate_stage6_kill_switch(snapshot)

    def set_kill_switch(self, *, triggered: bool, operator: str) -> dict[str, Any]:
        operator = operator.strip()
        if not operator:
            raise ValueError("stage6_sandbox_kill_switch_operator_required")
        with self._lock:
            authorization_events = [
                event for event in self._events("stage6_sandbox_batch_authorization")
                if event.metadata.get("detached") is not True and isinstance(event.metadata.get("snapshot"), dict)
            ]
            active = [event for event in authorization_events if is_active_batch(self.batch(event.event_id)["orders"])]
            if not triggered:
                if active:
                    raise ValueError("stage6_sandbox_kill_switch_reset_requires_reconciliation")
            now = datetime.now(timezone.utc).isoformat()
            snapshot = {"enabled": True, "triggered": triggered, "recordedAt": now, "operator": operator}
            previous = next((event for event in self._events(
                "stage6_sandbox_kill_switch"
            ) if event.metadata.get("detached") is not True), None)
            run_id = active[0].run_id if active else (previous.run_id if previous else None)
            self.audit_store.record(
                {
                    "schemaVersion": 1,
                    "eventId": f"stage6-kill-switch-{hashlib.sha256(now.encode()).hexdigest()[:24]}",
                    "eventType": "stage6_sandbox_kill_switch",
                    "runId": run_id or "",
                    "createdAt": now,
                    "stage": "stage6-sandbox-kill-switch",
                    "source": operator,
                    "summary": "Triggered Stage 6 sandbox kill switch." if triggered else "Reset Stage 6 sandbox kill switch.",
                    "detail": "Sandbox account control only; live trading remains blocked.",
                    "metadata": {"snapshot": snapshot},
                }
            )
            if triggered:
                for event in authorization_events:
                    self._cancel_open_orders(event.metadata["snapshot"])
            return snapshot

    def _submit_with_query_first(self, order: dict[str, Any], *, attempt: int) -> dict[str, Any]:
        if attempt > 1:
            try:
                return {**self.route.fetch_order(order), "operation": "query"}
            except Exception as error:
                if not _order_not_found(error):
                    return _unknown_evidence(error, "query")
        try:
            return {**self.route.create_order(order), "operation": "create"}
        except Exception as first_error:
            try:
                return {**self.route.fetch_order(order), "operation": "query"}
            except Exception as query_error:
                return _unknown_evidence(query_error if not _order_not_found(query_error) else first_error, "query")

    def _cancel_open_orders(self, authorization: dict[str, Any]) -> None:
        for row in self.batch(authorization["authorizationId"])["orders"]:
            if row["state"] in {"open", "partially_filled"}:
                order = next(item for item in authorization["orders"] if item["orderId"] == row["orderId"])
                self._cancel_and_reconcile(authorization, order, row)

    def _reconcile_order(
        self,
        authorization: dict[str, Any],
        order: dict[str, Any],
        row: dict[str, Any],
        *,
        allow_submission_retry: bool = True,
    ) -> dict[str, Any]:
        attempt = int(row.get("attempt") or 1)
        try:
            evidence = {
                **self.route.fetch_order(order, row.get("exchangeEvidence", {}).get("exchangeOrderId")),
                "operation": "query",
            }
        except Exception as error:
            if (
                allow_submission_retry and _order_not_found(error)
                and row["state"] in {"submission_pending", "reconciliation_required"} and attempt < 2
            ):
                attempt += 1
                self._record_transition(authorization, order, "submission_pending", attempt=attempt)
                evidence = self._submit_with_query_first(order, attempt=attempt)
                return self._record_exchange_evidence(authorization, order, evidence, attempt=attempt)
            evidence = _unknown_evidence(error, "query")
        return self._record_exchange_evidence(authorization, order, evidence, attempt=attempt)

    def _cancel_and_reconcile(
        self, authorization: dict[str, Any], order: dict[str, Any], row: dict[str, Any]
    ) -> dict[str, Any]:
        attempt = int(row.get("attempt") or 1)
        try:
            evidence = {
                **self.route.cancel_order(order, row.get("exchangeEvidence", {}).get("exchangeOrderId")),
                "operation": "cancel",
            }
        except Exception as error:
            self._record_exchange_evidence(
                authorization, order, _unknown_evidence(error, "cancel"), attempt=attempt
            )
        else:
            self._record_exchange_evidence(authorization, order, evidence, attempt=attempt)
        return self._reconcile_order(
            authorization, order, row, allow_submission_retry=False
        )

    def _record_exchange_evidence(
        self,
        authorization: dict[str, Any],
        order: dict[str, Any],
        evidence: dict[str, Any],
        *,
        attempt: int,
    ) -> dict[str, Any]:
        return self._record_transition(
            authorization,
            order,
            evidence["state"],
            attempt=attempt,
            exchange_evidence=evidence,
        )

    def _record_transition(
        self,
        authorization: dict[str, Any],
        order: dict[str, Any],
        state: str,
        *,
        attempt: int,
        exchange_evidence: dict[str, Any] | None = None,
        error: Exception | None = None,
    ) -> dict[str, Any]:
        existing = self._transitions(authorization["authorizationId"])
        sequence = len(existing) + 1
        now = datetime.now(timezone.utc).isoformat()
        transition = {
            "authorizationId": authorization["authorizationId"],
            "batchId": authorization["batchId"],
            "orderId": order["orderId"],
            "clientOrderId": order["clientOrderId"],
            "sequence": sequence,
            "recordedAt": now,
            "state": state,
            "attempt": attempt,
            "exchangeEvidence": exchange_evidence or {},
            "error": _safe_error(error),
        }
        transition["transitionHash"] = _hash(transition)
        self.audit_store.record_if_absent(
            {
                "schemaVersion": 1,
                "eventId": f"stage6-transition-{authorization['authorizationId']}-{sequence}",
                "eventType": "stage6_sandbox_order_transition",
                "runId": authorization["baseRunId"],
                "createdAt": now,
                "stage": "stage6-sandbox-order-transition",
                "source": authorization["operator"],
                "summary": f"Stage 6 sandbox order {order['orderId']} entered {state}.",
                "detail": "Binance Spot Testnet evidence; live route remains blocked.",
                "metadata": {"snapshot": transition},
            }
        )
        return transition

    def _transitions(self, authorization_id: str) -> list[dict[str, Any]]:
        rows = []
        for event in self._events("stage6_sandbox_order_transition"):
            snapshot = event.metadata.get("snapshot")
            if isinstance(snapshot, dict) and snapshot.get("authorizationId") == authorization_id:
                rows.append(validate_stage6_order_transition(snapshot))
        return sorted(rows, key=lambda row: row["sequence"])

    def _events(self, event_type: str) -> list[Any]:
        rows = []
        offset = 0
        while True:
            page = self.audit_store.list_recent(event_type=event_type, limit=50, offset=offset)
            rows.extend(page)
            if len(page) < 50:
                return rows
            offset += len(page)


def _validate_normalized_order(order: Any, workflow_hash: str) -> None:
    required = {"orderId", "clientOrderId", "symbol", "side", "type", "timeInForce", "quantity", "price", "notionalValue"}
    if not isinstance(order, dict) or set(order) != required:
        raise ValueError("stage6 sandbox normalized order fields are invalid")
    if (
        order["side"] not in {"buy", "sell"}
        or order["type"] != "limit"
        or order["timeInForce"] != "GTC"
        or order["clientOrderId"] != _client_order_id(workflow_hash, str(order["orderId"]))
    ):
        raise ValueError("stage6 sandbox normalized order contract is invalid")
    for field in ("quantity", "price", "notionalValue"):
        _positive_number(order[field], field)
    if not math.isclose(float(order["notionalValue"]), float(order["quantity"]) * float(order["price"]), rel_tol=1e-9):
        raise ValueError("stage6 sandbox normalized order notional does not match")


def _validate_limits(market: dict[str, Any], amount: float, price: float, cost: float) -> None:
    limits = market.get("limits") if isinstance(market.get("limits"), dict) else {}
    for kind, value in (("amount", amount), ("price", price), ("cost", cost)):
        bounds = limits.get(kind) if isinstance(limits.get(kind), dict) else {}
        minimum, maximum = bounds.get("min"), bounds.get("max")
        if minimum is not None and value < float(minimum):
            raise ValueError(f"stage6_sandbox_{kind}_below_minimum")
        if maximum is not None and value > float(maximum):
            raise ValueError(f"stage6_sandbox_{kind}_above_maximum")


def _market_currencies(market: dict[str, Any], symbol: str) -> tuple[str, str]:
    base, quote = str(market.get("base") or ""), str(market.get("quote") or "")
    if not base or not quote:
        parts = symbol.split("/")
        if len(parts) != 2:
            raise ValueError("stage6_sandbox_symbol_invalid")
        base, quote = parts
    return base, quote


def _available(free: dict[str, Any], currency: str) -> float:
    value = free.get(currency, 0)
    return 0.0 if isinstance(value, bool) or not isinstance(value, (int, float)) else float(value)


def _client_order_id(workflow_hash: str, order_id: str) -> str:
    return "shadow-" + hashlib.sha256(f"{workflow_hash}:{order_id}".encode()).hexdigest()[:24]


def _positive_number(value: Any, label: str) -> float:
    number = _nonnegative_number(value, label)
    if number <= 0:
        raise ValueError(f"stage6 sandbox {label} must be positive")
    return number


def _nonnegative_number(value: Any, label: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(float(value)) or float(value) < 0:
        raise ValueError(f"stage6 sandbox {label} must be a finite non-negative number")
    return float(value)


def _positive_int(value: str | None, default: int) -> int:
    try:
        return max(1, int(value or default))
    except ValueError:
        return default


def _utc(value: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(value)
    except (TypeError, ValueError) as error:
        raise ValueError("stage6 sandbox timestamp is invalid") from error
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError("stage6 sandbox timestamp requires timezone")
    return parsed.astimezone(timezone.utc)


def _hash(value: Any) -> str:
    return hashlib.sha256(json.dumps(value, allow_nan=False, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def _batch_status(orders: list[dict[str, Any]]) -> str:
    states = {str(order.get("state")) for order in orders}
    if "reconciliation_required" in states:
        return "reconciliation_required"
    if states & {"submission_pending", "open", "partially_filled"}:
        return "active"
    if states == {"authorized"}:
        return "authorized"
    if "rejected" in states:
        return "blocked"
    return "reconciled"


def _order_not_found(error: Exception) -> bool:
    return error.__class__.__name__ == "OrderNotFound"


def _unknown_evidence(error: Exception, operation: str) -> dict[str, Any]:
    return {
        "exchangeOrderId": "",
        "clientOrderId": "",
        "state": "reconciliation_required",
        "filledQuantity": 0.0,
        "remainingQuantity": 0.0,
        "averagePrice": 0.0,
        "exchangeStatus": "unknown",
        "timestamp": None,
        "operation": operation,
        "error": _safe_error(error),
    }


def _safe_error(error: Exception | None) -> str:
    if error is None:
        return ""
    return error.__class__.__name__
