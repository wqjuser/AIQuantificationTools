from __future__ import annotations

from urllib.parse import unquote

from quant_core.strategy_experiments import StrategyExperimentError


def promotion_experiment_id(path: str) -> str | None:
    prefix = "/api/strategy-experiments/"
    suffix = "/promotion"
    if not path.startswith(prefix) or not path.endswith(suffix):
        return None
    experiment_id = unquote(path[len(prefix) : -len(suffix)]).strip()
    return experiment_id or None


def post_strategy_experiment_promotion(self, parsed, experiment_id: str) -> None:
    try:
        payload = self._read_json_body()
        if not isinstance(payload, dict) or set(payload) != {
            "freshSourceRunId",
            "operator",
            "confirmed",
        }:
            raise ValueError("invalid_strategy_experiment_promotion")
        fresh_source_run_id = payload.get("freshSourceRunId")
        operator = payload.get("operator")
        confirmed = payload.get("confirmed")
        if (
            not isinstance(fresh_source_run_id, str)
            or not fresh_source_run_id.strip()
            or not isinstance(operator, str)
            or not operator.strip()
            or not isinstance(confirmed, bool)
        ):
            raise ValueError("invalid_strategy_experiment_promotion")
    except ValueError:
        self._send_json(
            {
                "error": "invalid_strategy_experiment_promotion",
                "detail": "Strategy experiment promotion fields are invalid.",
            },
            status=400,
        )
        return

    try:
        promotion = self._strategy_experiment_runner().promote_winner(
            experiment_id,
            fresh_source_run_id=fresh_source_run_id.strip(),
            operator=operator.strip(),
            confirmed=confirmed,
        )
    except StrategyExperimentError as error:
        self._send_json(
            {"error": error.error, "detail": error.detail},
            status=error.status,
        )
        return
    except Exception:
        self._send_json(
            {
                "error": "strategy_experiment_promotion_failed",
                "detail": "Strategy experiment promotion failed.",
            },
            status=500,
        )
        return
    self._send_json({"promotion": promotion}, status=201)
