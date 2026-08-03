from __future__ import annotations

import json
import select
import socket
from dataclasses import asdict
from datetime import datetime
from pathlib import Path
from quant_core.audit_events import AuditEventStore

def _json_default(value):
    if isinstance(value, datetime):
        return value.isoformat()
    if hasattr(value, "__dataclass_fields__"):
        return asdict(value)
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def _response(payload: object) -> bytes:
    return json.dumps(payload, ensure_ascii=False, default=_json_default).encode("utf-8")


def _client_connection_closed(connection: socket.socket) -> bool:
    try:
        readable, _, _ = select.select([connection], [], [], 0)
    except (OSError, ValueError):
        return True
    if not readable:
        return False
    try:
        return connection.recv(1, socket.MSG_PEEK) == b""
    except (BlockingIOError, InterruptedError):
        return False
    except OSError:
        return True


def _execution_adapter_secret_store_root(audit_event_store: AuditEventStore) -> Path:
    store_path = getattr(audit_event_store, "path", None)
    if store_path:
        return Path(store_path).parent / "secret-store"
    return Path("data") / "secret-store"
