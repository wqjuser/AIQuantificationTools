from __future__ import annotations

import base64
from dataclasses import fields, is_dataclass
from datetime import datetime
from enum import Enum
from importlib import import_module
from typing import Any


def encode_tenant_model(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, datetime):
        return {"$datetime": value.isoformat()}
    if isinstance(value, bytes):
        return {"$bytes": base64.b64encode(value).decode("ascii")}
    if isinstance(value, Enum):
        return {
            "$enum": _type_name(type(value)),
            "value": encode_tenant_model(value.value),
        }
    if is_dataclass(value):
        return {
            "$dataclass": _type_name(type(value)),
            "fields": {
                field.name: encode_tenant_model(getattr(value, field.name))
                for field in fields(value)
            },
        }
    if isinstance(value, dict):
        return {str(key): encode_tenant_model(item) for key, item in value.items()}
    if isinstance(value, list):
        return [encode_tenant_model(item) for item in value]
    if isinstance(value, tuple):
        return {"$tuple": [encode_tenant_model(item) for item in value]}
    if isinstance(value, (set, frozenset)):
        return {
            "$set": [encode_tenant_model(item) for item in value],
            "frozen": isinstance(value, frozenset),
        }
    raise TypeError(f"tenant_model_type_unsupported:{type(value).__name__}")


def decode_tenant_model(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, list):
        return [decode_tenant_model(item) for item in value]
    if not isinstance(value, dict):
        raise ValueError("tenant_model_payload_invalid")
    if set(value) == {"$datetime"}:
        return datetime.fromisoformat(str(value["$datetime"]))
    if set(value) == {"$bytes"}:
        return base64.b64decode(str(value["$bytes"]), validate=True)
    if set(value) == {"$tuple"} and isinstance(value["$tuple"], list):
        return tuple(decode_tenant_model(item) for item in value["$tuple"])
    if set(value) == {"$set", "frozen"} and isinstance(value["$set"], list):
        decoded = {decode_tenant_model(item) for item in value["$set"]}
        return frozenset(decoded) if value["frozen"] is True else decoded
    if set(value) == {"$enum", "value"}:
        model_type = _load_type(str(value["$enum"]))
        if not issubclass(model_type, Enum):
            raise ValueError("tenant_model_enum_invalid")
        return model_type(decode_tenant_model(value["value"]))
    if set(value) == {"$dataclass", "fields"} and isinstance(value["fields"], dict):
        model_type = _load_type(str(value["$dataclass"]))
        if not is_dataclass(model_type):
            raise ValueError("tenant_model_dataclass_invalid")
        return model_type(
            **{
                str(key): decode_tenant_model(item)
                for key, item in value["fields"].items()
            }
        )
    return {str(key): decode_tenant_model(item) for key, item in value.items()}


def _type_name(value: type[Any]) -> str:
    return f"{value.__module__}:{value.__qualname__}"


def _load_type(value: str) -> type[Any]:
    module_name, separator, qualname = value.partition(":")
    if (
        not separator
        or not module_name.startswith("quant_core.")
        or not qualname
        or "<" in qualname
    ):
        raise ValueError("tenant_model_type_not_allowed")
    current: Any = import_module(module_name)
    for part in qualname.split("."):
        current = getattr(current, part, None)
    if not isinstance(current, type):
        raise ValueError("tenant_model_type_invalid")
    return current
