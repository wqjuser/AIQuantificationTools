from __future__ import annotations

from threading import Event
import unittest

from quant_core.market_ai_selection_core.automatic_review import (
    MarketAiSelectionReviewRunner,
)


class MarketAiSelectionReviewRunnerTest(unittest.TestCase):
    def test_runner_obeys_lease_and_stops(self) -> None:
        called = Event()
        lease = {"allowed": False}
        runner = MarketAiSelectionReviewRunner(
            called.set,
            interval_seconds=0.01,
            acquire_lease=lambda: lease["allowed"],
        )

        runner.start()
        self.assertFalse(called.wait(0.03))
        lease["allowed"] = True
        self.assertTrue(called.wait(0.1))
        runner.stop()

        self.assertFalse(runner.running)


if __name__ == "__main__":
    unittest.main()
