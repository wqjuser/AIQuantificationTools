from __future__ import annotations

from ..support.ai_validation import _optional_dependency_install_request_allowed
from quant_core.ai_review_providers import (
    AiReviewProviderError,
    discover_openai_compatible_models,
)
from quant_core.live_quotes import workspace_with_live_quotes
from quant_core.settings import (
    INSTALLABLE_OPTIONAL_DATA_DEPENDENCIES,
    install_optional_data_dependency,
)
from quant_core.terminal import (
    build_terminal_workspace,
    terminal_workspace_to_payload,
)
from quant_core.watchlist import (
    instrument_to_payload,
    watchlist_from_payload,
)
from quant_core.workspace_state import research_workspace_state_to_payload
from urllib.parse import parse_qs

def put_settings_configuration(self, parsed):
    try:
        payload = self._read_json_body()
        self.platform_settings_store.save(
            payload.get("configuration"),
            payload.get("secretUpdates"),
            payload.get("clearSecrets"),
            self._platform_settings_base_environment(),
        )
        self._reload_platform_runtime()
    except ValueError as error:
        self._send_json(
            {"error": "invalid_platform_settings", "detail": str(error)},
            status=400,
        )
        return
    self._send_json({"settings": self._settings_status_payload()})
    return


def put_watchlist(self, parsed):
    try:
        payload = self._read_json_body()
        instruments = watchlist_from_payload(payload.get("watchlist"))
        watchlist = self.watchlist_store.replace_all(instruments)
    except ValueError as error:
        self._send_json({"error": "invalid_watchlist", "detail": str(error)}, status=400)
        return
    self._send_json({"watchlist": [instrument_to_payload(instrument) for instrument in watchlist]})
    return


def post_optional_dependency_install(self, parsed, optional_dependency):
    if not _optional_dependency_install_request_allowed(
        intent=self.headers.get("X-AIQT-Install-Intent"),
        fetch_site=self.headers.get("Sec-Fetch-Site"),
        origin=self.headers.get("Origin"),
        host=self.headers.get("Host"),
    ):
        self._send_json(
            {"error": "optional_data_dependency_install_forbidden"},
            status=403,
        )
        return
    if optional_dependency not in INSTALLABLE_OPTIONAL_DATA_DEPENDENCIES:
        self._send_json(
            {
                "error": "optional_data_dependency_not_supported",
                "detail": "Only akshare and yfinance can be installed at runtime.",
            },
            status=400,
        )
        return
    try:
        if self._read_json_body():
            raise ValueError("optional_data_dependency_install_body_must_be_empty")
    except ValueError as error:
        self._send_json(
            {
                "error": "invalid_optional_data_dependency_install_request",
                "detail": str(error),
            },
            status=400,
        )
        return
    lock = type(self).optional_dependency_install_lock
    if not lock.acquire(blocking=False):
        self._send_json(
            {
                "error": "optional_data_dependency_install_in_progress",
                "detail": "Another optional dependency installation is already running.",
            },
            status=409,
        )
        return
    try:
        installed = install_optional_data_dependency(optional_dependency)
    except RuntimeError as error:
        code = str(error)
        self._send_json(
            {"error": code, "detail": f"{optional_dependency} installation failed."},
            status=504 if code.endswith("_timeout") else 502,
        )
        return
    finally:
        lock.release()
    self._send_json(
        {
            "dependencyInstallation": {
                "dependency": optional_dependency,
                "installed": True,
                "alreadyInstalled": not installed,
            },
            "settings": self._settings_status_payload(),
        },
        status=201 if installed else 200,
    )
    return


def get_health(self, parsed):
    self._send_json({"status": "ok", "service": "quant-core"})
    return


def get_local_auth_session(self, parsed):
    self._send_json({"deploymentMode": "local", "authenticated": False})
    return


def get_demo(self, parsed):
    query = parse_qs(parsed.query)
    payload = self._demo_payload(
        market=query.get("market", ["ashare"])[0],
        symbol=query.get("symbol", ["600000"])[0],
        timeframe=query.get("timeframe", ["1d"])[0],
    )
    self._send_json(payload)
    return


def get_workspace(self, parsed):
    workspace = self._workspace_with_saved_watchlist()
    saved_state = self.workspace_state_store.get()
    workspace, _quotes = workspace_with_live_quotes(workspace, self.quote_adapter)
    payload = terminal_workspace_to_payload(workspace)
    if saved_state:
        payload["researchWorkspaceState"] = research_workspace_state_to_payload(saved_state)
    self._send_json(payload)
    return


def get_watchlist(self, parsed):
    watchlist = self.watchlist_store.list_instruments() or build_terminal_workspace().watchlist
    self._send_json({"watchlist": [instrument_to_payload(instrument) for instrument in watchlist]})
    return


def get_settings_status(self, parsed):
    probe = parse_qs(parsed.query).get("probe", [""])[0] == "free-stockdb"
    self._send_json({
        "settings": self._settings_status_payload(
            free_stockdb_probe_succeeded=self._probe_free_stockdb() if probe else None,
        ),
    })
    return


def get_settings_openai_compatible_models(self, parsed):
    environment = self._effective_platform_settings_environment()
    base_url = parse_qs(parsed.query).get(
        "baseUrl",
        [environment.get("OPENAI_COMPATIBLE_BASE_URL", "")],
    )[0].strip()
    try:
        api_key = environment.get("OPENAI_COMPATIBLE_API_KEY", "")
        allowed_origins = tuple(
            value.strip()
            for value in environment.get("AIQT_OUTBOUND_ORIGIN_ALLOWLIST", "").split(",")
            if value.strip()
        )
        models = (
            discover_openai_compatible_models(
                base_url,
                api_key,
                allowed_origins=allowed_origins,
            )
            if environment.get("AIQT_DEPLOYMENT_MODE", "").strip().lower()
            == "public"
            else discover_openai_compatible_models(base_url, api_key)
        )
    except AiReviewProviderError as error:
        self._send_json(
            {"error": error.code, "detail": error.detail},
            status=502,
        )
        return
    except ValueError as error:
        self._send_json(
            {"error": "invalid_openai_compatible_base_url", "detail": str(error)},
            status=400,
        )
        return
    self._send_json({"models": list(models)})
    return
