from __future__ import annotations

import math
from typing import Any


def check_spot_account_coverage(
    exchange: Any,
    *,
    symbol: str,
    expected_base: float,
    required_quote: float,
    auto_order_prefix: str = "aiqt-auto-",
) -> dict[str, Any]:
    markets = exchange.load_markets()
    balance = exchange.fetch_balance()
    fetch_open_orders = getattr(exchange, "fetch_open_orders", None)
    free = balance.get("free") if isinstance(balance, dict) else None
    market = markets.get(symbol) if isinstance(markets, dict) else None
    if (
        not isinstance(market, dict)
        or not isinstance(free, dict)
        or not callable(fetch_open_orders)
    ):
        raise ValueError("binance_spot_account_snapshot_unavailable")
    open_orders = fetch_open_orders(symbol)
    if not isinstance(open_orders, list):
        raise ValueError("binance_spot_account_snapshot_unavailable")
    base, quote = market_currencies(market, symbol)
    position_covered = (
        available(free, base) + 1e-12
        >= nonnegative_number(expected_base, "expected base")
    )
    quote_covered = (
        available(free, quote) + 1e-12
        >= nonnegative_number(required_quote, "required quote")
    )
    unexpected = sum(
        str(
            order.get("clientOrderId")
            or (
                order.get("info", {}).get("clientOrderId")
                if isinstance(order.get("info"), dict)
                else ""
            )
            or ""
        ).startswith(auto_order_prefix)
        for order in open_orders
        if isinstance(order, dict)
    )
    return {
        "accountCovered": position_covered and quote_covered and unexpected == 0,
        "positionCovered": position_covered,
        "quoteCovered": quote_covered,
        "unexpectedOpenAutoOrderCount": unexpected,
    }


def create_spot_market_order(
    exchange: Any,
    order: dict[str, Any],
    *,
    market_or_balance_error: str,
    balance_error: str,
    max_buy_notional: float | None = None,
    notional_error: str = "stage6_sandbox_cost_above_maximum",
) -> dict[str, Any]:
    markets = exchange.load_markets()
    balance = exchange.fetch_balance()
    free = balance.get("free") if isinstance(balance, dict) else None
    market = markets.get(order["symbol"]) if isinstance(markets, dict) else None
    if (
        not isinstance(market, dict)
        or market.get("active") is False
        or not isinstance(free, dict)
    ):
        raise ValueError(market_or_balance_error)
    amount = positive_number(
        float(exchange.amount_to_precision(order["symbol"], order["quantity"])),
        "normalized quantity",
    )
    price = positive_number(
        float(exchange.price_to_precision(order["symbol"], order["referencePrice"])),
        "reference price",
    )
    notional = amount * price
    if (
        max_buy_notional is not None
        and order["side"] == "buy"
        and notional > max_buy_notional
    ):
        raise ValueError(notional_error)
    validate_limits(market, amount, price, notional)
    base, quote = market_currencies(market, order["symbol"])
    currency, needed = (
        (quote, notional) if order["side"] == "buy" else (base, amount)
    )
    if available(free, currency) + 1e-12 < needed:
        raise ValueError(balance_error)
    params = {"newClientOrderId": order["clientOrderId"]}
    if order["side"] == "buy":
        create_with_cost = getattr(
            exchange,
            "create_market_buy_order_with_cost",
            None,
        )
        if not callable(create_with_cost):
            raise ValueError("binance_spot_market_buy_with_cost_unsupported")
        response = create_with_cost(order["symbol"], notional, params)
    else:
        response = exchange.create_order(
            order["symbol"],
            "market",
            order["side"],
            amount,
            price,
            params,
        )
    return normalize_exchange_order(
        response,
        expected_client_order_id=order["clientOrderId"],
    )


def fetch_spot_order(
    exchange: Any,
    order: dict[str, Any],
    exchange_order_id: str | None = None,
) -> dict[str, Any]:
    response = exchange.fetch_order(
        exchange_order_id,
        order["symbol"],
        {"origClientOrderId": order["clientOrderId"]},
    )
    return normalize_exchange_order(
        response,
        expected_client_order_id=order["clientOrderId"],
    )


def normalize_exchange_order(
    value: Any,
    *,
    expected_client_order_id: str,
) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("stage6_sandbox_exchange_order_invalid")
    client_id = str(
        value.get("clientOrderId")
        or value.get("info", {}).get("clientOrderId")
        or ""
    )
    if client_id != expected_client_order_id:
        raise ValueError("stage6_sandbox_exchange_client_order_id_mismatch")
    status = str(value.get("status") or "").lower()
    filled = nonnegative_number(value.get("filled", 0), "filled")
    amount = positive_number(value.get("amount"), "amount")
    average = nonnegative_number(
        value.get("average", 0) or 0,
        "average",
    )
    raw_cost = value.get("cost")
    cost = nonnegative_number(
        filled * average if raw_cost is None else raw_cost,
        "cost",
    )
    fees = normalize_exchange_fees(value)
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
        "remainingQuantity": nonnegative_number(
            value.get("remaining", max(0.0, amount - filled)),
            "remaining",
        ),
        "averagePrice": average,
        "filledNotional": cost,
        "fees": fees,
        "exchangeStatus": status,
        "timestamp": value.get("timestamp"),
    }


def normalize_exchange_fees(value: dict[str, Any]) -> list[dict[str, Any]]:
    raw_fees = value.get("fees")
    candidates = raw_fees if isinstance(raw_fees, list) else [value.get("fee")]
    fees = []
    for item in candidates:
        if not isinstance(item, dict) or item.get("cost") is None:
            continue
        currency = str(item.get("currency") or "").strip()
        if not currency:
            continue
        fees.append({
            "currency": currency,
            "cost": nonnegative_number(item["cost"], "fee cost"),
        })
    return fees


def validate_limits(
    market: dict[str, Any],
    amount: float,
    price: float,
    cost: float,
) -> None:
    limits = market.get("limits") if isinstance(market.get("limits"), dict) else {}
    for kind, value in (("amount", amount), ("price", price), ("cost", cost)):
        bounds = limits.get(kind) if isinstance(limits.get(kind), dict) else {}
        minimum, maximum = bounds.get("min"), bounds.get("max")
        if minimum is not None and value < float(minimum):
            raise ValueError(f"stage6_sandbox_{kind}_below_minimum")
        if maximum is not None and value > float(maximum):
            raise ValueError(f"stage6_sandbox_{kind}_above_maximum")


def market_currencies(market: dict[str, Any], symbol: str) -> tuple[str, str]:
    base, quote = str(market.get("base") or ""), str(market.get("quote") or "")
    if not base or not quote:
        parts = symbol.split("/")
        if len(parts) != 2:
            raise ValueError("stage6_sandbox_symbol_invalid")
        base, quote = parts
    return base, quote


def available(free: dict[str, Any], currency: str) -> float:
    value = free.get(currency, 0)
    return (
        0.0
        if isinstance(value, bool) or not isinstance(value, (int, float))
        else float(value)
    )


def positive_number(value: Any, label: str) -> float:
    number = nonnegative_number(value, label)
    if number <= 0:
        raise ValueError(f"stage6 sandbox {label} must be positive")
    return number


def nonnegative_number(value: Any, label: str) -> float:
    if (
        isinstance(value, bool)
        or not isinstance(value, (int, float))
        or not math.isfinite(float(value))
        or float(value) < 0
    ):
        raise ValueError(
            f"stage6 sandbox {label} must be a finite non-negative number"
        )
    return float(value)


def positive_int(value: str | None, default: int) -> int:
    try:
        return max(1, int(value or default))
    except ValueError:
        return default


def order_not_found(error: Exception) -> bool:
    return error.__class__.__name__ == "OrderNotFound"
