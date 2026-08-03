from __future__ import annotations

import argparse
import os
from pathlib import Path
import sys

from sqlalchemy import create_engine

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "services" / "quant_core"))

from quant_core.public_identity import PublicIdentityStore


def main() -> None:
    parser = argparse.ArgumentParser(description="Manage AIQT public users.")
    parser.add_argument("action", choices=("disable",))
    parser.add_argument("--owner-id", required=True)
    parser.add_argument("--database-url", default=os.environ.get("AIQT_DATABASE_URL", ""))
    args = parser.parse_args()
    if not args.database_url:
        parser.error("--database-url is required")
    engine = create_engine(args.database_url, pool_pre_ping=True)
    try:
        PublicIdentityStore(engine).disable(args.owner_id)
        print(f"disabled {args.owner_id}")
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
