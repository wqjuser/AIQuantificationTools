from __future__ import annotations

from urllib.parse import unquote

from quant_core.strategy_research import StrategyResearchError
from quant_core.strategy_experiments import StrategyExperimentError


def get_strategy_research_capabilities(self, parsed) -> None:
    del parsed
    self._send_json(
        {
            "capabilities": self._strategy_research_capability_registry().capability_payloads()
        }
    )


def post_strategy_research_proposals(self, parsed) -> None:
    del parsed
    try:
        payload = self._read_json_body()
        proposal = self._strategy_research_orchestrator().propose(payload)
    except StrategyResearchError as error:
        if error.code == "strategy_research_source_run_not_found":
            status = 404
        elif error.code in {
            "invalid_strategy_research_proposal",
            "strategy_research_provider_approval_invalid",
            "strategy_research_template_scope_invalid",
            "strategy_research_template_unknown",
        }:
            status = 400
        else:
            status = 409
        self._send_json(
            {"error": error.code, "detail": error.detail},
            status=status,
        )
        return
    except ValueError:
        self._send_json(
            {
                "error": "invalid_strategy_research_proposal",
                "detail": "Strategy research proposal fields are invalid.",
            },
            status=400,
        )
        return

    self._send_json({"proposal": proposal})


def post_strategy_research_launches(self, parsed) -> None:
    del parsed
    try:
        payload = self._read_json_body()
        if not isinstance(payload, dict) or set(payload) != {
            "proposalId",
            "operator",
            "confirmed",
        }:
            raise StrategyResearchError(
                "invalid_strategy_research_launch",
                "Strategy research launch fields or confirmation are invalid.",
            )
        launch = self._strategy_research_orchestrator().launch(
            payload.get("proposalId"),
            operator=payload.get("operator"),
            confirmed=payload.get("confirmed"),
        )
    except StrategyResearchError as error:
        status = (
            404
            if error.code == "strategy_research_proposal_not_found"
            else 400
            if error.code == "invalid_strategy_research_launch"
            else 409
        )
        self._send_json(
            {"error": error.code, "detail": error.detail},
            status=status,
        )
        return
    except StrategyExperimentError as error:
        self._send_json(
            {"error": error.error, "detail": error.detail},
            status=error.status,
        )
        return
    except ValueError:
        self._send_json(
            {
                "error": "invalid_strategy_research_launch",
                "detail": "Strategy research launch fields or confirmation are invalid.",
            },
            status=400,
        )
        return

    self._send_json({"launch": launch}, status=201)


def get_strategy_research_experiment(self, parsed) -> None:
    prefix = "/api/strategy-research/experiments/"
    experiment_id = unquote(parsed.path.removeprefix(prefix)).strip()
    try:
        research = self._strategy_research_orchestrator().read(experiment_id)
    except StrategyResearchError as error:
        self._send_json(
            {"error": error.code, "detail": error.detail},
            status=(
                404
                if error.code == "strategy_research_experiment_not_found"
                else 409
            ),
        )
        return
    self._send_json({"research": research})
