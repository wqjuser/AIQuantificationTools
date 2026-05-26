from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / "services" / "quant_core"
sys.path.insert(0, str(CORE))

from quant_core.api import run


if __name__ == "__main__":
    run()
