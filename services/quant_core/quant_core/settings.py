from __future__ import annotations

import base64
import json
import os
import re
import secrets
import sqlite3
import subprocess
import sys
from contextlib import closing
from dataclasses import dataclass
from datetime import datetime, timezone
from importlib import import_module, invalidate_caches
from importlib.util import find_spec
from pathlib import Path
from typing import Any, Mapping, MutableMapping
from urllib.parse import urlparse

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from quant_core.ai_review_providers import validated_provider_base_url

_PROVIDER_ERROR_CATEGORIES = ("rate_limit", "dependency", "network", "upstream", "incomplete_data", "unknown")
_PROVIDER_ERROR_CATEGORY_PRIORITY = {category: index for index, category in enumerate(_PROVIDER_ERROR_CATEGORIES)}
_PROVIDER_ERROR_WINDOWS = {
    "oneHour": 60 * 60,
    "twentyFourHours": 24 * 60 * 60,
    "sevenDays": 7 * 24 * 60 * 60,
}
INSTALLABLE_OPTIONAL_DATA_DEPENDENCIES = frozenset({"akshare", "yfinance"})
_OPTIONAL_DEPENDENCY_INSTALL_ENVIRONMENT_KEYS = frozenset({
    "CURL_CA_BUNDLE",
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "LANG",
    "LC_ALL",
    "NO_PROXY",
    "PATH",
    "REQUESTS_CA_BUNDLE",
    "SSL_CERT_DIR",
    "SSL_CERT_FILE",
    "SYSTEMROOT",
    "TEMP",
    "TMP",
    "TMPDIR",
})


def install_optional_data_dependency(dependency: str) -> bool:
    if dependency not in INSTALLABLE_OPTIONAL_DATA_DEPENDENCIES:
        raise ValueError("optional_data_dependency_not_supported")
    if find_spec(dependency) is not None:
        _require_importable_optional_data_dependency(dependency)
        return False
    environment = {
        key: value
        for key, value in os.environ.items()
        if key.upper() in _OPTIONAL_DEPENDENCY_INSTALL_ENVIRONMENT_KEYS
        or key.upper().startswith("PIP_")
    }
    environment["PYTHONNOUSERSITE"] = "1"
    try:
        subprocess.run(
            [
                sys.executable,
                "-m",
                "pip",
                "install",
                "--disable-pip-version-check",
                "--no-cache-dir",
                "--no-input",
                dependency,
            ],
            check=True,
            env=environment,
            timeout=80,
        )
    except subprocess.TimeoutExpired as error:
        raise RuntimeError("optional_data_dependency_install_timeout") from error
    except (OSError, subprocess.CalledProcessError) as error:
        raise RuntimeError("optional_data_dependency_install_failed") from error
    invalidate_caches()
    _require_importable_optional_data_dependency(dependency)
    return True


def _require_importable_optional_data_dependency(dependency: str) -> None:
    try:
        import_module(dependency)
    except Exception as error:
        raise RuntimeError("optional_data_dependency_install_failed") from error


_PUBLIC_SETTING_SPECS = {
    "ccxtDefaultExchange": ("CCXT_DEFAULT_EXCHANGE", "binance"),
    "ccxtTimeout": ("CCXT_TIMEOUT", "10000"),
    "autoTradingIntervalSeconds": ("AIQT_AUTO_TRADING_INTERVAL_SECONDS", "35"),
    "productionTradingEnabled": ("AIQT_ENABLE_PRODUCTION_TRADING", "false"),
    "liveSessionTtlHours": ("AIQT_LIVE_SESSION_TTL_HOURS", "8"),
    "openaiModel": ("OPENAI_MODEL", ""),
    "openaiCompatibleBaseUrl": ("OPENAI_COMPATIBLE_BASE_URL", ""),
    "openaiCompatibleModel": ("OPENAI_COMPATIBLE_MODEL", ""),
    "ollamaBaseUrl": ("OLLAMA_BASE_URL", "http://127.0.0.1:11434"),
    "ollamaModel": ("OLLAMA_MODEL", ""),
    "secEdgarUserAgent": ("SEC_EDGAR_USER_AGENT", ""),
    "monitoringWebhookTimeoutSeconds": ("AIQT_MONITORING_WEBHOOK_TIMEOUT_SECONDS", "5"),
    "freeStockdbTimeoutSeconds": ("AIQT_FREE_STOCKDB_TIMEOUT_SECONDS", "3"),
}
_BOOLEAN_SETTING_FIELDS = {"productionTradingEnabled"}
_INTEGER_SETTING_RANGES = {
    "ccxtTimeout": (1_000, 120_000),
    "autoTradingIntervalSeconds": (5, 3_600),
    "liveSessionTtlHours": (0, 8_760),
    "monitoringWebhookTimeoutSeconds": (1, 120),
    "freeStockdbTimeoutSeconds": (1, 120),
}
_PROVIDER_URL_SETTINGS = {"openaiCompatibleBaseUrl", "ollamaBaseUrl"}
_SECRET_SETTING_SPECS = {
    "finnhubApiKey": "FINNHUB_API_KEY",
    "openaiApiKey": "OPENAI_API_KEY",
    "openaiCompatibleApiKey": "OPENAI_COMPATIBLE_API_KEY",
    "ccxtSandboxApiKey": "CCXT_SANDBOX_API_KEY",
    "ccxtSandboxSecret": "CCXT_SANDBOX_SECRET",
    "ccxtProductionReadonlyApiKey": "CCXT_PRODUCTION_READONLY_API_KEY",
    "ccxtProductionReadonlySecret": "CCXT_PRODUCTION_READONLY_SECRET",
    "ccxtProductionTradingApiKey": "CCXT_PRODUCTION_TRADING_API_KEY",
    "ccxtProductionTradingSecret": "CCXT_PRODUCTION_TRADING_SECRET",
    "monitoringWebhookUrl": "AIQT_MONITORING_WEBHOOK_URL",
    "freeStockdbUrl": "AIQT_FREE_STOCKDB_URL",
    "httpsProxy": "HTTPS_PROXY",
}
_SECRET_URL_SETTINGS = {"monitoringWebhookUrl", "freeStockdbUrl", "httpsProxy"}
_SETTINGS_AAD = b"aiqt:platform-settings:v1"
_SECRET_MASK = "••••••••"


@dataclass(frozen=True)
class PlatformSettingsRecord:
    revision: int
    public_values: dict[str, str]
    secret_values: dict[str, str]
    updated_at: str


class PlatformSettingsStore:
    """Persist one encrypted, authoritative platform configuration."""

    def __init__(self, path: str | Path, key_path: str | Path) -> None:
        self.path = Path(path)
        self.key_path = Path(key_path)

    def effective_environment(self, environment: Mapping[str, str]) -> dict[str, str]:
        effective = dict(environment)
        record = self._load(environment)
        if record is None:
            return effective
        for key, value in {**record.public_values, **record.secret_values}.items():
            if value:
                effective[key] = value
            else:
                effective.pop(key, None)
        return effective

    def apply_to_environment(self, environment: MutableMapping[str, str]) -> bool:
        record = self._load(environment)
        if record is None:
            return False
        for key, value in {**record.public_values, **record.secret_values}.items():
            if value:
                environment[key] = value
            else:
                environment.pop(key, None)
        return True

    def configuration_payload(
        self,
        environment: Mapping[str, str],
        *,
        restart_required: bool = False,
    ) -> dict[str, Any]:
        record = self._load(environment)
        public_values = record.public_values if record else {
            env_key: str(environment.get(env_key, default))
            for env_key, default in _PUBLIC_SETTING_SPECS.values()
        }
        secret_values = record.secret_values if record else {
            env_key: str(environment.get(env_key, ""))
            for env_key in _SECRET_SETTING_SPECS.values()
        }
        return {
            "source": "database" if record else "environment",
            "revision": record.revision if record else 0,
            "updatedAt": record.updated_at if record else None,
            "restartRequired": restart_required,
            "values": {
                field: _public_setting_for_payload(field, public_values.get(env_key, default))
                for field, (env_key, default) in _PUBLIC_SETTING_SPECS.items()
            },
            "secrets": {
                field: {
                    "configured": bool(secret_values.get(env_key, "")),
                    "masked": _mask_secret(secret_values.get(env_key, "")),
                }
                for field, env_key in _SECRET_SETTING_SPECS.items()
            },
        }

    def save(
        self,
        configuration: object,
        secret_updates: object,
        clear_secrets: object,
        environment: Mapping[str, str],
    ) -> PlatformSettingsRecord:
        public_updates = _validate_public_settings(configuration)
        secret_changes = _validate_secret_updates(secret_updates)
        cleared = _validate_clear_secrets(clear_secrets)
        if set(secret_changes) & cleared:
            raise ValueError("secret_cannot_be_updated_and_cleared")
        current = self._load(environment)
        public_values = (
            dict(current.public_values)
            if current
            else {
                env_key: str(environment.get(env_key, default))
                for env_key, default in _PUBLIC_SETTING_SPECS.values()
            }
        )
        secret_values = (
            dict(current.secret_values)
            if current
            else {
                env_key: str(environment.get(env_key, ""))
                for env_key in _SECRET_SETTING_SPECS.values()
            }
        )
        for field, value in public_updates.items():
            public_values[_PUBLIC_SETTING_SPECS[field][0]] = str(value)
        for field, value in secret_changes.items():
            secret_values[_SECRET_SETTING_SPECS[field]] = value
        for field in cleared:
            secret_values[_SECRET_SETTING_SPECS[field]] = ""

        revision = current.revision + 1 if current else 1
        updated_at = datetime.now(timezone.utc).isoformat()
        secret_blob = self._encrypt(secret_values, environment)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with closing(sqlite3.connect(self.path)) as connection:
            with connection:
                self._ensure_schema(connection)
                connection.execute(
                    """
                    INSERT INTO platform_settings (id, revision, public_json, secret_blob, updated_at)
                    VALUES (1, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        revision = excluded.revision,
                        public_json = excluded.public_json,
                        secret_blob = excluded.secret_blob,
                        updated_at = excluded.updated_at
                    """,
                    (
                        revision,
                        json.dumps(public_values, ensure_ascii=False, separators=(",", ":"), sort_keys=True),
                        secret_blob,
                        updated_at,
                    ),
                )
        return PlatformSettingsRecord(revision, public_values, secret_values, updated_at)

    def _load(self, environment: Mapping[str, str]) -> PlatformSettingsRecord | None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with closing(sqlite3.connect(self.path)) as connection:
            self._ensure_schema(connection)
            row = connection.execute(
                "SELECT revision, public_json, secret_blob, updated_at FROM platform_settings WHERE id = 1"
            ).fetchone()
        if row is None:
            return None
        stored_public_values = json.loads(str(row[1]))
        secret_values = json.loads(self._decrypt(bytes(row[2]), environment))
        if not isinstance(stored_public_values, dict) or not isinstance(secret_values, dict):
            raise ValueError("platform_settings_record_invalid")
        public_values = {
            env_key: default for env_key, default in _PUBLIC_SETTING_SPECS.values()
        }
        public_values.update(
            {str(key): str(value) for key, value in stored_public_values.items()}
        )
        return PlatformSettingsRecord(
            int(row[0]),
            public_values,
            {str(key): str(value) for key, value in secret_values.items()},
            str(row[3]),
        )

    @staticmethod
    def _ensure_schema(connection: sqlite3.Connection) -> None:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS platform_settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                revision INTEGER NOT NULL,
                public_json TEXT NOT NULL,
                secret_blob BLOB NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )

    def _encrypt(self, values: dict[str, str], environment: Mapping[str, str]) -> bytes:
        nonce = secrets.token_bytes(12)
        plaintext = json.dumps(values, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode()
        return nonce + AESGCM(self._encryption_key(environment)).encrypt(nonce, plaintext, _SETTINGS_AAD)

    def _decrypt(self, blob: bytes, environment: Mapping[str, str]) -> str:
        if len(blob) < 29:
            raise ValueError("platform_settings_secret_blob_invalid")
        return AESGCM(self._encryption_key(environment)).decrypt(
            blob[:12],
            blob[12:],
            _SETTINGS_AAD,
        ).decode()

    def _encryption_key(self, environment: Mapping[str, str]) -> bytes:
        configured = str(environment.get("AIQT_SETTINGS_MASTER_KEY", "")).strip()
        if configured:
            try:
                key = base64.urlsafe_b64decode(configured.encode())
            except ValueError as error:
                raise ValueError("AIQT_SETTINGS_MASTER_KEY must be URL-safe base64") from error
            if len(key) != 32:
                raise ValueError("AIQT_SETTINGS_MASTER_KEY must decode to 32 bytes")
            return key
        if self.key_path.exists():
            key = base64.urlsafe_b64decode(self.key_path.read_bytes().strip())
            if len(key) != 32:
                raise ValueError("platform settings key file must decode to 32 bytes")
            return key
        self.key_path.parent.mkdir(parents=True, exist_ok=True)
        key = AESGCM.generate_key(bit_length=256)
        encoded = base64.urlsafe_b64encode(key)
        try:
            descriptor = os.open(self.key_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        except FileExistsError:
            return self._encryption_key(environment)
        with os.fdopen(descriptor, "wb") as key_file:
            key_file.write(encoded)
        try:
            self.key_path.chmod(0o600)
        except OSError:
            pass
        return key


def _validate_public_settings(value: object) -> dict[str, str | int | bool]:
    if not isinstance(value, dict):
        raise ValueError("configuration_must_be_object")
    unknown = set(value) - set(_PUBLIC_SETTING_SPECS)
    if unknown:
        raise ValueError(f"unsupported_configuration_fields:{','.join(sorted(unknown))}")
    missing = set(_PUBLIC_SETTING_SPECS) - set(value)
    if missing:
        raise ValueError(f"missing_configuration_fields:{','.join(sorted(missing))}")
    validated: dict[str, str | int | bool] = {}
    for field, raw in value.items():
        if field in _BOOLEAN_SETTING_FIELDS:
            if not isinstance(raw, bool):
                raise ValueError(f"{field}_must_be_boolean")
            validated[field] = raw
            continue
        if field in _INTEGER_SETTING_RANGES:
            if isinstance(raw, bool) or not isinstance(raw, int):
                raise ValueError(f"{field}_must_be_integer")
            minimum, maximum = _INTEGER_SETTING_RANGES[field]
            if not minimum <= raw <= maximum:
                raise ValueError(f"{field}_out_of_range")
            validated[field] = raw
            continue
        if not isinstance(raw, str):
            raise ValueError(f"{field}_must_be_string")
        normalized = raw.strip()
        if len(normalized) > 500:
            raise ValueError(f"{field}_too_long")
        if field == "ccxtDefaultExchange":
            normalized = normalized.casefold()
            if not re.fullmatch(r"[a-z0-9_-]{1,64}", normalized):
                raise ValueError("ccxtDefaultExchange_invalid")
        if field in _PROVIDER_URL_SETTINGS and normalized:
            normalized = validated_provider_base_url(normalized) or ""
            if not normalized:
                raise ValueError(f"{field}_invalid")
        validated[field] = normalized
    return validated


def _mask_secret(value: str) -> str | None:
    if not value:
        return None
    if len(value) <= 4:
        return _SECRET_MASK
    visible = 1 if len(value) <= 8 else 4
    return f"{value[:visible]}{_SECRET_MASK}{value[-visible:]}"


def _validate_secret_updates(value: object) -> dict[str, str]:
    if not isinstance(value, dict):
        raise ValueError("secretUpdates_must_be_object")
    unknown = set(value) - set(_SECRET_SETTING_SPECS)
    if unknown:
        raise ValueError(f"unsupported_secret_fields:{','.join(sorted(unknown))}")
    validated: dict[str, str] = {}
    for field, raw in value.items():
        if not isinstance(raw, str):
            raise ValueError(f"{field}_must_be_string")
        if not raw:
            continue
        if "\0" in raw or len(raw) > 8_192:
            raise ValueError(f"{field}_invalid")
        if field in _SECRET_URL_SETTINGS:
            _validate_http_url(raw, field)
        validated[field] = raw
    return validated


def _validate_clear_secrets(value: object) -> set[str]:
    if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
        raise ValueError("clearSecrets_must_be_array")
    cleared = set(value)
    unknown = cleared - set(_SECRET_SETTING_SPECS)
    if unknown:
        raise ValueError(f"unsupported_secret_fields:{','.join(sorted(unknown))}")
    return cleared


def _validate_http_url(value: str, field: str) -> None:
    try:
        parsed = urlparse(value)
        _ = parsed.port
    except (UnicodeError, ValueError) as error:
        raise ValueError(f"{field}_invalid") from error
    if parsed.scheme.casefold() not in {"http", "https"} or not parsed.hostname:
        raise ValueError(f"{field}_invalid")


def _public_setting_for_payload(field: str, value: str) -> str | int | bool:
    if field in _BOOLEAN_SETTING_FIELDS:
        return value.strip().lower() in {"1", "true", "yes", "on"}
    if field not in _INTEGER_SETTING_RANGES:
        return value
    try:
        parsed = int(value)
    except ValueError:
        parsed = int(_PUBLIC_SETTING_SPECS[field][1])
    minimum, maximum = _INTEGER_SETTING_RANGES[field]
    return min(max(parsed, minimum), maximum)


def _valid_sec_edgar_user_agent(value: str) -> bool:
    normalized = value.strip()
    return 8 <= len(normalized) <= 255 and bool(
        re.search(r"(?:\S+@\S+|https?://\S+)", normalized, re.IGNORECASE)
    )


def build_settings_status(
    *,
    cache_path: str | Path,
    cache_contexts: list[dict[str, Any]] | None = None,
    cache_stats: dict[str, Any] | None = None,
    finnhub_api_key: str | None = None,
    sec_edgar_user_agent: str | None = None,
    ccxt_exchange: str | None = None,
    adapter_dependency_statuses: dict[str, bool] | None = None,
    adapter_error_events: list[dict[str, Any]] | None = None,
    free_stockdb_url: str | None = None,
    free_stockdb_probe_succeeded: bool | None = None,
    generated_at: datetime | None = None,
) -> dict[str, Any]:
    """Build a read-only platform settings status payload without returning secrets."""

    cache = Path(cache_path)
    stats = _normalize_cache_stats(cache_stats)
    generated_timestamp = generated_at or datetime.now(timezone.utc)
    cache_context_payloads = [
        _cache_context_to_payload(context, generated_at=generated_timestamp) for context in (cache_contexts or [])
    ]
    finnhub_configured = bool((finnhub_api_key if finnhub_api_key is not None else os.getenv("FINNHUB_API_KEY", "")).strip())
    raw_sec_edgar_user_agent = (
        sec_edgar_user_agent
        if sec_edgar_user_agent is not None
        else os.getenv("SEC_EDGAR_USER_AGENT", "")
    )
    sec_edgar_configured = bool(raw_sec_edgar_user_agent.strip())
    sec_edgar_ready = _valid_sec_edgar_user_agent(raw_sec_edgar_user_agent)
    akshare_financials_available = _adapter_dependency_available(
        "akshare",
        adapter_dependency_statuses,
    )
    raw_exchange = ccxt_exchange if ccxt_exchange is not None else os.getenv("CCXT_DEFAULT_EXCHANGE", "")
    exchange_configured = bool(raw_exchange.strip())
    exchange = raw_exchange.strip() or "binance"

    return {
        "schemaVersion": 1,
        "generatedAt": generated_timestamp.isoformat(),
        "dataSources": [
            {
                "market": "ashare",
                "label": "A shares",
                "quoteSource": "tencent",
                "klineSource": "tencent / eastmoney / akshare",
                "status": "ready",
                "optionalKeyName": None,
                "optionalKeyConfigured": False,
                "note": "Tencent daily K-lines and Eastmoney minute K-lines do not require local API keys.",
            },
            {
                "market": "us",
                "label": "US equities",
                "quoteSource": "finnhub / yfinance",
                "klineSource": "yahoo / yfinance",
                "status": "ready" if finnhub_configured else "degraded",
                "optionalKeyName": "FINNHUB_API_KEY",
                "optionalKeyConfigured": finnhub_configured,
                "note": (
                    "Finnhub quote key is configured; secret value is only read locally."
                    if finnhub_configured
                    else "FINNHUB_API_KEY is optional; yfinance remains available as a no-key fallback."
                ),
            },
            {
                "market": "crypto",
                "label": "Crypto",
                "quoteSource": f"ccxt:{exchange}",
                "klineSource": f"binance / coinbase / ccxt:{exchange}",
                "status": "ready",
                "optionalKeyName": "CCXT_DEFAULT_EXCHANGE",
                "optionalKeyConfigured": exchange_configured,
                "note": "Public OHLCV and ticker routes stay paper-only until exchange trade keys are explicitly certified.",
            },
        ],
        "fundamentalDataSources": [
            {
                "id": "ashare-akshare-financials",
                "market": "ashare",
                "provider": "akshare",
                "status": "ready" if akshare_financials_available else "blocked",
                "configured": akshare_financials_available,
                "reasonCode": (
                    "dependency_available"
                    if akshare_financials_available
                    else "dependency_missing"
                ),
                "reason": (
                    "AKShare 财务依赖已就绪。"
                    if akshare_financials_available
                    else "未安装 AKShare 财务依赖。"
                ),
            },
            {
                "id": "us-sec-companyfacts",
                "market": "us",
                "provider": "sec-companyfacts",
                "status": "ready" if sec_edgar_ready else "blocked",
                "configured": sec_edgar_configured,
                "reasonCode": (
                    "sec_edgar_user_agent_configured"
                    if sec_edgar_ready
                    else "sec_edgar_user_agent_invalid"
                    if sec_edgar_configured
                    else "sec_edgar_user_agent_missing"
                ),
                "reason": (
                    "SEC EDGAR 联系信息已配置。"
                    if sec_edgar_ready
                    else "SEC EDGAR User-Agent 必须包含有效邮箱或 HTTP(S) 联系地址。"
                    if sec_edgar_configured
                    else "请配置 SEC EDGAR User-Agent 联系信息。"
                ),
            },
            {
                "id": "crypto-coingecko-binance-mapping",
                "market": "crypto",
                "provider": "coingecko-binance",
                "status": "ready_for_probe",
                "configured": True,
                "reasonCode": "runtime_mapping_validation_required",
                "reason": (
                    "公共只读源已就绪；生成候选时仍会逐项校验 Binance 交易对"
                    "与 CoinGecko coin_id 的精确映射。"
                ),
            },
        ],
        "marketDataAdapters": _market_data_adapter_statuses(
            exchange,
            cache_context_payloads,
            adapter_dependency_statuses=adapter_dependency_statuses,
            adapter_error_events=adapter_error_events,
            free_stockdb_url=free_stockdb_url,
            free_stockdb_probe_succeeded=free_stockdb_probe_succeeded,
            generated_at=generated_timestamp,
        ),
        "cache": {
            "engine": "sqlite",
            "path": str(cache),
            "exists": cache.exists(),
            "scope": "ohlcv",
            "rowCount": stats["row_count"],
            "contextCount": stats["context_count"],
            "latestTimestamp": stats["latest_timestamp"],
            "freshnessSummary": _cache_freshness_summary(cache_context_payloads),
            "contexts": cache_context_payloads,
        },
        "executionAdapters": [
            {
                "id": "paper-local",
                "market": "multi",
                "adapter": "Paper Trading",
                "route": "paper",
                "status": "paper_ready",
                "certification": "local",
                "liveTradingAllowed": False,
                "note": "Local paper execution is available after audited run and risk handoff checks.",
            },
            {
                "id": "ashare-live",
                "market": "ashare",
                "adapter": "A-share broker adapter",
                "route": "live",
                "status": "blocked",
                "certification": "interface_only",
                "liveTradingAllowed": False,
                "note": "Real A-share trading stays blocked until a legal broker adapter is certified.",
            },
            {
                "id": "us-live",
                "market": "us",
                "adapter": "IBKR / Alpaca adapter shape",
                "route": "live",
                "status": "config_required",
                "certification": "not_configured",
                "liveTradingAllowed": False,
                "note": "US live adapters require sandbox credentials, order lifecycle tests, and manual confirmation.",
            },
            {
                "id": "crypto-live",
                "market": "crypto",
                "adapter": "ccxt exchange adapter shape",
                "route": "live",
                "status": "config_required",
                "certification": "not_configured",
                "liveTradingAllowed": False,
                "note": "Exchange trading keys are not read by this status endpoint and live routing remains blocked.",
            },
        ],
        "safety": {
            "liveTradingAllowed": False,
            "requiredGates": ["adapter-certified", "risk-approved", "human-confirmed"],
        },
    }


def _market_data_adapter_statuses(
    exchange: str,
    cache_contexts: list[dict[str, Any]],
    *,
    adapter_dependency_statuses: dict[str, bool] | None,
    adapter_error_events: list[dict[str, Any]] | None,
    free_stockdb_url: str | None,
    free_stockdb_probe_succeeded: bool | None,
    generated_at: datetime,
) -> list[dict[str, Any]]:
    akshare_telemetry = _market_data_adapter_external_telemetry(
        adapter_id="akshare-ohlcv",
        dependency="akshare",
        dependency_statuses=adapter_dependency_statuses,
        adapter_error_events=adapter_error_events,
        generated_at=generated_at,
    )
    yfinance_telemetry = _market_data_adapter_external_telemetry(
        adapter_id="yfinance-ohlcv",
        dependency="yfinance",
        dependency_statuses=adapter_dependency_statuses,
        adapter_error_events=adapter_error_events,
        generated_at=generated_at,
    )
    ccxt_telemetry = _market_data_adapter_external_telemetry(
        adapter_id="ccxt-ohlcv",
        dependency="ccxt",
        dependency_statuses=adapter_dependency_statuses,
        adapter_error_events=adapter_error_events,
        generated_at=generated_at,
    )
    free_stockdb_telemetry = _free_stockdb_external_telemetry(
        free_stockdb_url,
        probe_succeeded=free_stockdb_probe_succeeded,
        generated_at=generated_at,
    )
    return [
        {
            "id": "akshare-ohlcv",
            "market": "ashare",
            "adapter": "AkShareMarketDataAdapter",
            "provider": "akshare",
            "status": _market_data_adapter_status_from_telemetry(akshare_telemetry),
            "route": "public_ohlcv",
            "capabilities": ["stock_zh_a_hist", "stock_zh_a_hist_min_em"],
            "timeframes": ["1d", "1w", "1m", "5m", "15m", "30m", "60m"],
            "historyDepth": "up-to-500-bars-per-request",
            "adjustmentModes": ["qfq", "none"],
            "freshnessSemantics": "market-calendar-aware",
            "credentialRequirements": [],
            "readOnly": True,
            "requiresApiKey": False,
            "requiresTradingKey": False,
            "cacheScope": "ohlcv",
            "cacheDiagnostics": _market_data_adapter_cache_diagnostics("ashare", cache_contexts),
            "externalTelemetry": akshare_telemetry,
            "note": "Normalizes A-share daily and recent minute OHLCV through public AKShare routes.",
        },
        {
            "id": "yfinance-ohlcv",
            "market": "us",
            "adapter": "YFinanceMarketDataAdapter",
            "provider": "yfinance",
            "status": _market_data_adapter_status_from_telemetry(yfinance_telemetry),
            "route": "public_ohlcv",
            "capabilities": ["Ticker.history"],
            "timeframes": ["1d", "1w", "1m", "5m", "15m", "30m", "60m"],
            "historyDepth": "up-to-500-bars-per-request",
            "adjustmentModes": ["none"],
            "freshnessSemantics": "market-calendar-aware",
            "credentialRequirements": [],
            "readOnly": True,
            "requiresApiKey": False,
            "requiresTradingKey": False,
            "cacheScope": "ohlcv",
            "cacheDiagnostics": _market_data_adapter_cache_diagnostics("us", cache_contexts),
            "externalTelemetry": yfinance_telemetry,
            "note": "Normalizes US equity OHLCV through yfinance without reading trading credentials.",
        },
        {
            "id": "ccxt-ohlcv",
            "market": "crypto",
            "adapter": "CcxtMarketDataAdapter",
            "provider": f"ccxt:{exchange}",
            "status": _market_data_adapter_status_from_telemetry(ccxt_telemetry),
            "route": "public_ohlcv",
            "capabilities": ["fetch_ohlcv"],
            "timeframes": ["1d", "1w", "1m", "5m", "15m", "30m", "60m"],
            "historyDepth": "up-to-500-bars-per-request",
            "adjustmentModes": ["none"],
            "freshnessSemantics": "continuous-market",
            "credentialRequirements": [],
            "readOnly": True,
            "requiresApiKey": False,
            "requiresTradingKey": False,
            "cacheScope": "ohlcv",
            "cacheDiagnostics": _market_data_adapter_cache_diagnostics("crypto", cache_contexts),
            "externalTelemetry": ccxt_telemetry,
            "note": "Normalizes public crypto exchange OHLCV; exchange trading keys stay outside this route.",
        },
        {
            "id": "free-stockdb-ohlcv",
            "market": "ashare",
            "adapter": "FreeStockDbMarketDataAdapter",
            "provider": "free-stockdb",
            "status": _market_data_adapter_status_from_telemetry(free_stockdb_telemetry),
            "route": "local_readonly_ohlcv",
            "capabilities": ["daily_ohlcv_comparison"],
            "timeframes": ["1d"],
            "historyDepth": "up-to-500-bars-per-request",
            "adjustmentModes": ["none"],
            "freshnessSemantics": "local-snapshot",
            "credentialRequirements": [],
            "readOnly": True,
            "requiresApiKey": False,
            "requiresTradingKey": False,
            "cacheScope": "comparison-only",
            "cacheDiagnostics": _market_data_adapter_cache_diagnostics("ashare", cache_contexts),
            "externalTelemetry": free_stockdb_telemetry,
            "note": (
                "Optional local A-share daily comparison source; it never replaces the primary source "
                "and this integration never calls sync or write commands."
            ),
        },
    ]


def _free_stockdb_external_telemetry(
    value: str | None,
    *,
    probe_succeeded: bool | None,
    generated_at: datetime,
) -> dict[str, Any]:
    raw_url = str(value or "").strip()
    parsed = urlparse(raw_url) if raw_url else None
    valid = bool(parsed and parsed.scheme in {"http", "https"} and parsed.netloc)
    configured = bool(raw_url)
    status = "ok" if valid and probe_succeeded else "degraded" if valid else "blocked"
    reason = (
        "probe_succeeded"
        if valid and probe_succeeded
        else "probe_failed"
        if valid and probe_succeeded is False
        else "configured_not_probed"
        if valid
        else "endpoint_invalid"
        if configured
        else "endpoint_not_configured"
    )
    return {
        "status": status,
        "dependency": "free-stockdb-local-service",
        "dependencyAvailable": valid,
        "lastError": None if valid and probe_succeeded is not False else reason,
        "retryState": "provider_error" if valid and probe_succeeded is False else "idle" if valid else "dependency_missing",
        "checkedAt": generated_at.isoformat(),
        "installGuidance": {
            "packageName": "free-stockdb",
            "dockerBuildArg": "",
            "packageInstallCommand": "",
            "projectExtraInstallCommand": "",
            "note": "Configure the optional local read-only endpoint with AIQT_FREE_STOCKDB_URL.",
        },
        "lastProviderError": None,
        "providerHealth": {
            "status": "ok" if valid and probe_succeeded else "watch" if valid else "blocked",
            "recentErrorCount": 0,
            "lastErrorAt": None,
            "affectedSymbols": [],
            "affectedContexts": [],
            "categorySummary": {category: 0 for category in _PROVIDER_ERROR_CATEGORIES},
            "dominantCategory": None,
            "windowSummary": {
                window: {
                    "errorCount": 0,
                    "latestErrorAt": None,
                    "categorySummary": {category: 0 for category in _PROVIDER_ERROR_CATEGORIES},
                    "dominantCategory": None,
                }
                for window in _PROVIDER_ERROR_WINDOWS
            },
            "retryAfterSeconds": 0,
            "reason": reason,
        },
    }


def _market_data_adapter_external_telemetry(
    *,
    adapter_id: str,
    dependency: str,
    dependency_statuses: dict[str, bool] | None,
    adapter_error_events: list[dict[str, Any]] | None,
    generated_at: datetime,
) -> dict[str, Any]:
    available = _adapter_dependency_available(dependency, dependency_statuses)
    last_provider_error = _latest_provider_error_for_adapter(adapter_id, adapter_error_events)
    provider_health = _provider_health_for_adapter(
        adapter_id,
        adapter_error_events,
        dependency_available=available,
        generated_at=generated_at,
    )
    if available:
        if provider_health["status"] in {"watch", "cooldown"}:
            return {
                "status": "degraded",
                "dependency": dependency,
                "dependencyAvailable": True,
                "lastError": last_provider_error["message"] if last_provider_error else None,
                "retryState": "provider_error",
                "checkedAt": generated_at.isoformat(),
                "installGuidance": _market_data_adapter_install_guidance(dependency),
                "lastProviderError": last_provider_error,
                "providerHealth": provider_health,
            }
        return {
            "status": "ok",
            "dependency": dependency,
            "dependencyAvailable": True,
            "lastError": None,
            "retryState": "idle",
            "checkedAt": generated_at.isoformat(),
            "installGuidance": _market_data_adapter_install_guidance(dependency),
            "lastProviderError": last_provider_error,
            "providerHealth": provider_health,
        }
    return {
        "status": "blocked",
        "dependency": dependency,
        "dependencyAvailable": False,
        "lastError": f"optional package '{dependency}' is not installed",
        "retryState": "dependency_missing",
        "checkedAt": generated_at.isoformat(),
        "installGuidance": _market_data_adapter_install_guidance(dependency),
        "lastProviderError": last_provider_error,
        "providerHealth": provider_health,
    }


def _adapter_dependency_available(dependency: str, dependency_statuses: dict[str, bool] | None) -> bool:
    if dependency_statuses is not None and dependency in dependency_statuses:
        return bool(dependency_statuses[dependency])
    return find_spec(dependency) is not None


def _market_data_adapter_install_guidance(dependency: str) -> dict[str, str]:
    return {
        "packageName": dependency,
        "dockerBuildArg": "INSTALL_DATA_DEPS=true",
        "packageInstallCommand": f"pip install {dependency}",
        "projectExtraInstallCommand": 'pip install -e "services/quant_core[data]"',
        "note": (
            "Installs optional public market data dependencies only; "
            "it does not configure API keys or enable live trading."
        ),
    }


def _latest_provider_error_for_adapter(adapter_id: str, events: list[dict[str, Any]] | None) -> dict[str, str] | None:
    matching_events = _provider_error_events_for_adapter(adapter_id, events)
    if not matching_events:
        return None
    return max(matching_events, key=lambda event: (event["createdAt"], event["eventId"]))


def _provider_health_for_adapter(
    adapter_id: str,
    events: list[dict[str, Any]] | None,
    *,
    dependency_available: bool,
    generated_at: datetime,
) -> dict[str, Any]:
    matching_events = _provider_error_events_for_adapter(adapter_id, events)
    window_summary = _provider_error_window_summary(matching_events, generated_at=generated_at)
    recent_events = _provider_error_events_in_window(
        matching_events,
        generated_at=generated_at,
        seconds=_PROVIDER_ERROR_WINDOWS["twentyFourHours"],
    )
    recent_error_count = len(recent_events)
    last_error_at = None
    if recent_events:
        latest_event = max(recent_events, key=lambda event: (event["createdAt"], event["eventId"]))
        last_error_at = latest_event["createdAt"]
    category_summary = _provider_error_category_summary(recent_events)
    dominant_category = _dominant_provider_error_category(category_summary)

    if not dependency_available:
        status = "blocked"
        reason = "dependency_missing"
        retry_after_seconds = 0
    elif recent_error_count >= 3:
        status = "cooldown"
        reason = "provider_cooldown"
        retry_after_seconds = 900
    elif recent_error_count:
        status = "watch"
        reason = "recent_provider_errors"
        retry_after_seconds = 60 if recent_error_count == 1 else 300
    else:
        status = "ok"
        reason = "no_recent_provider_errors"
        retry_after_seconds = 0

    return {
        "status": status,
        "recentErrorCount": recent_error_count,
        "lastErrorAt": last_error_at,
        "affectedSymbols": sorted({event["symbol"] for event in recent_events}),
        "affectedContexts": sorted({event["context"] for event in recent_events}),
        "categorySummary": category_summary,
        "dominantCategory": dominant_category,
        "windowSummary": window_summary,
        "retryAfterSeconds": retry_after_seconds,
        "reason": reason,
    }


def _provider_error_events_for_adapter(
    adapter_id: str,
    events: list[dict[str, Any]] | None,
) -> list[dict[str, str]]:
    expected_source = {
        "akshare-ohlcv": "akshare",
        "yfinance-ohlcv": "yfinance",
        "ccxt-ohlcv": "ccxt",
    }.get(adapter_id, "")
    matching_events = []
    for event in events or []:
        if not isinstance(event, dict) or event.get("adapterId") != adapter_id:
            continue
        payload = _provider_error_payload(event)
        if payload and (
            payload["source"].casefold().startswith(expected_source)
            or payload["source"].casefold() == "local-cache"
        ):
            matching_events.append(payload)
    return matching_events


def _provider_error_payload(event: dict[str, Any]) -> dict[str, str] | None:
    required = ["eventId", "createdAt", "adapterId", "provider", "market", "symbol", "timeframe", "source", "context", "message"]
    if not all(isinstance(event.get(field), str) for field in required):
        return None
    payload = {field: str(event[field]) for field in required}
    payload["category"] = _provider_error_category(
        message=payload["message"],
        source=payload["source"],
        context=payload["context"],
    )
    return payload


def _provider_error_category(*, message: str, source: str, context: str) -> str:
    text = " ".join([message, source, context]).lower()
    if any(marker in text for marker in ["429", "too many requests", "rate limit", "rate-limit", "throttle", "throttled", "quota"]):
        return "rate_limit"
    if any(marker in text for marker in ["not installed", "no module named", "module not found", "importerror", "dependency"]):
        return "dependency"
    if any(marker in text for marker in ["incomplete", "empty response", "no rows", "missing data", "insufficient data"]):
        return "incomplete_data"
    if any(marker in text for marker in ["timeout", "timed out", "connection", "network", "dns", "ssl", "socket", "unreachable"]):
        return "network"
    if any(marker in text for marker in ["http 5", "500", "502", "503", "504", "bad gateway", "service unavailable", "upstream"]):
        return "upstream"
    return "unknown"


def _provider_error_category_summary(events: list[dict[str, str]]) -> dict[str, int]:
    summary = {category: 0 for category in _PROVIDER_ERROR_CATEGORIES}
    for event in events:
        category = event.get("category", "unknown")
        if category not in summary:
            category = "unknown"
        summary[category] += 1
    return summary


def _dominant_provider_error_category(summary: dict[str, int]) -> str | None:
    non_zero_categories = [(category, count) for category, count in summary.items() if count > 0]
    if not non_zero_categories:
        return None
    return sorted(
        non_zero_categories,
        key=lambda item: (-item[1], _PROVIDER_ERROR_CATEGORY_PRIORITY.get(item[0], len(_PROVIDER_ERROR_CATEGORIES))),
    )[0][0]


def _provider_error_window_summary(
    events: list[dict[str, str]], *, generated_at: datetime
) -> dict[str, dict[str, Any]]:
    return {
        window: _provider_error_window_payload(events, generated_at=generated_at, seconds=seconds)
        for window, seconds in _PROVIDER_ERROR_WINDOWS.items()
    }


def _provider_error_window_payload(
    events: list[dict[str, str]], *, generated_at: datetime, seconds: int
) -> dict[str, Any]:
    window_events = _provider_error_events_in_window(events, generated_at=generated_at, seconds=seconds)

    latest_error_at = None
    if window_events:
        latest_event = max(window_events, key=lambda event: (event["createdAt"], event["eventId"]))
        latest_error_at = latest_event["createdAt"]

    category_summary = _provider_error_category_summary(window_events)
    return {
        "errorCount": len(window_events),
        "latestErrorAt": latest_error_at,
        "categorySummary": category_summary,
        "dominantCategory": _dominant_provider_error_category(category_summary),
    }


def _provider_error_events_in_window(
    events: list[dict[str, str]], *, generated_at: datetime, seconds: int
) -> list[dict[str, str]]:
    window_events = []
    for event in events:
        age_seconds = _provider_error_event_age_seconds(event, generated_at=generated_at)
        if age_seconds is not None and 0 <= age_seconds <= seconds:
            window_events.append(event)
    return window_events


def _provider_error_event_age_seconds(event: dict[str, str], *, generated_at: datetime) -> float | None:
    created_at = _parse_provider_error_timestamp(event.get("createdAt", ""))
    if created_at is None:
        return None
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    reference = generated_at if generated_at.tzinfo is not None else generated_at.replace(tzinfo=timezone.utc)
    return (reference.astimezone(timezone.utc) - created_at.astimezone(timezone.utc)).total_seconds()


def _parse_provider_error_timestamp(value: str) -> datetime | None:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _market_data_adapter_status_from_telemetry(telemetry: dict[str, Any]) -> str:
    if telemetry.get("status") == "degraded":
        return "degraded"
    return "ready" if telemetry.get("status") == "ok" else "blocked"


def _market_data_adapter_cache_diagnostics(market: str, cache_contexts: list[dict[str, Any]]) -> dict[str, Any]:
    matching_contexts = [context for context in cache_contexts if context.get("market") == market]
    freshness_summary = _cache_freshness_summary(matching_contexts)
    row_count = sum(_non_negative_int(context.get("rowCount")) for context in matching_contexts)
    return {
        "freshness": _market_data_adapter_cache_freshness(
            context_count=len(matching_contexts),
            row_count=row_count,
            freshness_summary=freshness_summary,
        ),
        "contextCount": len(matching_contexts),
        "rowCount": row_count,
        "latestTimestamp": _latest_cache_context_timestamp(matching_contexts),
        "freshnessSummary": freshness_summary,
    }


def _market_data_adapter_cache_freshness(
    *,
    context_count: int,
    row_count: int,
    freshness_summary: dict[str, int],
) -> str:
    if context_count <= 0 or row_count <= 0:
        return "empty"
    if freshness_summary.get("stale", 0) > 0:
        return "stale"
    if freshness_summary.get("fresh", 0) > 0:
        return "fresh"
    return "empty"


def _latest_cache_context_timestamp(contexts: list[dict[str, Any]]) -> str | None:
    end_timestamps = [
        context.get("endTimestamp") if isinstance(context.get("endTimestamp"), str) else None for context in contexts
    ]
    timestamps = [
        parsed
        for parsed in (_parse_timestamp(end_timestamp) for end_timestamp in end_timestamps)
        if parsed is not None
    ]
    if not timestamps:
        return None
    return max(timestamps).isoformat()


def build_execution_adapter_state_ledger(
    settings: dict[str, Any],
    *,
    generated_at: datetime | None = None,
) -> dict[str, Any]:
    """Build a read-only execution adapter state ledger from platform settings."""

    generated_timestamp = generated_at or datetime.now(timezone.utc)
    adapters = settings.get("executionAdapters") if isinstance(settings, dict) else []
    safety = settings.get("safety") if isinstance(settings, dict) else {}
    required_gates = [
        str(gate)
        for gate in (safety.get("requiredGates") if isinstance(safety, dict) else []) or []
        if str(gate).strip()
    ]
    adapter_payloads = [
        _execution_adapter_state_payload(adapter, required_gates=required_gates, generated_at=generated_timestamp)
        for adapter in adapters
        if isinstance(adapter, dict)
    ]
    live_adapters = [adapter for adapter in adapter_payloads if adapter["route"] == "live"]
    status_counts = _string_counts(adapter["currentState"] for adapter in adapter_payloads)
    return {
        "schemaVersion": 1,
        "generatedAt": generated_timestamp.isoformat(),
        "mode": "execution_adapter_state_ledger",
        "liveTradingAllowed": bool(safety.get("liveTradingAllowed")) if isinstance(safety, dict) else False,
        "requiredGates": required_gates,
        "summary": {
            "adapterCount": len(adapter_payloads),
            "liveAdapterCount": len(live_adapters),
            "certifiedLiveAdapters": sum(1 for adapter in live_adapters if adapter["liveTradingAllowed"]),
            "paperReadyAdapters": sum(1 for adapter in adapter_payloads if adapter["currentState"] == "paper_ready"),
            "blockedLiveAdapters": sum(1 for adapter in live_adapters if not adapter["liveTradingAllowed"]),
            "configRequiredAdapters": sum(1 for adapter in adapter_payloads if adapter["currentState"] == "config_required"),
            "requiredGateCount": len(required_gates),
            "stateCounts": status_counts,
        },
        "adapters": adapter_payloads,
    }


def _normalize_cache_stats(cache_stats: dict[str, Any] | None) -> dict[str, int | str | None]:
    if not cache_stats:
        return {"row_count": 0, "context_count": 0, "latest_timestamp": None}
    latest_timestamp = cache_stats.get("latest_timestamp")
    return {
        "row_count": _non_negative_int(cache_stats.get("row_count")),
        "context_count": _non_negative_int(cache_stats.get("context_count")),
        "latest_timestamp": latest_timestamp if isinstance(latest_timestamp, str) else None,
    }


def _cache_context_to_payload(context: dict[str, Any], *, generated_at: datetime) -> dict[str, int | str | None]:
    row_count = _non_negative_int(context.get("row_count"))
    end_timestamp = context.get("end_timestamp") if isinstance(context.get("end_timestamp"), str) else None
    freshness, age_hours = _cache_context_freshness(
        row_count=row_count,
        timeframe=str(context.get("timeframe") or ""),
        end_timestamp=end_timestamp,
        generated_at=generated_at,
    )
    return {
        "market": str(context.get("market") or ""),
        "symbol": str(context.get("symbol") or ""),
        "timeframe": str(context.get("timeframe") or ""),
        "rowCount": row_count,
        "startTimestamp": context.get("start_timestamp") if isinstance(context.get("start_timestamp"), str) else None,
        "endTimestamp": end_timestamp,
        "freshness": freshness,
        "ageHours": age_hours,
    }


def _cache_freshness_summary(contexts: list[dict[str, Any]]) -> dict[str, int]:
    summary = {"fresh": 0, "stale": 0, "empty": 0}
    for context in contexts:
        freshness = context.get("freshness")
        if freshness in summary:
            summary[freshness] += 1
    return summary


def _execution_adapter_state_payload(
    adapter: dict[str, Any],
    *,
    required_gates: list[str],
    generated_at: datetime,
) -> dict[str, Any]:
    adapter_id = str(adapter.get("id") or "")
    route = str(adapter.get("route") or "")
    status = str(adapter.get("status") or "")
    live_trading_allowed = bool(adapter.get("liveTradingAllowed")) and route == "live"
    current_state = _execution_adapter_current_state(route=route, status=status, live_trading_allowed=live_trading_allowed)
    gates = _execution_adapter_gates(
        adapter=adapter,
        current_state=current_state,
        required_gates=required_gates,
    )
    return {
        "id": adapter_id,
        "market": str(adapter.get("market") or ""),
        "adapter": str(adapter.get("adapter") or ""),
        "route": route,
        "status": status,
        "certification": str(adapter.get("certification") or ""),
        "currentState": current_state,
        "liveTradingAllowed": live_trading_allowed,
        "note": str(adapter.get("note") or ""),
        "nextStep": _execution_adapter_next_step(adapter, current_state=current_state),
        "gates": gates,
        "events": [
            {
                "eventId": f"adapter-ledger:{adapter_id}:{_execution_adapter_event_state(current_state)}",
                "adapterId": adapter_id,
                "timestamp": generated_at.isoformat(),
                "state": _execution_adapter_event_state(current_state),
                "label": _execution_adapter_state_label(current_state),
                "actor": "execution-safety",
                "source": "settings-status",
                "reason": _execution_adapter_event_reason(adapter, current_state=current_state),
                "liveTradingAllowed": live_trading_allowed,
            }
        ],
    }


def _execution_adapter_current_state(*, route: str, status: str, live_trading_allowed: bool) -> str:
    if route == "paper" and status == "paper_ready":
        return "paper_ready"
    if route == "live" and live_trading_allowed:
        return "live_ready"
    if status == "config_required":
        return "config_required"
    if status == "interface_only":
        return "blocked"
    if status == "blocked":
        return "blocked"
    return status or "unknown"


def _execution_adapter_gates(
    *,
    adapter: dict[str, Any],
    current_state: str,
    required_gates: list[str],
) -> list[dict[str, Any]]:
    if str(adapter.get("route") or "") == "paper":
        return [
            {
                "id": "paper-order-risk",
                "label": "Paper risk check",
                "passed": current_state == "paper_ready",
                "reason": "Local audited run, paper order, and risk checks are available before simulated fills.",
            }
        ]
    return [
        {
            "id": gate,
            "label": _execution_adapter_gate_label(gate),
            "passed": False,
            "reason": _execution_adapter_gate_reason(gate, adapter),
        }
        for gate in required_gates
    ]


def _execution_adapter_event_state(current_state: str) -> str:
    if current_state == "blocked":
        return "live_blocked"
    if current_state == "live_ready":
        return "live_ready"
    if current_state == "config_required":
        return "config_required"
    return current_state


def _execution_adapter_state_label(current_state: str) -> str:
    labels = {
        "paper_ready": "Paper adapter ready",
        "live_ready": "Live route ready",
        "blocked": "Live route blocked",
        "config_required": "Configuration required",
    }
    return labels.get(current_state, current_state.replace("_", " ").title())


def _execution_adapter_event_reason(adapter: dict[str, Any], *, current_state: str) -> str:
    note = str(adapter.get("note") or "").strip()
    if current_state == "paper_ready":
        return note or "Paper execution is available locally after audited run and risk checks."
    if current_state == "config_required":
        return note or "Adapter configuration is required before certification can start."
    if current_state == "live_ready":
        return note or "Live adapter certification is complete, but order routing still requires explicit controls."
    return "Live execution remains blocked until adapter certification, risk approval, and human confirmation pass."


def _execution_adapter_next_step(adapter: dict[str, Any], *, current_state: str) -> str:
    if current_state == "paper_ready":
        return "Use paper execution for audited research runs before certifying live adapters."
    if current_state == "config_required":
        return "Configure sandbox credentials, order lifecycle tests, and emergency-stop limits before certification."
    if current_state == "live_ready":
        return "Keep human confirmation and risk approval gates attached to every promoted order."
    note = str(adapter.get("note") or "").strip()
    return note or "Keep live trading blocked until a legal adapter certification passes."


def _execution_adapter_gate_label(gate: str) -> str:
    return {
        "adapter-certified": "Adapter certified",
        "risk-approved": "Risk approved",
        "human-confirmed": "Human confirmed",
    }.get(gate, gate.replace("-", " ").title())


def _execution_adapter_gate_reason(gate: str, adapter: dict[str, Any]) -> str:
    if gate == "adapter-certified":
        return str(adapter.get("note") or "No certified live adapter is connected.")
    if gate == "risk-approved":
        return "Live routing requires an audited risk approval for the selected run and adapter."
    if gate == "human-confirmed":
        return "Live routing requires explicit human confirmation after adapter and risk checks."
    return "Required live execution gate is not satisfied."


def _string_counts(values: Any) -> dict[str, int]:
    counts: dict[str, int] = {}
    for value in values:
        key = str(value or "")
        if not key:
            continue
        counts[key] = counts.get(key, 0) + 1
    return dict(sorted(counts.items()))


def _cache_context_freshness(
    *, row_count: int, timeframe: str, end_timestamp: str | None, generated_at: datetime
) -> tuple[str, int | None]:
    end = _parse_timestamp(end_timestamp)
    if row_count <= 0 or end is None:
        return "empty", None
    reference = generated_at if generated_at.tzinfo else generated_at.replace(tzinfo=timezone.utc)
    age_hours = max(0, int((reference.astimezone(timezone.utc) - end).total_seconds() // 3600))
    fresh_threshold_hours = {"1d": 96, "1w": 240}.get(timeframe, 24)
    return ("fresh" if age_hours <= fresh_threshold_hours else "stale"), age_hours


def _parse_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None
    normalized = value[:-1] + "+00:00" if value.endswith("Z") else value
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _non_negative_int(value: object) -> int:
    if isinstance(value, bool):
        return 0
    if isinstance(value, int) and value >= 0:
        return value
    return 0
