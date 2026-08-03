from __future__ import annotations

from collections.abc import Mapping, Sequence
from datetime import datetime
from typing import Any
from urllib.parse import urlencode

from quant_core.sec_edgar import is_valid_sec_edgar_user_agent

from .common import _finite_or_none, _parse_datetime, _split_crypto_symbol
from .contracts import (
    _CRYPTO_FUNDAMENTAL_TTL,
    _EVIDENCE_BUDGET_SECONDS,
    _STOCK_FUNDAMENTAL_TTL,
)
from .fundamental_sources import (
    _coingecko_mapping_coverage,
    _coingecko_mapping_entry_expired,
    _coingecko_mapping_incomplete,
    _coingecko_mapping_observed_at,
    _sec_ticker_map,
    _valid_coingecko_ticker_observation,
    _valid_crypto_fundamental_observation,
    build_coingecko_binance_mapping,
    compare_stock_fundamental_sources,
    parse_ashare_financial_reports,
    parse_sec_companyfacts,
)

class _FundamentalMixin:
    def _load_fundamental(
            self,
            candidate: Mapping[str, Any],
            *,
            market: str,
            cutoff: datetime,
            deadline: float,
        ) -> Mapping[str, Any] | None:
            key = f"fundamental:{market}:{candidate['symbol']}"
            ttl = (
                _CRYPTO_FUNDAMENTAL_TTL
                if market == "crypto"
                else _STOCK_FUNDAMENTAL_TTL
            )
            cached = self._cache_get(key, ttl=ttl, now=cutoff)
            crypto_mapping_matches = True
            if (
                market == "crypto"
                and isinstance(cached, Mapping)
                and cached.get("source") == "coingecko+binance"
            ):
                base, target = _split_crypto_symbol(str(candidate["symbol"]))
                mapping, _ = self._ensure_coingecko_mapping(
                    {f"{base}/{target}"},
                    cutoff=cutoff,
                    deadline=None,
                )
                mapped = mapping.get(f"{base}/{target}")
                crypto_mapping_matches = (
                    isinstance(mapped, Mapping)
                    and mapped.get("status") == "mapped"
                    and mapped.get("coinId") == cached.get("coinId")
                )
            if cached is not None and (
                market != "crypto"
                or not isinstance(cached, Mapping)
                or cached.get("source") != "coingecko+binance"
                or (
                    crypto_mapping_matches
                    and _valid_crypto_fundamental_observation(cached, cutoff=cutoff)
                )
            ):
                return dict(cached) if isinstance(cached, Mapping) else None
            loader = self.fundamental_loaders.get(market)
            if loader is not None:
                value = loader(candidate, cutoff)
            elif market == "ashare":
                value = self._load_ashare_fundamental(
                    candidate,
                    cutoff=cutoff,
                    deadline=deadline,
                )
            elif market == "us":
                value = self._load_us_fundamental(
                    candidate,
                    cutoff=cutoff,
                    deadline=deadline,
                )
            else:
                value = self._load_crypto_fundamental(candidate, cutoff=cutoff)
            if isinstance(value, Mapping) and not value.get("sourceStatus"):
                normalized = dict(value)
                self._cache_put(key, normalized, now=cutoff)
                return normalized
            return dict(value) if isinstance(value, Mapping) else None

    def _prepare_fundamental_sources(
            self,
            candidates: Sequence[Mapping[str, Any]],
            *,
            market: str,
            cutoff: datetime,
            deadline: float,
        ) -> tuple[bool, dict[str, Any] | None, list[str]]:
            if market != "crypto" or self.fundamental_loaders.get("crypto") is not None:
                return False, None, []
            required_pairs = {
                f"{base}/{target}"
                for item in candidates
                if (base := _split_crypto_symbol(str(item["symbol"]))[0])
                and (target := _split_crypto_symbol(str(item["symbol"]))[1])
            }
            mapping, mapping_incomplete = self._ensure_coingecko_mapping(
                required_pairs,
                cutoff=cutoff,
                deadline=deadline,
            )
            warnings = (
                ["CoinGecko 交易对映射源未完整返回，已仅使用验证完成的精确映射。"]
                if mapping_incomplete
                else []
            )
            coverage = _coingecko_mapping_coverage(
                mapping,
                required_pairs,
                observed_at=_coingecko_mapping_observed_at(
                    mapping,
                    required_pairs,
                    fallback=cutoff,
                ),
            )
            coin_ids = sorted(
                {
                    str(item["coinId"])
                    for pair in required_pairs
                    if isinstance((item := mapping.get(pair)), Mapping)
                    and item.get("coinId")
                }
            )
            missing_ids = [
                coin_id
                for coin_id in coin_ids
                if self._cache_get(
                    f"source:coingecko-market:{coin_id}",
                    ttl=_CRYPTO_FUNDAMENTAL_TTL,
                    now=cutoff,
                )
                is None
            ]
            if not missing_ids:
                return self.monotonic() >= deadline, coverage, warnings
            if self.monotonic() >= deadline:
                return True, coverage, warnings
            try:
                payload = self._read_json(
                    "https://api.coingecko.com/api/v3/coins/markets?"
                    + urlencode(
                        {
                            "vs_currency": "usd",
                            "ids": ",".join(missing_ids),
                        }
                    ),
                    {"Accept": "application/json"},
                    deadline=deadline,
                )
            except Exception:
                return (
                    self.monotonic() >= deadline,
                    coverage,
                    [
                        *warnings,
                        "CoinGecko 市场事实源未完整返回，已排除缺失事实的候选。",
                    ],
                )
            if not isinstance(payload, list):
                return (
                    self.monotonic() >= deadline,
                    coverage,
                    [
                        *warnings,
                        "CoinGecko 市场事实源未完整返回，已排除缺失事实的候选。",
                    ],
                )
            returned_ids: set[str] = set()
            for row in payload:
                if (
                    isinstance(row, Mapping)
                    and isinstance(row.get("id"), str)
                    and row["id"] in missing_ids
                ):
                    returned_ids.add(row["id"])
                    observed_at = _parse_datetime(row.get("last_updated"))
                    source_status = (
                        "crypto_market_facts_timestamp_missing"
                        if observed_at is None
                        else "crypto_market_facts_timestamp_future"
                        if observed_at > cutoff
                        else "crypto_market_facts_stale"
                        if cutoff - observed_at > _CRYPTO_FUNDAMENTAL_TTL
                        else None
                    )
                    self._cache_put(
                        f"source:coingecko-market:{row['id']}",
                        (
                            {"_sourceStatus": source_status}
                            if source_status is not None
                            else dict(row)
                        ),
                        now=cutoff,
                    )
            for coin_id in set(missing_ids) - returned_ids:
                self._cache_put(
                    f"source:coingecko-market:{coin_id}",
                    {
                        "_sourceStatus": "crypto_market_facts_missing",
                        "checkedAt": cutoff.isoformat(),
                    },
                    now=cutoff,
                )
            return self.monotonic() >= deadline, coverage, warnings

    def _load_ashare_fundamental(
            self,
            candidate: Mapping[str, Any],
            *,
            cutoff: datetime,
            deadline: float,
        ) -> Mapping[str, Any] | None:
            if self.monotonic() >= deadline:
                return None
            try:
                import akshare as ak  # type: ignore[import-not-found]

                symbol = str(candidate["symbol"])
                stock = (
                    f"sh{symbol}"
                    if symbol.startswith(("5", "6", "9"))
                    else f"bj{symbol}"
                    if symbol.startswith(("4", "8"))
                    else f"sz{symbol}"
                )
                income = ak.stock_financial_report_sina(stock=stock, symbol="利润表")
                balance = ak.stock_financial_report_sina(
                    stock=stock,
                    symbol="资产负债表",
                )
            except Exception:
                return None
            primary = parse_ashare_financial_reports(
                income,
                balance,
                cutoff=cutoff,
                source="akshare-sina-financial-report",
            )
            if primary is None:
                return None
            secondary: Mapping[str, Any] | None = None
            try:
                secondary_income = ak.stock_profit_sheet_by_report_em(
                    symbol=stock.upper()
                )
                secondary_balance = ak.stock_balance_sheet_by_report_em(
                    symbol=stock.upper()
                )
                secondary = parse_ashare_financial_reports(
                    secondary_income,
                    secondary_balance,
                    cutoff=cutoff,
                    source="akshare-eastmoney-financial-report",
                )
            except Exception:
                secondary = None
            verification = compare_stock_fundamental_sources(primary, secondary)
            return {
                **primary,
                "sourceVerification": verification,
                "dualSourceStatus": verification["status"],
                "conflict": verification["status"] == "conflict",
            }

    def _load_us_fundamental(
            self,
            candidate: Mapping[str, Any],
            *,
            cutoff: datetime,
            deadline: float,
        ) -> Mapping[str, Any] | None:
            if not is_valid_sec_edgar_user_agent(self.sec_user_agent):
                return {
                    "sourceStatus": "sec_user_agent_invalid",
                    "source": "sec-companyfacts",
                }

            def load_ticker_map() -> dict[str, str]:
                payload = self._read_sec_json(
                    "https://www.sec.gov/files/company_tickers.json",
                    {"User-Agent": self.sec_user_agent, "Accept": "application/json"},
                    deadline=deadline,
                )
                return _sec_ticker_map(payload)

            ticker_map = self._shared_source(
                "source:sec-ticker-map",
                ttl=_STOCK_FUNDAMENTAL_TTL,
                now=cutoff,
                loader=load_ticker_map,
            )
            cik = ticker_map.get(str(candidate["symbol"]).upper())
            if not isinstance(cik, str):
                return {
                    "sourceStatus": "sec_ticker_mapping_missing",
                    "source": "sec-companyfacts",
                }
            payload = self._read_sec_json(
                f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json",
                {"User-Agent": self.sec_user_agent, "Accept": "application/json"},
                deadline=deadline,
            )
            return parse_sec_companyfacts(payload, cutoff=cutoff)

    def _load_crypto_fundamental(
            self,
            candidate: Mapping[str, Any],
            *,
            cutoff: datetime,
        ) -> Mapping[str, Any] | None:
            base, target = _split_crypto_symbol(str(candidate["symbol"]))
            mapping, _ = self._ensure_coingecko_mapping(
                {f"{base}/{target}"},
                cutoff=cutoff,
                deadline=None,
            )
            mapped = mapping.get(f"{base}/{target}")
            mapping_status = (
                str(mapped.get("status") or "")
                if isinstance(mapped, Mapping)
                else "unresolved"
            )
            if mapping_status != "mapped" or not mapped.get("coinId"):
                source_status = (
                    "crypto_mapping_source_invalid"
                    if isinstance(mapped, Mapping)
                    and mapped.get("reason") == "source_observation_invalid"
                    else f"crypto_mapping_{mapping_status or 'unresolved'}"
                )
                return {
                    "sourceStatus": source_status,
                    "source": "coingecko+binance",
                }
            coin_id = str(mapped["coinId"])
            row = self._cache_get(
                f"source:coingecko-market:{coin_id}",
                ttl=_CRYPTO_FUNDAMENTAL_TTL,
                now=cutoff,
            )
            if not isinstance(row, Mapping):
                return {
                    "sourceStatus": "crypto_market_facts_missing",
                    "source": "coingecko+binance",
                    "coinId": coin_id,
                }
            if row.get("_sourceStatus"):
                return {
                    "sourceStatus": str(row["_sourceStatus"]),
                    "source": "coingecko+binance",
                    "coinId": coin_id,
                }
            observed_at = _parse_datetime(row.get("last_updated"))
            mapping_observed_at = _parse_datetime(mapped.get("observedAt"))
            if (
                observed_at is None
                or observed_at > cutoff
                or cutoff - observed_at > _CRYPTO_FUNDAMENTAL_TTL
                or mapping_observed_at is None
                or mapping_observed_at > cutoff
                or cutoff - mapping_observed_at > _CRYPTO_FUNDAMENTAL_TTL
            ):
                return {
                    "sourceStatus": "crypto_market_facts_timestamp_invalid",
                    "source": "coingecko+binance",
                    "coinId": coin_id,
                }
            return {
                "coinId": coin_id,
                "mappedFrom": f"binance:{base}/{target}",
                "marketCap": _finite_or_none(row.get("market_cap")),
                "circulatingSupply": _finite_or_none(row.get("circulating_supply")),
                "totalSupply": _finite_or_none(row.get("total_supply")),
                "maxSupply": _finite_or_none(row.get("max_supply")),
                "fullyDilutedValuation": _finite_or_none(
                    row.get("fully_diluted_valuation")
                ),
                "bidAskSpreadPct": _finite_or_none(mapped.get("bidAskSpreadPct")),
                "binanceQuoteVolume": _finite_or_none(candidate.get("amount")),
                "mappingObservedAt": mapping_observed_at.isoformat(),
                "observedAt": observed_at.isoformat(),
                "source": "coingecko+binance",
            }

    def _ensure_coingecko_mapping(
            self,
            required_pairs: set[str],
            *,
            cutoff: datetime,
            deadline: float | None,
        ) -> tuple[Mapping[str, Any], bool]:
            key = "source:coingecko-binance-map"
            cached = self._cache_get(
                key,
                ttl=_CRYPTO_FUNDAMENTAL_TTL,
                now=cutoff,
            )
            if (
                isinstance(cached, Mapping)
                and required_pairs <= set(cached)
                and not any(
                    _coingecko_mapping_entry_expired(cached.get(pair), cutoff=cutoff)
                    for pair in required_pairs
                )
                and (
                    deadline is None
                    or not _coingecko_mapping_incomplete(cached, required_pairs)
                )
            ):
                return cached, _coingecko_mapping_incomplete(cached, required_pairs)
            effective_deadline = (
                deadline
                if deadline is not None
                else self.monotonic() + _EVIDENCE_BUDGET_SECONDS
            )
            with self._source_lock:
                cached = self._cache_get(
                    key,
                    ttl=_CRYPTO_FUNDAMENTAL_TTL,
                    now=cutoff,
                )
                existing = dict(cached) if isinstance(cached, Mapping) else {}
                resume_page = existing.pop("_nextPage", 1)
                resume_boundary = str(existing.pop("_boundaryPair", "") or "")
                resume_coin_ids = str(existing.pop("_coinIds", "") or "")
                expired = {
                    pair
                    for pair in required_pairs
                    if _coingecko_mapping_entry_expired(
                        existing.get(pair),
                        cutoff=cutoff,
                    )
                }
                for pair in expired:
                    existing.pop(pair, None)
                unresolved = {
                    pair
                    for pair in required_pairs
                    if isinstance(existing.get(pair), Mapping)
                    and existing[pair].get("status") == "unresolved"
                }
                missing = (required_pairs - set(existing)) | unresolved
                if not missing:
                    return existing, _coingecko_mapping_incomplete(
                        existing,
                        required_pairs,
                    )
                for pair in unresolved:
                    existing.pop(pair, None)
                coin_ids = ""
                coin_index = (
                    self._cache_get(
                        "source:coingecko-coin-list",
                        ttl=_CRYPTO_FUNDAMENTAL_TTL,
                        now=cutoff,
                    )
                    if len(missing) > 1
                    else None
                )
                if len(missing) > 1 and not isinstance(coin_index, Mapping):
                    try:
                        payload = self._read_json(
                            "https://api.coingecko.com/api/v3/coins/list?"
                            + urlencode({"include_platform": "false"}),
                            {"Accept": "application/json"},
                            deadline=effective_deadline,
                        )
                    except Exception:
                        payload = None
                    if isinstance(payload, list):
                        normalized_index: dict[str, list[str]] = {}
                        for item in payload:
                            if not isinstance(item, Mapping):
                                continue
                            symbol = str(item.get("symbol") or "").strip().upper()
                            coin_id = str(item.get("id") or "").strip()
                            if symbol and coin_id:
                                normalized_index.setdefault(symbol, []).append(coin_id)
                        if normalized_index:
                            coin_index = {
                                symbol: sorted(set(ids))
                                for symbol, ids in normalized_index.items()
                            }
                            self._cache_put(
                                "source:coingecko-coin-list",
                                coin_index,
                                now=cutoff,
                            )
                if len(missing) > 1 and isinstance(coin_index, Mapping):
                    coin_ids = ",".join(
                        sorted(
                            {
                                str(coin_id)
                                for pair in missing
                                for coin_id in coin_index.get(pair.split("/", 1)[0], [])
                                if str(coin_id)
                            }
                        )
                    )
                start_page = (
                    resume_page
                    if type(resume_page) is int and resume_page >= 1
                    else 1
                )
                if coin_ids != resume_coin_ids:
                    start_page = 1
                    resume_boundary = ""
                if resume_boundary and min(missing) < resume_boundary:
                    start_page = 1
                    resume_boundary = ""
                ticker_rows: list[Mapping[str, Any]] = []
                invalid_pairs: set[str] = set()
                scan_complete = False
                last_page_boundary_pair = resume_boundary
                last_successful_page = start_page - 1
                last_required_pair = max(missing) if missing else ""
                for page in range(start_page, start_page + 20):
                    if self.monotonic() >= effective_deadline:
                        break
                    try:
                        payload = self._read_json(
                            "https://api.coingecko.com/api/v3/exchanges/binance/tickers?"
                            + urlencode(
                                {
                                    "page": page,
                                    "order": "base_target",
                                    **({"coin_ids": coin_ids} if coin_ids else {}),
                                }
                            ),
                            {"Accept": "application/json"},
                            deadline=effective_deadline,
                        )
                    except Exception:
                        break
                    rows = (
                        payload.get("tickers")
                        if isinstance(payload, Mapping)
                        else None
                    )
                    if not isinstance(rows, list):
                        break
                    if not rows:
                        scan_complete = True
                        break
                    page_pairs = [
                        f"{str(item.get('base') or '').strip().upper()}/"
                        f"{str(item.get('target') or '').strip().upper()}"
                        for item in rows
                        if isinstance(item, Mapping)
                        and item.get("base")
                        and item.get("target")
                    ]
                    if (
                        page == start_page
                        and resume_boundary
                        and page_pairs
                        and min(page_pairs) < resume_boundary
                    ):
                        existing.clear()
                        missing = set(required_pairs)
                        resume_boundary = ""
                        last_page_boundary_pair = ""
                        break
                    last_successful_page = page
                    for item in rows:
                        if not isinstance(item, Mapping):
                            continue
                        pair = (
                            f"{str(item.get('base') or '').strip().upper()}/"
                            f"{str(item.get('target') or '').strip().upper()}"
                        )
                        if pair == resume_boundary:
                            continue
                        if _valid_coingecko_ticker_observation(item, cutoff=cutoff):
                            ticker_rows.append(item)
                        elif pair in missing:
                            invalid_pairs.add(pair)
                    if page_pairs:
                        last_page_boundary_pair = max(page_pairs)
                    if (
                        len(rows) < 100
                        or (
                            last_required_pair
                            and page_pairs
                            and max(page_pairs) > last_required_pair
                        )
                    ):
                        scan_complete = True
                        break
                unresolved_pairs = {resume_boundary} & missing
                if not scan_complete and last_page_boundary_pair:
                    unresolved_pairs.add(last_page_boundary_pair)
                    ticker_rows = [
                        item
                        for item in ticker_rows
                        if (
                            f"{str(item.get('base') or '').strip().upper()}/"
                            f"{str(item.get('target') or '').strip().upper()}"
                        )
                        != last_page_boundary_pair
                    ]
                    existing["_nextPage"] = last_successful_page + 1
                    existing["_boundaryPair"] = last_page_boundary_pair
                    if coin_ids:
                        existing["_coinIds"] = coin_ids
                    # ponytail: cursor is process-local; persist only if restarts
                    # measurably prevent public-source coverage from progressing.
                discovered = build_coingecko_binance_mapping(ticker_rows)
                for item in discovered.values():
                    if "observedAt" not in item:
                        item["checkedAt"] = cutoff.isoformat()
                existing.update(discovered)
                for pair in missing - set(discovered):
                    existing[pair] = (
                        {
                            "status": "unresolved",
                            "reason": "source_observation_invalid",
                            "checkedAt": cutoff.isoformat(),
                        }
                        if pair in invalid_pairs
                        else {
                            "status": (
                                "unresolved"
                                if pair in unresolved_pairs or not scan_complete
                                else "missing"
                            ),
                            "checkedAt": cutoff.isoformat(),
                        }
                    )
                observed_times = [
                    value
                    for value in (
                        _parse_datetime(existing.get("_observedAt")),
                        *(
                            _parse_datetime(item.get("last_fetch_at"))
                            for item in ticker_rows
                        ),
                    )
                    if value is not None
                ]
                existing["_observedAt"] = max(observed_times or [cutoff]).isoformat()
                self._cache_put(key, existing, now=cutoff)
                return existing, _coingecko_mapping_incomplete(existing, required_pairs)
