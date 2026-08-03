from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import sys

from sqlalchemy import create_engine

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "services" / "quant_core"))

from quant_core.public_migration import LocalDataMigrator
from quant_core.tenant_crypto import TenantSecretCipher


def main() -> None:
    parser = argparse.ArgumentParser(description="Migrate local AIQT data into one public tenant.")
    parser.add_argument("mode", choices=("inventory", "dry-run", "apply"))
    parser.add_argument("--database-url", default=os.environ.get("AIQT_DATABASE_URL", ""))
    parser.add_argument("--master-key", default=os.environ.get("AIQT_SETTINGS_MASTER_KEY", ""))
    parser.add_argument(
        "--source-master-key",
        default=os.environ.get("AIQT_SOURCE_SETTINGS_MASTER_KEY", ""),
    )
    parser.add_argument("--issuer", required=True)
    parser.add_argument("--subject", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--data-dir", default=str(PROJECT_ROOT / "data"))
    parser.add_argument("--backup-root")
    args = parser.parse_args()
    if not args.database_url or not args.master_key:
        parser.error("--database-url and --master-key are required")
    engine = create_engine(args.database_url, pool_pre_ping=True)
    try:
        migrator = LocalDataMigrator(
            engine,
            TenantSecretCipher(args.master_key),
            args.data_dir,
            issuer=args.issuer,
            subject=args.subject,
            email=args.email,
            source_environment={
                **os.environ,
                "AIQT_SOURCE_SETTINGS_MASTER_KEY": args.source_master_key,
            },
        )
        result = (
            {"mode": "inventory", **migrator.inventory().summary()}
            if args.mode == "inventory"
            else migrator.dry_run()
            if args.mode == "dry-run"
            else migrator.apply(backup_root=args.backup_root)
        )
        print(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
