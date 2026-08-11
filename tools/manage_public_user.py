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
    actions = parser.add_subparsers(dest="action", required=True)
    disable = actions.add_parser("disable", help="Disable an existing public user.")
    disable.add_argument("--owner-id", required=True)
    disable.add_argument(
        "--database-url",
        default=os.environ.get("AIQT_DATABASE_URL", ""),
    )
    rebind = actions.add_parser(
        "rebind-identity",
        help="Atomically move one tenant from an old OIDC identity to a new one.",
    )
    rebind.add_argument("--owner-id", required=True)
    rebind.add_argument("--expected-issuer", required=True)
    rebind.add_argument("--expected-subject", required=True)
    rebind.add_argument("--issuer", required=True)
    rebind.add_argument("--subject", required=True)
    rebind.add_argument("--email", required=True)
    rebind.add_argument(
        "--database-url",
        default=os.environ.get("AIQT_DATABASE_URL", ""),
    )
    args = parser.parse_args()
    if not args.database_url:
        parser.error("--database-url is required")
    engine = create_engine(args.database_url, pool_pre_ping=True)
    try:
        store = PublicIdentityStore(engine)
        if args.action == "disable":
            store.disable(args.owner_id)
            print(f"disabled {args.owner_id}")
        else:
            user = store.rebind_identity(
                owner_id=args.owner_id,
                expected_issuer=args.expected_issuer,
                expected_subject=args.expected_subject,
                issuer=args.issuer,
                subject=args.subject,
                email=args.email,
            )
            print(
                "rebound "
                f"{user.owner_id} to issuer={user.issuer} subject={user.subject}"
            )
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
