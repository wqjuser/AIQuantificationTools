from __future__ import annotations

from ..support.market_data import _stage1_daily_use_project_root
from pathlib import Path
from quant_core.audit_events import audit_event_record_to_payload
from quant_core.desktop_release import load_desktop_release_status
from quant_core.p1_acceptance import load_p1_acceptance_status
from quant_core.p2_acceptance import load_p2_pre_live_acceptance_status
from quant_core.p2_manifest_chain_preflight import (
    build_p2_manifest_chain_preflight,
    load_p2_manifest_chain_preflight_status,
    p2_manifest_chain_preflight_to_audit_event_payload,
    write_p2_manifest_chain_preflight_report,
)
from quant_core.p2_paper_replay import load_p2_paper_replay_status
from quant_core.p2_readiness_acceptance import (
    build_p2_readiness_acceptance_manifest_from_reports,
    load_p2_readiness_acceptance_status,
    p2_readiness_acceptance_to_audit_event_payload,
    write_p2_readiness_acceptance_report,
)
from quant_core.stage1_bootstrap_preflight import (
    load_stage1_bootstrap_preflight_status,
    write_stage1_bootstrap_preflight,
)
from quant_core.stage1_daily_use import (
    load_stage1_daily_use_status,
    write_stage1_daily_use_report,
)
from quant_core.stage5_exit import load_stage5_exit_acceptance_status
from quant_core.stage6_exit import load_stage6_exit_acceptance_status

def post_stage1_daily_use(self, parsed):
    try:
        report_path = Path(self.stage1_daily_use_report_path)
        write_stage1_daily_use_report(
            project_root=_stage1_daily_use_project_root(report_path),
            output_path=report_path,
            p0_path=Path(self.p0_acceptance_report_path),
            p1_path=Path(self.p1_acceptance_report_path),
            desktop_path=Path(self.desktop_release_report_path),
        )
        daily_use = load_stage1_daily_use_status(report_path)
    except (OSError, ValueError) as error:
        self._send_json({"error": "invalid_stage1_daily_use", "detail": str(error)}, status=400)
        return
    self._send_json(
        {
            "status": "daily_use_generated",
            "dailyUse": daily_use,
            "paperOnly": True,
            "orderSubmissionEnabled": False,
            "liveTradingAllowed": False,
            "liveOrderSubmitted": False,
            "routeExecuted": False,
        },
        status=201,
    )
    return


def post_stage1_bootstrap_preflight(self, parsed):
    try:
        report_path = Path(self.stage1_bootstrap_preflight_report_path)
        write_stage1_bootstrap_preflight(
            project_root=_stage1_daily_use_project_root(report_path),
            output_path=report_path,
        )
        preflight = load_stage1_bootstrap_preflight_status(report_path)
    except (OSError, ValueError) as error:
        self._send_json({"error": "invalid_stage1_bootstrap_preflight", "detail": str(error)}, status=400)
        return
    self._send_json(
        {
            "status": "preflight_generated",
            "preflight": preflight,
            "paperOnly": True,
            "orderSubmissionEnabled": False,
            "liveTradingAllowed": False,
            "liveOrderSubmitted": False,
            "routeExecuted": False,
        },
        status=201,
    )
    return


def post_p2_readiness_acceptance(self, parsed):
    try:
        manifest = build_p2_readiness_acceptance_manifest_from_reports(
            p1_acceptance_report=Path(self.p1_acceptance_report_path),
            p2_paper_replay_report=Path(self.p2_paper_replay_report_path),
            p2_pre_live_acceptance_report=Path(self.p2_pre_live_acceptance_report_path),
            base_url="",
            run_id="run-p2-readiness",
        )
        write_p2_readiness_acceptance_report(
            Path(self.p2_readiness_acceptance_report_path),
            manifest,
        )
        audit_event = self.audit_event_store.record(
            p2_readiness_acceptance_to_audit_event_payload(
                manifest,
                source_path=Path(self.p2_readiness_acceptance_report_path),
            )
        )
        acceptance = load_p2_readiness_acceptance_status(
            Path(self.p2_readiness_acceptance_report_path)
        )
    except (OSError, ValueError) as error:
        self._send_json({"error": "invalid_p2_readiness_acceptance", "detail": str(error)}, status=400)
        return
    self._send_json(
        {
            "status": "acceptance_generated",
            "acceptance": acceptance,
            "auditEvent": audit_event_record_to_payload(audit_event),
            "paperOnly": True,
            "orderSubmissionEnabled": False,
            "liveTradingAllowed": False,
            "liveOrderSubmitted": False,
            "routeExecuted": False,
        },
        status=201,
    )
    return


def post_p2_manifest_chain_preflight(self, parsed):
    try:
        manifest = build_p2_manifest_chain_preflight(
            p1_acceptance_report=Path(self.p1_acceptance_report_path),
            p2_paper_replay_report=Path(self.p2_paper_replay_report_path),
            p2_pre_live_acceptance_report=Path(self.p2_pre_live_acceptance_report_path),
            p2_readiness_acceptance_report=Path(self.p2_readiness_acceptance_report_path),
        )
        write_p2_manifest_chain_preflight_report(
            Path(self.p2_manifest_chain_preflight_report_path),
            manifest,
        )
        audit_event = self.audit_event_store.record(
            p2_manifest_chain_preflight_to_audit_event_payload(
                manifest,
                source_path=Path(self.p2_manifest_chain_preflight_report_path),
            )
        )
        preflight = load_p2_manifest_chain_preflight_status(
            Path(self.p2_manifest_chain_preflight_report_path)
        )
    except (OSError, ValueError) as error:
        self._send_json({"error": "invalid_p2_manifest_chain_preflight", "detail": str(error)}, status=400)
        return
    self._send_json(
        {
            "status": "preflight_generated",
            "preflight": preflight,
            "auditEvent": audit_event_record_to_payload(audit_event),
            "paperOnly": True,
            "orderSubmissionEnabled": False,
            "liveTradingAllowed": False,
            "liveOrderSubmitted": False,
            "routeExecuted": False,
        },
        status=201,
    )
    return


def get_p1_acceptance_latest(self, parsed):
    self._send_json({"acceptance": load_p1_acceptance_status(Path(self.p1_acceptance_report_path))})
    return


def get_desktop_release_latest(self, parsed):
    self._send_json({"release": load_desktop_release_status(Path(self.desktop_release_report_path))})
    return


def get_stage1_daily_use_latest(self, parsed):
    self._send_json({"dailyUse": load_stage1_daily_use_status(Path(self.stage1_daily_use_report_path))})
    return


def get_stage1_bootstrap_preflight_latest(self, parsed):
    self._send_json(
        {"preflight": load_stage1_bootstrap_preflight_status(Path(self.stage1_bootstrap_preflight_report_path))}
    )
    return


def get_p2_pre_live_acceptance_latest(self, parsed):
    self._send_json(
        {"acceptance": load_p2_pre_live_acceptance_status(Path(self.p2_pre_live_acceptance_report_path))}
    )
    return


def get_p2_paper_replay_latest(self, parsed):
    self._send_json({"replay": load_p2_paper_replay_status(Path(self.p2_paper_replay_report_path))})
    return


def get_p2_readiness_acceptance_latest(self, parsed):
    self._send_json(
        {"acceptance": load_p2_readiness_acceptance_status(Path(self.p2_readiness_acceptance_report_path))}
    )
    return


def get_stage5_exit_acceptance_latest(self, parsed):
    self._send_json(
        {"acceptance": load_stage5_exit_acceptance_status(Path(self.stage5_exit_acceptance_report_path))}
    )
    return


def get_stage6_exit_acceptance_latest(self, parsed):
    self._send_json(
        {"acceptance": load_stage6_exit_acceptance_status(Path(self.stage6_exit_acceptance_report_path))}
    )
    return


def get_p2_manifest_chain_preflight_latest(self, parsed):
    self._send_json(
        {"preflight": load_p2_manifest_chain_preflight_status(Path(self.p2_manifest_chain_preflight_report_path))}
    )
    return
