from __future__ import annotations

import unittest

from tools.m0_execution_acceptance import build_manifest, validate_manifest


def _snapshot(mode: str) -> dict:
    return {
        "state": {
            "enabled": False,
            "status": "paused",
            "executionMode": mode,
            "tradeCount": 0,
            "position": 0.0,
            "lastTrade": None,
            "lastTestnetOrder": None,
            "lastLiveOrder": None,
        },
        "paperOnly": mode == "paper",
        "sandboxOnly": mode == "testnet",
        "sandboxOrderSubmissionEnabled": False,
        "sandboxRouteExecuted": False,
        "liveTradingAllowed": False,
        "orderSubmissionEnabled": False,
        "routeExecuted": False,
        "liveBlockedBoundary": True,
    }


class M0ExecutionAcceptanceTests(unittest.TestCase):
    def test_three_disabled_modes_survive_api_restart_without_external_writes(self) -> None:
        snapshots = [
            (_snapshot(mode), _snapshot(mode))
            for mode in ("paper", "testnet", "live")
        ]

        manifest = build_manifest(
            snapshots,
            api_healthy=True,
            web_healthy=True,
            web_restarted=True,
            deterministic_suite_passed=True,
        )

        self.assertEqual(
            validate_manifest(manifest),
            "m0 execution acceptance=accepted",
        )
        self.assertEqual(
            [row["mode"] for row in manifest["modes"]],
            ["paper", "testnet", "live"],
        )
        self.assertTrue(all(row["restartExact"] for row in manifest["modes"]))
        self.assertTrue(manifest["safety"]["noExternalWrites"])


if __name__ == "__main__":
    unittest.main()
