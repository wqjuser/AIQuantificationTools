import json
import unittest
from datetime import datetime, timedelta, timezone
from http.client import HTTPConnection
from http.server import HTTPServer
from threading import Barrier, Thread
from urllib.parse import parse_qs, urlparse


class MarketDiscoveryTest(unittest.TestCase):
    def test_crypto_discovery_builds_binance_usdt_spot_snapshot(self):
        from quant_core.market_discovery import (
            BinanceCryptoMarketDiscoveryService,
            MarketDiscoveryQuery,
        )

        observed_at = datetime(2026, 7, 31, 8, 0, tzinfo=timezone.utc)
        exchange_info = {
            "symbols": [
                {
                    "symbol": "BTCUSDT",
                    "status": "TRADING",
                    "baseAsset": "BTC",
                    "quoteAsset": "USDT",
                    "isSpotTradingAllowed": True,
                },
                {
                    "symbol": "ETHUSDT",
                    "status": "TRADING",
                    "baseAsset": "ETH",
                    "quoteAsset": "USDT",
                    "isSpotTradingAllowed": True,
                },
                {
                    "symbol": "BTCUSDC",
                    "status": "TRADING",
                    "baseAsset": "BTC",
                    "quoteAsset": "USDC",
                    "isSpotTradingAllowed": True,
                },
                {
                    "symbol": "BADUSDT",
                    "status": "BREAK",
                    "baseAsset": "BAD",
                    "quoteAsset": "USDT",
                    "isSpotTradingAllowed": True,
                },
                {
                    "symbol": "MARGINUSDT",
                    "status": "TRADING",
                    "baseAsset": "MARGIN",
                    "quoteAsset": "USDT",
                    "isSpotTradingAllowed": False,
                },
                {
                    "symbol": "NOTICKUSDT",
                    "status": "TRADING",
                    "baseAsset": "NOTICK",
                    "quoteAsset": "USDT",
                    "isSpotTradingAllowed": True,
                },
            ]
        }
        tickers = [
            {
                "symbol": "BTCUSDT",
                "lastPrice": "64000.5",
                "priceChangePercent": "1.5",
                "volume": "12.25",
                "quoteVolume": "784006.125",
            },
            {
                "symbol": "ETHUSDT",
                "lastPrice": "3200",
                "priceChangePercent": "-0.5",
                "volume": "20",
                "quoteVolume": "64000",
            },
            {
                "symbol": "BTCUSDC",
                "lastPrice": "64001",
                "priceChangePercent": "2",
                "volume": "1",
                "quoteVolume": "64001",
            },
        ]

        def fake_fetch_text(url: str, _encoding: str = "utf-8") -> str:
            return json.dumps(
                exchange_info if "/exchangeInfo" in url else tickers
            )

        payload = BinanceCryptoMarketDiscoveryService(
            fetch_text=fake_fetch_text,
            clock=lambda: observed_at,
        ).discover(
            MarketDiscoveryQuery(
                market="crypto",
                query="BTCUSDT",
                min_change_pct=0,
                sort="amount",
                limit=10,
            )
        )

        self.assertEqual(payload["market"], "crypto")
        self.assertEqual(payload["source"], "binance-data-api")
        self.assertEqual(payload["observedAt"], observed_at.isoformat())
        self.assertEqual(payload["freshness"], "fresh")
        self.assertEqual(payload["warnings"], [])
        self.assertEqual(payload["totalMatched"], 1)
        self.assertEqual(
            payload["overview"],
            {
                "universeCount": 2,
                "advancing": 1,
                "declining": 1,
                "flat": 0,
                "totalAmount": 848006.125,
            },
        )
        self.assertEqual(
            payload["items"],
            [
                {
                    "market": "crypto",
                    "symbol": "BTC/USDT",
                    "name": "BTC",
                    "price": 64000.5,
                    "changePct": 1.5,
                    "volume": 12.25,
                    "amount": 784006.125,
                    "turnoverRate": None,
                    "peRatio": None,
                    "pbRatio": None,
                    "marketCap": None,
                    "source": "binance-data-api",
                    "observedAt": observed_at.isoformat(),
                }
            ],
        )
        self.assertEqual(len(payload["snapshotHash"]), 64)

    def test_discovery_builds_overview_and_filtered_candidates_from_one_snapshot(self):
        from quant_core.market_discovery import (
            AshareMarketDiscoveryService,
            MarketDiscoveryQuery,
        )

        observed_at = datetime(2026, 7, 30, 8, 0, tzinfo=timezone.utc)
        upstream_payload = {
            "data": {
                "total": 4,
                "diff": [
                    {
                        "f12": "600000",
                        "f14": "浦发银行",
                        "f2": 10.2,
                        "f3": 1.5,
                        "f5": 100_000,
                        "f6": 2_000_000,
                        "f8": 0.8,
                        "f9": 5.2,
                        "f20": 300_000_000_000,
                        "f23": 0.7,
                    },
                    {
                        "f12": "000001",
                        "f14": "平安银行",
                        "f2": 11.1,
                        "f3": -0.5,
                        "f5": 200_000,
                        "f6": 4_000_000,
                        "f8": 1.2,
                        "f9": 6.5,
                        "f20": 250_000_000_000,
                        "f23": 0.8,
                    },
                    {
                        "f12": "300750",
                        "f14": "宁德时代",
                        "f2": 200,
                        "f3": 0,
                        "f5": 150_000,
                        "f6": 3_000_000,
                        "f8": 2.0,
                        "f9": 22,
                        "f20": 900_000_000_000,
                        "f23": 4.1,
                    },
                    {
                        "f12": "600519",
                        "f14": "贵州茅台",
                        "f2": 1_500,
                        "f3": 3.1,
                        "f5": 20_000,
                        "f6": 1_000_000,
                        "f8": 0.3,
                        "f9": 28,
                        "f20": 2_000_000_000_000,
                        "f23": 8.2,
                    },
                ],
            }
        }
        service = AshareMarketDiscoveryService(
            fetch_text=lambda _url, _encoding="utf-8": json.dumps(upstream_payload),
            clock=lambda: observed_at,
        )

        payload = service.discover(
            MarketDiscoveryQuery(
                min_change_pct=0,
                sort="changePct",
                direction="desc",
                limit=2,
            )
        )

        self.assertEqual(
            payload["overview"],
            {
                "universeCount": 4,
                "advancing": 2,
                "declining": 1,
                "flat": 1,
                "totalAmount": 10_000_000.0,
            },
        )
        self.assertEqual(
            [row["symbol"] for row in payload["items"]],
            ["600519", "600000"],
        )
        self.assertEqual(payload["totalMatched"], 3)
        self.assertEqual(payload["source"], "eastmoney")
        self.assertEqual(payload["observedAt"], observed_at.isoformat())
        self.assertEqual(payload["freshness"], "fresh")
        self.assertEqual(payload["warnings"], [])
        self.assertEqual(len(payload["snapshotHash"]), 64)
        self.assertEqual(
            {
                key: payload["items"][0][key]
                for key in (
                    "volume",
                    "peRatio",
                    "pbRatio",
                    "marketCap",
                    "source",
                    "observedAt",
                )
            },
            {
                "volume": 20_000.0,
                "peRatio": 28.0,
                "pbRatio": 8.2,
                "marketCap": 2_000_000_000_000.0,
                "source": "eastmoney",
                "observedAt": observed_at.isoformat(),
            },
        )

    def test_discovery_fetches_all_eastmoney_pages_before_building_snapshot(self):
        from quant_core.market_discovery import (
            AshareMarketDiscoveryService,
            MarketDiscoveryQuery,
        )

        calls: list[dict[str, list[str]]] = []

        def fake_fetch_text(url: str, _encoding: str = "utf-8") -> str:
            query = parse_qs(urlparse(url).query)
            calls.append(query)
            page = int(query["pn"][0])
            rows = (
                [
                    {
                        "f12": "600000",
                        "f14": "浦发银行",
                        "f2": 10,
                        "f3": 1,
                        "f5": 10,
                        "f6": 100,
                        "f8": 1,
                        "f9": 5,
                        "f20": 1_000,
                        "f23": 1,
                    },
                    {
                        "f12": "000001",
                        "f14": "平安银行",
                        "f2": 11,
                        "f3": -1,
                        "f5": 20,
                        "f6": 200,
                        "f8": 2,
                        "f9": 6,
                        "f20": 2_000,
                        "f23": 2,
                    },
                ]
                if page == 1
                else [
                    {
                        "f12": "300750",
                        "f14": "宁德时代",
                        "f2": 200,
                        "f3": 0,
                        "f5": 30,
                        "f6": 300,
                        "f8": 3,
                        "f9": 20,
                        "f20": 3_000,
                        "f23": 3,
                    }
                ]
            )
            return json.dumps({"data": {"total": 101, "diff": rows}})

        payload = AshareMarketDiscoveryService(fetch_text=fake_fetch_text).discover(
            MarketDiscoveryQuery()
        )

        self.assertEqual([query["pn"][0] for query in calls], ["1", "2"])
        self.assertTrue(all(query["pz"] == ["100"] for query in calls))
        self.assertEqual(payload["overview"]["universeCount"], 3)
        self.assertEqual(
            {row["symbol"] for row in payload["items"]},
            {"600000", "000001", "300750"},
        )

    def test_market_discovery_api_routes_crypto_to_binance(self):
        from quant_core.api import QuantApiHandler
        from quant_core.market_discovery import (
            AshareMarketDiscoveryService,
            BinanceCryptoMarketDiscoveryService,
            MarketDiscoveryService,
        )

        exchange_info = {
            "symbols": [
                {
                    "symbol": "ETHUSDT",
                    "status": "TRADING",
                    "baseAsset": "ETH",
                    "quoteAsset": "USDT",
                    "isSpotTradingAllowed": True,
                }
            ]
        }
        tickers = [
            {
                "symbol": "ETHUSDT",
                "lastPrice": "3200",
                "priceChangePercent": "2",
                "volume": "20",
                "quoteVolume": "64000",
            }
        ]

        def fake_binance_fetch(url: str, _encoding: str = "utf-8") -> str:
            return json.dumps(
                exchange_info if "/exchangeInfo" in url else tickers
            )

        class TestHandler(QuantApiHandler):
            market_discovery_service = MarketDiscoveryService(
                ashare_service=AshareMarketDiscoveryService(
                    fetch_text=lambda _url, _encoding="utf-8": (
                        _ for _ in ()
                    ).throw(AssertionError("crypto request used A-share service"))
                ),
                crypto_service=BinanceCryptoMarketDiscoveryService(
                    fetch_text=fake_binance_fetch,
                ),
            )

        server = HTTPServer(("127.0.0.1", 0), TestHandler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        connection = HTTPConnection(
            server.server_address[0],
            server.server_address[1],
            timeout=5,
        )
        try:
            connection.request(
                "GET",
                "/api/market/discovery"
                "?market=crypto&minChangePct=0&sort=amount&limit=10",
            )
            response = connection.getresponse()
            payload = json.loads(response.read().decode("utf-8"))
        finally:
            connection.close()
            server.shutdown()
            thread.join(timeout=5)
            server.server_close()

        self.assertEqual(response.status, 200)
        self.assertEqual(payload["market"], "crypto")
        self.assertEqual(payload["items"][0]["symbol"], "ETH/USDT")
        self.assertEqual(payload["source"], "binance-data-api")

    def test_market_discovery_api_applies_the_complete_read_query(self):
        from quant_core.api import QuantApiHandler
        from quant_core.market_discovery import AshareMarketDiscoveryService

        upstream_payload = {
            "data": {
                "total": 2,
                "diff": [
                    {
                        "f12": "600000",
                        "f14": "浦发银行",
                        "f2": 10,
                        "f3": 1,
                        "f5": 10,
                        "f6": 1_000,
                        "f8": 1,
                        "f9": 5,
                        "f20": 1_000,
                        "f23": 1,
                    },
                    {
                        "f12": "000001",
                        "f14": "平安银行",
                        "f2": 11,
                        "f3": -1,
                        "f5": 20,
                        "f6": 2_000,
                        "f8": 2,
                        "f9": 6,
                        "f20": 2_000,
                        "f23": 2,
                    },
                ],
            }
        }

        class TestHandler(QuantApiHandler):
            market_discovery_service = AshareMarketDiscoveryService(
                fetch_text=lambda _url, _encoding="utf-8": json.dumps(
                    upstream_payload
                ),
                clock=lambda: datetime(
                    2026, 7, 30, 8, 0, tzinfo=timezone.utc
                ),
            )

        server = HTTPServer(("127.0.0.1", 0), TestHandler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        connection = HTTPConnection(
            server.server_address[0],
            server.server_address[1],
            timeout=5,
        )
        try:
            connection.request(
                "GET",
                "/api/market/discovery"
                "?market=ashare"
                "&query=%E9%93%B6%E8%A1%8C"
                "&minChangePct=0"
                "&maxChangePct=2"
                "&minAmount=100"
                "&minTurnoverRate=0.5"
                "&maxPe=10"
                "&sort=amount"
                "&direction=desc"
                "&limit=1",
            )
            response = connection.getresponse()
            payload = json.loads(response.read().decode("utf-8"))
        finally:
            connection.close()
            server.shutdown()
            thread.join(timeout=5)
            server.server_close()

        self.assertEqual(response.status, 200)
        self.assertEqual(payload["totalMatched"], 1)
        self.assertEqual(payload["items"][0]["symbol"], "600000")
        self.assertEqual(payload["source"], "eastmoney")

    def test_discovery_reuses_the_successful_snapshot_for_five_minutes(self):
        from quant_core.market_discovery import (
            AshareMarketDiscoveryService,
            MarketDiscoveryQuery,
        )

        current_time = [datetime(2026, 7, 30, 8, 0, tzinfo=timezone.utc)]
        fetch_count = 0

        def fake_fetch_text(_url: str, _encoding: str = "utf-8") -> str:
            nonlocal fetch_count
            fetch_count += 1
            return json.dumps(
                {
                    "data": {
                        "total": 1,
                        "diff": [
                            {
                                "f12": "600000",
                                "f14": "浦发银行",
                                "f2": 10,
                                "f3": 1,
                                "f5": 10,
                                "f6": 100,
                                "f8": 1,
                                "f9": 5,
                                "f20": 1_000,
                                "f23": 1,
                            }
                        ],
                    }
                }
            )

        service = AshareMarketDiscoveryService(
            fetch_text=fake_fetch_text,
            fetch_akshare_spot=lambda: (_ for _ in ()).throw(
                OSError("akshare offline")
            ),
            clock=lambda: current_time[0],
        )
        first = service.discover(MarketDiscoveryQuery())
        current_time[0] += timedelta(seconds=299)
        second = service.discover(MarketDiscoveryQuery(query="浦发"))

        self.assertEqual(fetch_count, 1)
        self.assertEqual(second["snapshotHash"], first["snapshotHash"])
        self.assertEqual(second["observedAt"], first["observedAt"])
        self.assertEqual(second["freshness"], "fresh")

    def test_crypto_discovery_caches_and_falls_back_to_the_complete_snapshot(self):
        from quant_core.market_discovery import (
            BinanceCryptoMarketDiscoveryService,
            MarketDiscoveryQuery,
        )

        current_time = [datetime(2026, 7, 31, 8, 0, tzinfo=timezone.utc)]
        calls = 0
        exchange_info = {
            "symbols": [{
                "symbol": "BTCUSDT",
                "status": "TRADING",
                "baseAsset": "BTC",
                "quoteAsset": "USDT",
                "isSpotTradingAllowed": True,
            }]
        }
        tickers = [{
            "symbol": "BTCUSDT",
            "lastPrice": "64000",
            "priceChangePercent": "1",
            "volume": "10",
            "quoteVolume": "640000",
        }]

        def fake_fetch_text(url: str, _encoding: str = "utf-8") -> str:
            nonlocal calls
            calls += 1
            if calls > 2:
                raise OSError("binance offline")
            return json.dumps(
                exchange_info if "/exchangeInfo" in url else tickers
            )

        service = BinanceCryptoMarketDiscoveryService(
            fetch_text=fake_fetch_text,
            clock=lambda: current_time[0],
        )
        first = service.discover(MarketDiscoveryQuery(market="crypto"))
        current_time[0] += timedelta(seconds=299)
        cached = service.discover(MarketDiscoveryQuery(market="crypto"))
        current_time[0] += timedelta(seconds=2)
        stale = service.discover(MarketDiscoveryQuery(market="crypto"))
        stale_during_retry_cooldown = service.discover(
            MarketDiscoveryQuery(market="crypto")
        )

        self.assertEqual(calls, 3)
        self.assertEqual(cached["freshness"], "fresh")
        self.assertEqual(stale["freshness"], "stale")
        self.assertEqual(stale_during_retry_cooldown["freshness"], "stale")
        self.assertEqual(stale["snapshotHash"], first["snapshotHash"])
        self.assertEqual(stale["observedAt"], first["observedAt"])
        self.assertEqual(
            stale["warnings"],
            ["Binance 行情刷新失败，已使用最近一次成功快照。"],
        )
        current_time[0] += timedelta(seconds=31)
        retried_stale = service.discover(MarketDiscoveryQuery(market="crypto"))
        self.assertEqual(calls, 4)
        self.assertEqual(retried_stale["snapshotHash"], first["snapshotHash"])

    def test_discovery_uses_the_last_successful_snapshot_when_refresh_fails(self):
        from quant_core.market_discovery import (
            AshareMarketDiscoveryService,
            MarketDiscoveryQuery,
        )

        current_time = [datetime(2026, 7, 30, 8, 0, tzinfo=timezone.utc)]
        responses = [
            json.dumps(
                {
                    "data": {
                        "total": 1,
                        "diff": [
                            {
                                "f12": "600000",
                                "f14": "浦发银行",
                                "f2": 10,
                                "f3": 1,
                                "f5": 10,
                                "f6": 100,
                                "f8": 1,
                                "f9": 5,
                                "f20": 1_000,
                                "f23": 1,
                            }
                        ],
                    }
                }
            )
        ]

        def fake_fetch_text(_url: str, _encoding: str = "utf-8") -> str:
            if responses:
                return responses.pop()
            raise OSError("offline")

        service = AshareMarketDiscoveryService(
            fetch_text=fake_fetch_text,
            fetch_akshare_spot=lambda: (_ for _ in ()).throw(
                OSError("akshare offline")
            ),
            clock=lambda: current_time[0],
        )
        first = service.discover(MarketDiscoveryQuery())
        current_time[0] += timedelta(seconds=301)
        stale = service.discover(MarketDiscoveryQuery())

        self.assertEqual(stale["freshness"], "stale")
        self.assertEqual(stale["snapshotHash"], first["snapshotHash"])
        self.assertEqual(stale["observedAt"], first["observedAt"])
        self.assertEqual(stale["items"], first["items"])
        self.assertEqual(
            stale["warnings"],
            ["市场快照刷新失败，已使用最近一次成功快照。"],
        )

    def test_ashare_discovery_uses_the_reachable_eastmoney_host_before_akshare(self):
        from quant_core.market_discovery import (
            AshareMarketDiscoveryService,
            MarketDiscoveryQuery,
        )

        requested_urls = []

        def fake_fetch_text(url: str, _encoding: str = "utf-8") -> str:
            requested_urls.append(url)
            if "push2.eastmoney.com" in url:
                raise OSError("primary host unavailable")
            return json.dumps({
                "data": {
                    "total": 1,
                    "diff": [{
                        "f12": "600000",
                        "f14": "浦发银行",
                        "f2": 10,
                        "f3": 1,
                        "f5": 10,
                        "f6": 100,
                        "f8": 1,
                        "f9": 5,
                        "f20": 1_000,
                        "f23": 1,
                    }],
                }
            })

        payload = AshareMarketDiscoveryService(
            fetch_text=fake_fetch_text,
            fetch_akshare_spot=lambda: (_ for _ in ()).throw(
                AssertionError("reachable Eastmoney fallback must avoid AkShare")
            ),
        ).discover(MarketDiscoveryQuery())

        self.assertEqual(payload["source"], "eastmoney")
        self.assertEqual(payload["overview"]["universeCount"], 1)
        self.assertEqual(len(requested_urls), 2)
        self.assertIn("push2.eastmoney.com", requested_urls[0])
        self.assertIn("push2delay.eastmoney.com", requested_urls[1])

    def test_ashare_discovery_fetches_snapshot_pages_concurrently(self):
        from quant_core.market_discovery import (
            AshareMarketDiscoveryService,
            MarketDiscoveryQuery,
        )

        page_barrier = Barrier(2)

        def fake_fetch_text(url: str, _encoding: str = "utf-8") -> str:
            page = int(parse_qs(urlparse(url).query)["pn"][0])
            if page > 1:
                page_barrier.wait(timeout=0.5)
            return json.dumps({
                "data": {
                    "total": 201,
                    "diff": [{
                        "f12": f"60000{page}",
                        "f14": f"测试股票 {page}",
                        "f2": 10,
                        "f3": page,
                        "f5": 10,
                        "f6": 100,
                        "f8": 1,
                        "f9": 5,
                        "f20": 1_000,
                        "f23": 1,
                    }],
                }
            })

        payload = AshareMarketDiscoveryService(
            fetch_text=fake_fetch_text,
            fetch_akshare_spot=lambda: (_ for _ in ()).throw(
                AssertionError("concurrent Eastmoney paging must avoid AkShare")
            ),
        ).discover(MarketDiscoveryQuery())

        self.assertEqual(payload["overview"]["universeCount"], 3)

    def test_ashare_discovery_retries_the_complete_snapshot_on_the_fallback_host(self):
        from quant_core.market_discovery import (
            AshareMarketDiscoveryService,
            MarketDiscoveryQuery,
        )

        requested_urls = []

        def fake_fetch_text(url: str, _encoding: str = "utf-8") -> str:
            requested_urls.append(url)
            page = int(parse_qs(urlparse(url).query)["pn"][0])
            if "push2.eastmoney.com" in url and page > 1:
                raise OSError("primary host dropped a later page")
            return json.dumps({
                "data": {
                    "total": 101,
                    "diff": [{
                        "f12": f"60000{page}",
                        "f14": f"测试股票 {page}",
                        "f2": 10,
                        "f3": page,
                        "f5": 10,
                        "f6": 100,
                        "f8": 1,
                        "f9": 5,
                        "f20": 1_000,
                        "f23": 1,
                    }],
                }
            })

        payload = AshareMarketDiscoveryService(
            fetch_text=fake_fetch_text,
            fetch_akshare_spot=lambda: (_ for _ in ()).throw(
                AssertionError("complete fallback retry must avoid AkShare")
            ),
        ).discover(MarketDiscoveryQuery())

        self.assertEqual(payload["overview"]["universeCount"], 2)
        self.assertTrue(any("push2delay.eastmoney.com" in url for url in requested_urls))

    def test_expired_akshare_snapshot_is_refreshed_before_stale_fallback(self):
        from quant_core.market_discovery import (
            AshareMarketDiscoveryService,
            MarketDiscoveryQuery,
        )

        current_time = [datetime(2026, 7, 30, 8, 0, tzinfo=timezone.utc)]
        prices = [10, 11]
        akshare_calls = 0

        def fake_akshare_spot() -> list[dict[str, object]]:
            nonlocal akshare_calls
            price = prices[akshare_calls]
            akshare_calls += 1
            return [
                {
                    "代码": "sz000001",
                    "名称": "平安银行",
                    "最新价": price,
                    "涨跌幅": 1,
                    "成交量": 10,
                    "成交额": 100,
                }
            ]

        service = AshareMarketDiscoveryService(
            fetch_text=lambda _url, _encoding="utf-8": (_ for _ in ()).throw(
                OSError("eastmoney offline")
            ),
            fetch_akshare_spot=fake_akshare_spot,
            clock=lambda: current_time[0],
        )
        first = service.discover(MarketDiscoveryQuery())
        current_time[0] += timedelta(seconds=301)
        refreshed = service.discover(MarketDiscoveryQuery())

        self.assertEqual(akshare_calls, 2)
        self.assertEqual(refreshed["freshness"], "fresh")
        self.assertEqual(refreshed["source"], "akshare-sina")
        self.assertEqual(refreshed["items"][0]["price"], 11.0)
        self.assertNotEqual(refreshed["snapshotHash"], first["snapshotHash"])
        self.assertNotEqual(refreshed["observedAt"], first["observedAt"])

    def test_discovery_falls_back_to_real_akshare_rows_without_fake_fields(self):
        from quant_core.market_discovery import (
            AshareMarketDiscoveryService,
            MarketDiscoveryQuery,
        )

        service = AshareMarketDiscoveryService(
            fetch_text=lambda _url, _encoding="utf-8": (_ for _ in ()).throw(
                OSError("eastmoney offline")
            ),
            fetch_akshare_spot=lambda: [
                {
                    "代码": "sh600000",
                    "名称": "浦发银行",
                    "最新价": 10,
                    "涨跌幅": 1,
                    "成交量": 10,
                    "成交额": 100,
                }
            ],
            clock=lambda: datetime(2026, 7, 30, 8, 0, tzinfo=timezone.utc),
        )

        payload = service.discover(MarketDiscoveryQuery())

        self.assertEqual(payload["source"], "akshare-sina")
        self.assertEqual(payload["freshness"], "fresh")
        self.assertEqual(payload["overview"]["universeCount"], 1)
        self.assertEqual(payload["items"][0]["symbol"], "600000")
        self.assertEqual(
            {
                field: payload["items"][0][field]
                for field in ("turnoverRate", "peRatio", "pbRatio", "marketCap")
            },
            {
                "turnoverRate": None,
                "peRatio": None,
                "pbRatio": None,
                "marketCap": None,
            },
        )
        self.assertEqual(
            payload["warnings"],
            [
                "东方财富市场快照不可用，已降级使用 AkShare 新浪实时行情；"
                "换手率、估值和市值暂缺。"
            ],
        )

    def test_nullable_sort_values_always_appear_after_available_values(self):
        from quant_core.market_discovery import (
            AshareMarketDiscoveryService,
            MarketDiscoveryQuery,
        )

        upstream_payload = {
            "data": {
                "total": 2,
                "diff": [
                    {
                        "f12": "600000",
                        "f14": "浦发银行",
                        "f2": 10,
                        "f3": 1,
                        "f5": 10,
                        "f6": 100,
                        "f8": 1,
                        "f9": 5,
                        "f20": 1_000,
                        "f23": 1,
                    },
                    {
                        "f12": "000001",
                        "f14": "平安银行",
                        "f2": 11,
                        "f3": -1,
                        "f5": 20,
                        "f6": 200,
                        "f8": 2,
                        "f9": "-",
                        "f20": "-",
                        "f23": "-",
                    },
                ],
            }
        }

        for direction in ("asc", "desc"):
            with self.subTest(direction=direction):
                payload = AshareMarketDiscoveryService(
                    fetch_text=lambda _url, _encoding="utf-8": json.dumps(
                        upstream_payload
                    )
                ).discover(
                    MarketDiscoveryQuery(
                        sort="peRatio",
                        direction=direction,
                        limit=2,
                    )
                )
                self.assertEqual(
                    [row["symbol"] for row in payload["items"]],
                    ["600000", "000001"],
                )

    def test_market_discovery_api_returns_structured_502_when_all_sources_fail(self):
        from quant_core.api import QuantApiHandler
        from quant_core.market_discovery import AshareMarketDiscoveryService

        class TestHandler(QuantApiHandler):
            market_discovery_service = AshareMarketDiscoveryService(
                fetch_text=lambda _url, _encoding="utf-8": (_ for _ in ()).throw(
                    OSError("eastmoney offline")
                ),
                fetch_akshare_spot=lambda: (_ for _ in ()).throw(
                    OSError("akshare offline")
                ),
            )

        server = HTTPServer(("127.0.0.1", 0), TestHandler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        connection = HTTPConnection(
            server.server_address[0],
            server.server_address[1],
            timeout=5,
        )
        try:
            connection.request(
                "GET",
                "/api/market/discovery?market=ashare",
            )
            response = connection.getresponse()
            payload = json.loads(response.read().decode("utf-8"))
        finally:
            connection.close()
            server.shutdown()
            thread.join(timeout=5)
            server.server_close()

        self.assertEqual(response.status, 502)
        self.assertEqual(
            payload,
            {
                "error": "market_discovery_unavailable",
                "detail": "A 股市场快照上游当前不可用。",
            },
        )

    def test_market_discovery_api_rejects_unsupported_markets_and_parameters(self):
        from quant_core.api import QuantApiHandler
        from quant_core.market_discovery import AshareMarketDiscoveryService

        class TestHandler(QuantApiHandler):
            market_discovery_service = AshareMarketDiscoveryService(
                fetch_text=lambda _url, _encoding="utf-8": (_ for _ in ()).throw(
                    AssertionError("invalid input must be rejected before fetching")
                ),
                fetch_akshare_spot=lambda: (_ for _ in ()).throw(
                    AssertionError("invalid input must be rejected before fallback")
                ),
            )

        server = HTTPServer(("127.0.0.1", 0), TestHandler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            for query in (
                "market=us",
                "market=ashare&unexpected=1",
                "market=ashare&sort=symbol",
                "market=ashare&direction=sideways",
                "market=ashare&limit=101",
                "market=ashare&minAmount=-1",
                "market=ashare&minChangePct=2&maxChangePct=1",
                "market=crypto&minTurnoverRate=1",
                "market=crypto&maxPe=20",
                "market=crypto&sort=marketCap",
            ):
                with self.subTest(query=query):
                    connection = HTTPConnection(
                        server.server_address[0],
                        server.server_address[1],
                        timeout=5,
                    )
                    try:
                        connection.request(
                            "GET",
                            f"/api/market/discovery?{query}",
                        )
                        response = connection.getresponse()
                        payload = json.loads(response.read().decode("utf-8"))
                    finally:
                        connection.close()
                    self.assertEqual(response.status, 400)
                    self.assertEqual(
                        payload["error"],
                        "invalid_market_discovery_query",
                    )
        finally:
            server.shutdown()
            thread.join(timeout=5)
            server.server_close()


if __name__ == "__main__":
    unittest.main()
