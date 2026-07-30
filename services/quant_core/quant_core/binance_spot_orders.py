from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
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
    unexpected_open_orders = sum(
        1
        for order in open_orders
        if isinstance(order, dict)
    )
    account_snapshot = _spot_account_snapshot(
        exchange,
        markets,
        balance,
        base=base,
        quote=quote,
        account_fingerprint=_exchange_account_fingerprint(exchange),
    )
    return {
        "accountCovered": (
            position_covered
            and quote_covered
            and unexpected_open_orders == 0
            and (
                account_snapshot is None
                or account_snapshot["valuationComplete"] is True
            )
        ),
        "positionCovered": position_covered,
        "quoteCovered": quote_covered,
        "unexpectedOpenAutoOrderCount": unexpected,
        "unexpectedOpenOrderCount": unexpected_open_orders,
        **(
            {"accountSnapshot": account_snapshot}
            if account_snapshot is not None
            else {}
        ),
    }


def _spot_account_snapshot(
    exchange: Any,
    markets: Any,
    balance: Any,
    *,
    base: str,
    quote: str,
    account_fingerprint: str | None,
) -> dict[str, Any] | None:
    if not isinstance(balance, dict) or not isinstance(markets, dict):
        return None
    free = balance.get("free")
    used = balance.get("used")
    total = balance.get("total")
    fetch_ticker = getattr(exchange, "fetch_ticker", None)
    if (
        not isinstance(free, dict)
        or not isinstance(used, dict)
        or not isinstance(total, dict)
        or not callable(fetch_ticker)
    ):
        return None
    assets: dict[str, dict[str, float | None]] = {}
    unpriced_assets: list[str] = []
    total_equity = 0.0
    asset_names = {
        str(asset)
        for asset in {*free, *used, *total, base, quote}
        if isinstance(asset, str) and asset
    }
    for asset in sorted(asset_names):
        free_amount = nonnegative_number(free.get(asset, 0), f"{asset} free")
        used_amount = nonnegative_number(used.get(asset, 0), f"{asset} used")
        total_amount = nonnegative_number(total.get(asset, 0), f"{asset} total")
        if not math.isclose(
            free_amount + used_amount,
            total_amount,
            rel_tol=0,
            abs_tol=1e-8,
        ):
            raise ValueError("binance_spot_account_snapshot_unavailable")
        if total_amount <= 0 and asset not in {base, quote}:
            continue
        price = 1.0 if asset == quote else _direct_quote_price(
            fetch_ticker,
            markets,
            asset,
            quote,
        )
        value = total_amount * price if price is not None else None
        if total_amount > 0 and price is None:
            unpriced_assets.append(asset)
        if value is not None:
            total_equity += value
        assets[asset] = {
            "free": round(free_amount, 12),
            "used": round(used_amount, 12),
            "total": round(total_amount, 12),
            "priceUsdt": round(price, 8) if price is not None else None,
            "valueUsdt": round(value, 8) if value is not None else None,
        }
    identity = {
        **(
            {"accountFingerprint": account_fingerprint}
            if account_fingerprint
            else {}
        ),
        "quoteCurrency": quote,
        "assets": assets,
        "totalEquityUsdt": round(total_equity, 8),
        "valuationComplete": not unpriced_assets,
        "unpricedAssets": unpriced_assets,
    }
    return {
        "observedAt": datetime.now(timezone.utc).isoformat(),
        **identity,
        "snapshotHash": hashlib.sha256(
            json.dumps(
                identity,
                ensure_ascii=False,
                sort_keys=True,
                separators=(",", ":"),
            ).encode("utf-8")
        ).hexdigest(),
    }


def _exchange_account_fingerprint(exchange: Any) -> str | None:
    api_key = getattr(exchange, "apiKey", None)
    if not isinstance(api_key, str) or not api_key.strip():
        return None
    return hashlib.sha256(
        f"binance-spot:{api_key.strip()}".encode("utf-8")
    ).hexdigest()


def _direct_quote_price(
    fetch_ticker: Any,
    markets: dict[str, Any],
    asset: str,
    quote: str,
) -> float | None:
    symbol = f"{asset}/{quote}"
    market = markets.get(symbol)
    if not isinstance(market, dict) or market.get("active") is False:
        return None
    ticker = fetch_ticker(symbol)
    if not isinstance(ticker, dict):
        return None
    for field in ("bid", "last", "close"):
        value = ticker.get(field)
        if (
            isinstance(value, (int, float))
            and not isinstance(value, bool)
            and math.isfinite(float(value))
            and float(value) > 0
        ):
            return float(value)
    return None


def create_spot_market_order(
    exchange: Any,
    order: dict[str, Any],
    *,
    market_or_balance_error: str,
    balance_error: str,
    max_buy_notional: float | None = None,
    notional_error: str = "stage6_sandbox_cost_above_maximum",
) -> dict[str, Any]:
    prepared = prepare_spot_market_order(
        exchange,
        order,
        market_or_balance_error=market_or_balance_error,
        balance_error=balance_error,
        max_buy_notional=max_buy_notional,
        notional_error=notional_error,
    )
    amount = prepared["quantity"]
    price = prepared["referencePrice"]
    notional = prepared["notionalValue"]
    if (
        not math.isclose(amount, float(order["quantity"]), rel_tol=0, abs_tol=1e-12)
        or not math.isclose(
            price,
            float(order["referencePrice"]),
            rel_tol=0,
            abs_tol=1e-8,
        )
        or not math.isclose(
            notional,
            float(order["notionalValue"]),
            rel_tol=0,
            abs_tol=1e-8,
        )
    ):
        raise ValueError("binance_spot_market_order_preparation_changed")
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


def prepare_spot_market_order(
    exchange: Any,
    order: dict[str, Any],
    *,
    market_or_balance_error: str,
    balance_error: str,
    max_buy_notional: float | None = None,
    notional_error: str = "stage6_sandbox_cost_above_maximum",
) -> dict[str, Any]:
    if (
        not isinstance(order, dict)
        or not isinstance(order.get("symbol"), str)
        or not order["symbol"].strip()
        or order.get("side") not in {"buy", "sell"}
    ):
        raise ValueError("binance_spot_market_order_invalid")
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
    quantity = positive_number(order.get("quantity"), "quantity")
    limits = market.get("limits") if isinstance(market.get("limits"), dict) else {}
    amount_limits = limits.get("amount") if isinstance(limits.get("amount"), dict) else {}
    minimum_amount = _optional_market_number(amount_limits.get("min"), "minimum amount")
    if minimum_amount is not None and quantity < minimum_amount:
        raise ValueError("stage6_sandbox_amount_below_minimum")
    amount = positive_number(
        float(exchange.amount_to_precision(order["symbol"], quantity)),
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
    precision = market.get("precision") if isinstance(market.get("precision"), dict) else {}
    cost_limits = limits.get("cost") if isinstance(limits.get("cost"), dict) else {}
    taker_fee = market.get("taker")
    return {
        "symbol": order["symbol"],
        "side": order["side"],
        "quantity": amount,
        "referencePrice": price,
        "notionalValue": notional,
        "marketRules": {
            "source": "ccxt",
            "quantityPrecision": _optional_market_number(
                precision.get("amount"),
                "amount precision",
            ),
            "pricePrecision": _optional_market_number(
                precision.get("price"),
                "price precision",
            ),
            "minimumQuantity": _optional_market_number(
                amount_limits.get("min"),
                "minimum amount",
            ),
            "minimumNotional": _optional_market_number(
                cost_limits.get("min"),
                "minimum cost",
            ),
        },
        "executionAssumptions": {
            "feeRate": _optional_market_number(taker_fee, "taker fee"),
            "feeEstimated": True,
            "slippageBps": None,
            "slippageModel": "venue_market_fill",
        },
    }


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


def _optional_market_number(value: Any, label: str) -> float | None:
    return None if value is None else nonnegative_number(value, label)


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
