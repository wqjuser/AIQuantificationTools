import json
import tempfile
import unittest
from datetime import datetime, timezone
from http.client import HTTPConnection
from http.server import HTTPServer
from pathlib import Path
from threading import Thread
from unittest.mock import patch


class MarketInformationTest(unittest.TestCase):
    def test_finnhub_fetch_uses_header_instead_of_query_token(self):
        from quant_core.market_information import default_fetch_finnhub_text

        requests = []

        class Response:
            def __enter__(self):
                return self

            def __exit__(self, *_args):
                return None

            @staticmethod
            def read():
                return b"[]"

        def fake_urlopen(request, *, timeout):
            requests.append((request, timeout))
            return Response()

        with patch(
            "quant_core.market_information.urlopen",
            side_effect=fake_urlopen,
        ):
            payload = default_fetch_finnhub_text(
                "https://finnhub.io/api/v1/news?category=general",
                "configured-secret",
            )

        request, timeout = requests[0]
        self.assertEqual(payload, "[]")
        self.assertEqual(timeout, 10)
        self.assertEqual(
            request.get_header("X-finnhub-token"),
            "configured-secret",
        )
        self.assertNotIn("configured-secret", request.full_url)
        self.assertNotIn("token=", request.full_url)

    def test_ashare_information_combines_market_breadth_and_news_links(self):
        from quant_core.market_information import (
            MarketInformationQuery,
            MarketInformationService,
        )

        class FakeDiscoveryService:
            def discover(self, query):
                items = [{
                    "market": "ashare",
                    "symbol": "600000" if query.sort == "changePct" else "601318",
                    "name": "浦发银行" if query.sort == "changePct" else "中国平安",
                    "price": 10.25,
                    "changePct": 2.5,
                    "volume": 1_000,
                    "amount": 2_000_000,
                    "turnoverRate": 1.2,
                    "peRatio": 6.5,
                    "pbRatio": 0.8,
                    "marketCap": 200_000_000_000,
                    "source": "eastmoney",
                    "observedAt": "2026-07-31T01:00:00+00:00",
                }]
                return {
                    "market": "ashare",
                    "overview": {
                        "universeCount": 5_432,
                        "advancing": 3_100,
                        "declining": 2_100,
                        "flat": 232,
                        "totalAmount": 980_000_000_000,
                    },
                    "items": items,
                    "source": "eastmoney",
                    "observedAt": "2026-07-31T01:00:00+00:00",
                    "freshness": "fresh",
                    "warnings": [],
                    "snapshotHash": "a" * 64,
                }

        search_urls = []

        def fake_fetch_text(url: str, _encoding: str = "utf-8") -> str:
            if "getFastNewsList" in url:
                return json.dumps({
                    "data": {
                        "fastNewsList": [{
                            "code": "202607311234567890",
                            "title": "A 股早盘重要快讯",
                            "summary": "市场成交活跃。",
                            "showTime": "2026-07-31 09:00:00",
                            "stockList": [],
                            "image": "",
                        }, {
                            "code": "202607311234567891",
                            "title": "第二条市场快讯",
                            "summary": "用于验证个股新闻不会被挤出。",
                            "showTime": "2026-07-31 08:59:00",
                            "stockList": [],
                            "image": "",
                        }]
                    }
                })
            if "search/jsonp" in url:
                search_urls.append(url)
                return "aiqt(" + json.dumps({
                    "result": {
                        "cmsArticleWebOld": [{
                            "code": "202607311111111111",
                            "title": "<em>浦发银行</em>发布公告",
                            "content": "只保留简短摘要，不保存文章全文。",
                            "date": "2026-07-31 08:30:00",
                            "mediaName": "证券时报",
                            "url": "https://finance.eastmoney.com/a/202607311111111111.html",
                            "image": "",
                        }]
                    }
                }, ensure_ascii=False) + ")"
            raise AssertionError(f"unexpected upstream: {url}")

        payload = MarketInformationService(
            market_discovery_service=FakeDiscoveryService(),
            fetch_text=fake_fetch_text,
            clock=lambda: datetime(2026, 7, 31, 1, 5, tzinfo=timezone.utc),
        ).read(
            MarketInformationQuery(
                market="ashare",
                symbol="600000",
                name="浦发银行",
                limit=2,
            )
        )

        self.assertEqual(payload["market"], "ashare")
        self.assertEqual(payload["symbol"], "600000")
        self.assertEqual(payload["section"], "all")
        self.assertEqual(payload["overview"]["universeCount"], 5_432)
        self.assertEqual(payload["leaders"][0]["symbol"], "600000")
        self.assertEqual(payload["active"][0]["symbol"], "601318")
        self.assertEqual(
            [item["headline"] for item in payload["news"]],
            ["A 股早盘重要快讯", "浦发银行发布公告"],
        )
        self.assertEqual(payload["news"][0]["source"], "东方财富")
        self.assertEqual(payload["news"][1]["scope"], "instrument")
        self.assertEqual(
            payload["news"][1]["url"],
            "https://finance.eastmoney.com/a/202607311111111111.html",
        )
        self.assertTrue(all("image" not in item for item in payload["news"]))
        self.assertNotIn("<em>", json.dumps(payload, ensure_ascii=False))
        self.assertEqual(payload["freshness"], "fresh")
        self.assertEqual(payload["warnings"], [])
        self.assertEqual(len(payload["snapshotHash"]), 64)
        self.assertIn(
            "%E6%B5%A6%E5%8F%91%E9%93%B6%E8%A1%8C",
            search_urls[0],
        )

    def test_ashare_information_cache_separates_names_for_the_same_symbol(self):
        from quant_core.market_information import (
            MarketInformationQuery,
            MarketInformationService,
        )

        class FakeDiscoveryService:
            def discover(self, _query):
                return {
                    "market": "ashare",
                    "overview": {
                        "universeCount": 1,
                        "advancing": 1,
                        "declining": 0,
                        "flat": 0,
                        "totalAmount": 100,
                    },
                    "items": [],
                    "source": "eastmoney",
                    "freshness": "fresh",
                    "warnings": [],
                }

        search_urls = []

        def fake_fetch_text(url: str, _encoding: str = "utf-8") -> str:
            if "getFastNewsList" in url:
                return json.dumps({"data": {"fastNewsList": []}})
            search_urls.append(url)
            return 'aiqt({"result":{"cmsArticleWebOld":[]}})'

        service = MarketInformationService(
            market_discovery_service=FakeDiscoveryService(),
            fetch_text=fake_fetch_text,
            clock=lambda: datetime(2026, 7, 31, 1, 5, tzinfo=timezone.utc),
        )
        service.read(MarketInformationQuery(
            market="ashare",
            symbol="600000",
            name="浦发银行",
        ))
        service.read(MarketInformationQuery(
            market="ashare",
            symbol="600000",
            name="平安银行",
        ))

        self.assertEqual(len(search_urls), 2)
        self.assertIn(
            "%E6%B5%A6%E5%8F%91%E9%93%B6%E8%A1%8C",
            search_urls[0],
        )
        self.assertIn(
            "%E5%B9%B3%E5%AE%89%E9%93%B6%E8%A1%8C",
            search_urls[1],
        )

    def test_news_section_skips_discovery_and_has_its_own_cache_entry(self):
        from quant_core.market_information import (
            MarketInformationQuery,
            MarketInformationService,
        )

        discovery_calls = []

        class FakeDiscoveryService:
            def discover(self, query):
                discovery_calls.append(query.sort)
                return {
                    "market": "ashare",
                    "overview": {
                        "universeCount": 5_432,
                        "advancing": 3_100,
                        "declining": 2_100,
                        "flat": 232,
                        "totalAmount": 980_000_000_000,
                    },
                    "items": [],
                    "source": "eastmoney",
                    "freshness": "fresh",
                    "warnings": [],
                }

        def fake_fetch_text(url: str, _encoding: str = "utf-8") -> str:
            if "getFastNewsList" in url:
                return json.dumps({
                    "data": {
                        "fastNewsList": [{
                            "code": "202607311234567890",
                            "title": "A 股早盘重要快讯",
                            "summary": "市场成交活跃。",
                            "showTime": "2026-07-31 09:00:00",
                            "stockList": [],
                        }]
                    }
                })
            raise AssertionError(f"unexpected upstream: {url}")

        service = MarketInformationService(
            market_discovery_service=FakeDiscoveryService(),
            fetch_text=fake_fetch_text,
            clock=lambda: datetime(2026, 7, 31, 1, 5, tzinfo=timezone.utc),
        )
        news = service.read(MarketInformationQuery(
            market="ashare",
            limit=50,
            section="news",
        ))
        full = service.read(MarketInformationQuery(
            market="ashare",
            limit=50,
        ))

        self.assertEqual(news["section"], "news")
        self.assertEqual(news["overview"]["universeCount"], 0)
        self.assertEqual(news["leaders"], [])
        self.assertEqual(news["active"], [])
        self.assertEqual(len(news["news"]), 1)
        self.assertEqual(full["section"], "all")
        self.assertEqual(full["overview"]["universeCount"], 5_432)
        self.assertEqual(discovery_calls, ["changePct", "amount"])

    def test_news_pages_are_sliced_by_the_backend_and_report_more_rows(self):
        from quant_core.market_information import (
            MarketInformationQuery,
            MarketInformationService,
        )

        requested_urls = []

        def fake_fetch_text(url: str, _encoding: str = "utf-8") -> str:
            requested_urls.append(url)
            return json.dumps({
                "data": {
                    "sortEnd": "older-cursor",
                    "total": 10,
                    "fastNewsList": [
                        {
                            "code": f"20260731123456789{index}",
                            "title": f"市场快讯 {index}",
                            "summary": "",
                            "showTime": f"2026-07-31 09:0{index}:00",
                        }
                        for index in range(5)
                    ],
                }
            })

        payload = MarketInformationService(
            fetch_text=fake_fetch_text,
            clock=lambda: datetime(2026, 7, 31, 1, 5, tzinfo=timezone.utc),
        ).read(MarketInformationQuery(
            market="ashare",
            limit=2,
            offset=2,
            section="news",
            scope="market",
        ))

        self.assertEqual(
            [item["headline"] for item in payload["news"]],
            ["市场快讯 2", "市场快讯 3"],
        )
        self.assertEqual(payload["pagination"], {
            "limit": 2,
            "offset": 2,
            "hasMore": True,
            "scope": "market",
        })
        self.assertIn("pageSize=5", requested_urls[0])
        self.assertNotIn("search/jsonp", requested_urls[0])

    def test_instrument_scope_is_filtered_before_backend_pagination(self):
        from quant_core.market_information import (
            MarketInformationQuery,
            MarketInformationService,
        )

        requested_urls = []

        def fake_fetch_text(url: str, _encoding: str = "utf-8") -> str:
            requested_urls.append(url)
            return "aiqt(" + json.dumps({
                "hitsTotal": 4,
                "result": {
                    "cmsArticleWebOld": [
                        {
                            "code": f"20260731111111111{index}",
                            "title": f"<em>浦发银行</em>资讯 {index}",
                            "content": "",
                            "date": f"2026-07-31 08:0{index}:00",
                            "mediaName": "证券时报",
                            "url": f"https://finance.eastmoney.com/a/{index}.html",
                        }
                        for index in range(3)
                    ]
                },
            }, ensure_ascii=False) + ")"

        payload = MarketInformationService(
            fetch_text=fake_fetch_text,
            clock=lambda: datetime(2026, 7, 31, 1, 5, tzinfo=timezone.utc),
        ).read(MarketInformationQuery(
            market="ashare",
            symbol="600000",
            name="浦发银行",
            limit=1,
            offset=1,
            section="news",
            scope="instrument",
        ))

        self.assertEqual(payload["news"][0]["headline"], "浦发银行资讯 1")
        self.assertEqual(payload["news"][0]["scope"], "instrument")
        self.assertTrue(payload["pagination"]["hasMore"])
        self.assertEqual(len(requested_urls), 1)
        self.assertIn("search/jsonp", requested_urls[0])

    def test_market_information_query_removes_control_characters_from_name(self):
        from quant_core.market_information import (
            market_information_query_from_params,
        )

        query = market_information_query_from_params({
            "market": ["ashare"],
            "symbol": ["600000"],
            "name": ["浦发\n银\u0000行"],
            "offset": ["20"],
            "section": ["news"],
            "scope": ["instrument"],
        })

        self.assertEqual(query.name, "浦发银行")
        self.assertEqual(query.offset, 20)
        self.assertEqual(query.section, "news")
        self.assertEqual(query.scope, "instrument")

    def test_crypto_information_uses_binance_breadth_and_finnhub_news_without_token_in_url(self):
        from quant_core.market_information import (
            MarketInformationQuery,
            MarketInformationService,
        )

        class FakeDiscoveryService:
            def discover(self, query):
                return {
                    "market": "crypto",
                    "overview": {
                        "universeCount": 480,
                        "advancing": 300,
                        "declining": 170,
                        "flat": 10,
                        "totalAmount": 12_000_000_000,
                    },
                    "items": [{
                        "market": "crypto",
                        "symbol": "BTC/USDT",
                        "name": "BTC",
                        "price": 64_000,
                        "changePct": 1.25,
                        "volume": 1_000,
                        "amount": 64_000_000,
                        "turnoverRate": None,
                        "peRatio": None,
                        "pbRatio": None,
                        "marketCap": None,
                        "source": "binance-data-api",
                        "observedAt": "2026-07-31T01:00:00+00:00",
                    }],
                    "source": "binance-data-api",
                    "observedAt": "2026-07-31T01:00:00+00:00",
                    "freshness": "fresh",
                    "warnings": [],
                    "snapshotHash": "b" * 64,
                }

        calls = []

        def fake_fetch_finnhub_text(url: str, api_key: str) -> str:
            calls.append((url, api_key))
            return json.dumps([{
                "id": 42,
                "headline": "Bitcoin market update",
                "summary": "Crypto market summary.",
                "datetime": 1785463200,
                "source": "Reuters",
                "url": "https://example.com/bitcoin",
                "image": "",
            }])

        payload = MarketInformationService(
            market_discovery_service=FakeDiscoveryService(),
            finnhub_api_key="configured-secret",
            fetch_finnhub_text=fake_fetch_finnhub_text,
            clock=lambda: datetime(2026, 7, 31, 2, 0, tzinfo=timezone.utc),
        ).read(MarketInformationQuery(market="crypto", symbol="BTC/USDT"))

        self.assertEqual(payload["overview"]["universeCount"], 480)
        self.assertEqual(payload["leaders"][0]["symbol"], "BTC/USDT")
        self.assertEqual(payload["news"][0]["headline"], "Bitcoin market update")
        self.assertEqual(payload["news"][0]["scope"], "market")
        self.assertEqual(calls[0][1], "configured-secret")
        self.assertNotIn("configured-secret", calls[0][0])
        self.assertNotIn("token=", calls[0][0])

    def test_us_information_combines_general_and_company_news(self):
        from quant_core.market_information import (
            MarketInformationQuery,
            MarketInformationService,
        )

        class RejectDiscoveryService:
            def discover(self, _query):
                raise AssertionError("US information must not use unsupported discovery")

        calls = []

        def fake_fetch_finnhub_text(url: str, api_key: str) -> str:
            calls.append((url, api_key))
            headline = (
                "Apple releases quarterly results"
                if "company-news" in url
                else "US market opens higher"
            )
            return json.dumps([{
                "id": len(calls),
                "headline": headline,
                "summary": "Summary.",
                "datetime": 1785463200,
                "source": "Reuters",
                "url": f"https://example.com/{len(calls)}",
                "image": "",
            }])

        payload = MarketInformationService(
            market_discovery_service=RejectDiscoveryService(),
            finnhub_api_key="configured-secret",
            fetch_finnhub_text=fake_fetch_finnhub_text,
            clock=lambda: datetime(2026, 7, 31, 2, 0, tzinfo=timezone.utc),
        ).read(MarketInformationQuery(market="us", symbol="AAPL"))

        self.assertEqual(payload["overview"]["universeCount"], 0)
        self.assertEqual(payload["leaders"], [])
        self.assertEqual(payload["active"], [])
        self.assertEqual(
            [item["scope"] for item in payload["news"]],
            ["market", "instrument"],
        )
        self.assertTrue(any("市场广度" in warning for warning in payload["warnings"]))
        self.assertEqual(
            sum("市场广度" in warning for warning in payload["warnings"]),
            1,
        )
        self.assertEqual(len(calls), 2)
        self.assertTrue(any("category=general" in url for url, _key in calls))
        self.assertTrue(any("company-news" in url and "symbol=AAPL" in url for url, _key in calls))
        self.assertTrue(all("configured-secret" not in url for url, _key in calls))

    def test_information_cache_returns_the_last_successful_snapshot_when_refresh_fails(self):
        from datetime import timedelta
        from quant_core.market_information import (
            MarketInformationQuery,
            MarketInformationService,
        )

        current_time = [datetime(2026, 7, 31, 2, 0, tzinfo=timezone.utc)]
        discovery_calls = 0
        finnhub_calls = 0

        class FlakyDiscoveryService:
            def discover(self, _query):
                nonlocal discovery_calls
                discovery_calls += 1
                if discovery_calls > 2:
                    raise OSError("upstream contains a secret that must not leak")
                return {
                    "market": "crypto",
                    "overview": {
                        "universeCount": 1,
                        "advancing": 1,
                        "declining": 0,
                        "flat": 0,
                        "totalAmount": 100,
                    },
                    "items": [],
                    "source": "binance-data-api",
                    "warnings": [],
                }

        def flaky_finnhub_fetch(_url: str, _key: str) -> str:
            nonlocal finnhub_calls
            finnhub_calls += 1
            if finnhub_calls > 1:
                raise OSError("news upstream failed")
            return "[]"

        service = MarketInformationService(
            market_discovery_service=FlakyDiscoveryService(),
            finnhub_api_key="configured-secret",
            fetch_finnhub_text=flaky_finnhub_fetch,
            clock=lambda: current_time[0],
        )
        query = MarketInformationQuery(market="crypto")
        first = service.read(query)
        current_time[0] += timedelta(seconds=299)
        cached = service.read(query)
        current_time[0] += timedelta(seconds=2)
        stale = service.read(query)
        cooling_down = service.read(query)
        current_time[0] += timedelta(seconds=31)
        retried = service.read(query)

        self.assertEqual(discovery_calls, 6)
        self.assertEqual(finnhub_calls, 3)
        self.assertEqual(cached["snapshotHash"], first["snapshotHash"])
        self.assertEqual(cached["freshness"], "fresh")
        self.assertEqual(stale["snapshotHash"], first["snapshotHash"])
        self.assertEqual(stale["freshness"], "stale")
        self.assertTrue(any("最近一次成功快照" in warning for warning in stale["warnings"]))
        self.assertEqual(cooling_down, stale)
        self.assertEqual(retried["snapshotHash"], first["snapshotHash"])
        self.assertEqual(retried["freshness"], "stale")
        self.assertNotIn("secret", json.dumps(stale))

    def test_us_information_treats_an_empty_finnhub_response_as_a_valid_empty_state(self):
        from quant_core.market_information import (
            MarketInformationQuery,
            MarketInformationService,
        )

        class RejectDiscoveryService:
            def discover(self, _query):
                raise AssertionError("US information must not use discovery")

        payload = MarketInformationService(
            market_discovery_service=RejectDiscoveryService(),
            finnhub_api_key="configured-secret",
            fetch_finnhub_text=lambda _url, _key: "[]",
            clock=lambda: datetime(2026, 7, 31, 2, 0, tzinfo=timezone.utc),
        ).read(MarketInformationQuery(market="us", symbol="AAPL"))

        self.assertEqual(payload["news"], [])
        self.assertEqual(payload["source"], "finnhub")
        self.assertEqual(payload["freshness"], "fresh")
        self.assertTrue(any("市场广度" in warning for warning in payload["warnings"]))

    def test_us_information_without_finnhub_key_returns_an_actionable_empty_state(self):
        from quant_core.market_information import (
            MarketInformationQuery,
            MarketInformationService,
        )

        class RejectDiscoveryService:
            def discover(self, _query):
                raise AssertionError("US information must not use discovery")

        payload = MarketInformationService(
            market_discovery_service=RejectDiscoveryService(),
            finnhub_api_key="",
            clock=lambda: datetime(2026, 7, 31, 2, 0, tzinfo=timezone.utc),
        ).read(MarketInformationQuery(market="us", symbol="AAPL"))

        self.assertEqual(payload["news"], [])
        self.assertEqual(payload["source"], "")
        self.assertEqual(payload["freshness"], "fresh")
        self.assertIn(
            "Finnhub API Key 未配置，新闻暂不可用。",
            payload["warnings"],
        )

    def test_crypto_news_without_finnhub_key_returns_an_actionable_empty_state(self):
        from quant_core.market_information import (
            MarketInformationQuery,
            MarketInformationService,
        )

        class RejectDiscoveryService:
            def discover(self, _query):
                raise AssertionError("news-only information must not use discovery")

        payload = MarketInformationService(
            market_discovery_service=RejectDiscoveryService(),
            finnhub_api_key="",
            clock=lambda: datetime(2026, 7, 31, 2, 0, tzinfo=timezone.utc),
        ).read(MarketInformationQuery(market="crypto", section="news"))

        self.assertEqual(payload["section"], "news")
        self.assertEqual(payload["news"], [])
        self.assertEqual(payload["source"], "")
        self.assertIn(
            "Finnhub API Key 未配置，新闻暂不可用。",
            payload["warnings"],
        )

    def test_finnhub_error_object_is_not_treated_as_a_fresh_empty_market_feed(self):
        from quant_core.market_information import (
            MarketInformationQuery,
            MarketInformationService,
        )

        class RejectDiscoveryService:
            def discover(self, _query):
                raise AssertionError("US information must not use discovery")

        def fake_finnhub_fetch(url: str, _key: str) -> str:
            if "/news?" in url:
                return json.dumps({
                    "error": "upstream-secret-must-not-leak",
                })
            return "[]"

        payload = MarketInformationService(
            market_discovery_service=RejectDiscoveryService(),
            finnhub_api_key="configured-secret",
            fetch_finnhub_text=fake_finnhub_fetch,
            clock=lambda: datetime(2026, 7, 31, 2, 0, tzinfo=timezone.utc),
        ).read(MarketInformationQuery(market="us", symbol="AAPL"))

        self.assertEqual(payload["news"], [])
        self.assertEqual(payload["source"], "finnhub")
        self.assertEqual(payload["freshness"], "fresh")
        self.assertIn("Finnhub 市场新闻暂不可用。", payload["warnings"])
        self.assertNotIn("upstream-secret", json.dumps(payload))

    def test_eastmoney_error_object_is_not_treated_as_a_valid_empty_feed(self):
        from quant_core.market_information import (
            MarketInformationQuery,
            MarketInformationService,
        )

        class FakeDiscoveryService:
            def discover(self, _query):
                return {
                    "market": "ashare",
                    "overview": {
                        "universeCount": 5_432,
                        "advancing": 3_100,
                        "declining": 2_100,
                        "flat": 232,
                        "totalAmount": 980_000_000_000,
                    },
                    "items": [],
                    "source": "eastmoney",
                    "freshness": "fresh",
                    "warnings": [],
                }

        search_urls = []

        def fake_fetch_text(url: str, _encoding: str = "utf-8") -> str:
            if "getFastNewsList" in url:
                return json.dumps({
                    "code": 0,
                    "message": "upstream-secret-must-not-leak",
                    "data": None,
                })
            search_urls.append(url)
            return 'aiqt({"result":{"cmsArticleWebOld":[]}})'

        payload = MarketInformationService(
            market_discovery_service=FakeDiscoveryService(),
            fetch_text=fake_fetch_text,
            clock=lambda: datetime(2026, 7, 31, 2, 0, tzinfo=timezone.utc),
        ).read(MarketInformationQuery(market="ashare", symbol="600000"))

        self.assertEqual(payload["overview"]["universeCount"], 5_432)
        self.assertEqual(payload["news"], [])
        self.assertIn("东方财富市场快讯暂不可用。", payload["warnings"])
        self.assertNotIn("upstream-secret", json.dumps(payload))
        self.assertIn("600000", search_urls[0])

    def test_ashare_information_keeps_breadth_and_fast_news_when_instrument_news_fails(self):
        from quant_core.market_information import (
            MarketInformationQuery,
            MarketInformationService,
        )

        class FakeDiscoveryService:
            def discover(self, _query):
                return {
                    "market": "ashare",
                    "overview": {
                        "universeCount": 5_432,
                        "advancing": 3_100,
                        "declining": 2_100,
                        "flat": 232,
                        "totalAmount": 980_000_000_000,
                    },
                    "items": [],
                    "source": "eastmoney",
                    "freshness": "fresh",
                    "warnings": [],
                }

        def fake_fetch_text(url: str, _encoding: str = "utf-8") -> str:
            if "getFastNewsList" in url:
                return json.dumps({
                    "data": {
                        "fastNewsList": [{
                            "code": "202607311234567890",
                            "title": "市场快讯仍然可用",
                            "summary": "快讯摘要。",
                            "showTime": "2026-07-31 09:00:00",
                            "image": "",
                        }]
                    }
                })
            raise OSError("instrument-news-secret-must-not-leak")

        payload = MarketInformationService(
            market_discovery_service=FakeDiscoveryService(),
            fetch_text=fake_fetch_text,
            clock=lambda: datetime(2026, 7, 31, 2, 0, tzinfo=timezone.utc),
        ).read(MarketInformationQuery(market="ashare", symbol="600000"))

        self.assertEqual(payload["overview"]["universeCount"], 5_432)
        self.assertEqual(
            [item["headline"] for item in payload["news"]],
            ["市场快讯仍然可用"],
        )
        self.assertTrue(any("个股新闻" in warning for warning in payload["warnings"]))
        self.assertNotIn("secret", json.dumps(payload))

    def test_information_is_stale_when_market_discovery_is_stale(self):
        from quant_core.market_information import (
            MarketInformationQuery,
            MarketInformationService,
        )

        class StaleDiscoveryService:
            def discover(self, _query):
                return {
                    "market": "crypto",
                    "overview": {
                        "universeCount": 480,
                        "advancing": 300,
                        "declining": 170,
                        "flat": 10,
                        "totalAmount": 12_000_000_000,
                    },
                    "items": [],
                    "source": "binance-data-api",
                    "freshness": "stale",
                    "warnings": [
                        "Binance 行情刷新失败，已使用最近一次成功快照。"
                    ],
                }

        payload = MarketInformationService(
            market_discovery_service=StaleDiscoveryService(),
            finnhub_api_key="",
            clock=lambda: datetime(2026, 7, 31, 2, 0, tzinfo=timezone.utc),
        ).read(MarketInformationQuery(market="crypto"))

        self.assertEqual(payload["freshness"], "stale")
        self.assertIn(
            "Binance 行情刷新失败，已使用最近一次成功快照。",
            payload["warnings"],
        )

    def test_market_information_api_reads_a_validated_query(self):
        from quant_core.api import QuantApiHandler

        received = []

        class FakeInformationService:
            def read(self, query):
                received.append(query)
                return {
                    "market": query.market,
                    "symbol": query.symbol,
                    "overview": {
                        "universeCount": 0,
                        "advancing": 0,
                        "declining": 0,
                        "flat": 0,
                        "totalAmount": 0,
                    },
                    "leaders": [],
                    "active": [],
                    "news": [],
                    "source": "finnhub",
                    "observedAt": "2026-07-31T02:00:00+00:00",
                    "freshness": "fresh",
                    "warnings": [],
                    "snapshotHash": "c" * 64,
                }

        class TestHandler(QuantApiHandler):
            market_information_service = FakeInformationService()

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
                "/api/market/information?market=ashare&symbol=600000"
                "&name=%E6%B5%A6%E5%8F%91%E9%93%B6%E8%A1%8C&limit=12",
            )
            response = connection.getresponse()
            payload = json.loads(response.read().decode("utf-8"))
        finally:
            connection.close()
            server.shutdown()
            thread.join(timeout=5)
            server.server_close()

        self.assertEqual(response.status, 200)
        self.assertEqual(payload["market"], "ashare")
        self.assertEqual(received[0].market, "ashare")
        self.assertEqual(received[0].symbol, "600000")
        self.assertEqual(received[0].name, "浦发银行")
        self.assertEqual(received[0].limit, 12)

    def test_market_information_api_rejects_invalid_queries(self):
        from quant_core.api import QuantApiHandler

        class RejectInformationService:
            def read(self, _query):
                raise AssertionError("invalid query reached the service")

        class TestHandler(QuantApiHandler):
            market_information_service = RejectInformationService()

        server = HTTPServer(("127.0.0.1", 0), TestHandler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        connection = HTTPConnection(
            server.server_address[0],
            server.server_address[1],
            timeout=5,
        )
        try:
            results = []
            for path in (
                "/api/market/information?market=forex",
                "/api/market/information?market=ashare&limit=0",
                "/api/market/information?market=us&symbol=..%2Fsecret",
                "/api/market/information?market=us&market=crypto",
                f"/api/market/information?market=ashare&name={'A' * 65}",
                "/api/market/information?market=ashare&section=slow",
                "/api/market/information?market=ashare&offset=1001",
                "/api/market/information?market=ashare&scope=company",
            ):
                connection.request("GET", path)
                response = connection.getresponse()
                results.append((
                    response.status,
                    json.loads(response.read().decode("utf-8")),
                ))
        finally:
            connection.close()
            server.shutdown()
            thread.join(timeout=5)
            server.server_close()

        self.assertTrue(all(status == 400 for status, _payload in results))
        self.assertTrue(
            all(
                payload["error"] == "invalid_market_information_query"
                for _status, payload in results
            )
        )
        self.assertNotIn("secret", json.dumps(results))

    def test_market_information_api_returns_a_sanitized_502_when_no_snapshot_exists(self):
        from quant_core.api import QuantApiHandler
        from quant_core.market_information import MarketInformationUnavailable

        class UnavailableInformationService:
            def read(self, _query):
                raise MarketInformationUnavailable("市场资讯上游当前不可用。")

        class TestHandler(QuantApiHandler):
            market_information_service = UnavailableInformationService()

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
                "/api/market/information?market=us&symbol=AAPL",
            )
            response = connection.getresponse()
            payload = json.loads(response.read().decode("utf-8"))
        finally:
            connection.close()
            server.shutdown()
            thread.join(timeout=5)
            server.server_close()

        self.assertEqual(response.status, 502)
        self.assertEqual(payload, {
            "error": "market_information_unavailable",
            "detail": "市场资讯上游当前不可用。",
        })

    def test_saved_finnhub_key_is_applied_to_information_without_restart(self):
        from quant_core.adapter_error_ledger import MarketDataAdapterErrorStore
        from quant_core.api import QuantApiHandler
        from quant_core.cache import MarketDataCache
        from quant_core.live_quotes import QuantDingerLiveQuoteAdapter
        from quant_core.market_information import MarketInformationService
        from quant_core.settings import PlatformSettingsStore

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            environment = {"FINNHUB_API_KEY": "environment-key"}
            store = PlatformSettingsStore(
                root / "platform_settings.sqlite",
                root / "platform-settings.key",
            )
            requested = []

            def fetch_finnhub_text(url: str, api_key: str) -> str:
                requested.append((url, api_key))
                return json.dumps([{
                    "id": len(requested),
                    "headline": "US market update",
                    "summary": "Summary.",
                    "datetime": 1785463200,
                    "source": "Reuters",
                    "url": "https://example.com/us-market",
                    "image": "",
                }])

            class RuntimeKlineAdapter:
                def update_ccxt_settings(self, _exchange, _timeout):
                    pass

            class TestHandler(QuantApiHandler):
                cache = MarketDataCache(root / "market.sqlite")
                adapter_error_store = MarketDataAdapterErrorStore(
                    root / "adapter_errors.sqlite"
                )
                platform_settings_store = store
                platform_settings_environ = environment
                settings_restart_required = False
                quote_adapter = QuantDingerLiveQuoteAdapter(
                    finnhub_api_key="environment-key",
                )
                kline_adapter = RuntimeKlineAdapter()
                market_information_service = MarketInformationService(
                    finnhub_api_key="environment-key",
                    fetch_finnhub_text=fetch_finnhub_text,
                )

            configuration = store.configuration_payload(environment)["values"]
            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(
                server.server_address[0],
                server.server_address[1],
                timeout=5,
            )
            try:
                information_path = (
                    "/api/market/information?market=us&symbol=AAPL"
                )
                connection.request("GET", information_path)
                initial_response = connection.getresponse()
                initial_response.read()
                connection.request(
                    "PUT",
                    "/api/settings/configuration",
                    body=json.dumps({
                        "configuration": configuration,
                        "secretUpdates": {
                            "finnhubApiKey": "database-key",
                        },
                        "clearSecrets": [],
                    }),
                    headers={"Content-Type": "application/json"},
                )
                saved_response = connection.getresponse()
                saved = json.loads(saved_response.read().decode("utf-8"))
                connection.request("GET", information_path)
                refreshed_response = connection.getresponse()
                refreshed_response.read()
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(initial_response.status, 200)
        self.assertEqual(saved_response.status, 200)
        self.assertFalse(
            saved["settings"]["configuration"]["restartRequired"]
        )
        self.assertEqual(refreshed_response.status, 200)
        self.assertEqual(
            [api_key for _url, api_key in requested],
            [
                "environment-key",
                "environment-key",
                "database-key",
                "database-key",
            ],
        )
        self.assertTrue(
            all(
                "environment-key" not in url and "database-key" not in url
                for url, _api_key in requested
            )
        )


if __name__ == "__main__":
    unittest.main()
