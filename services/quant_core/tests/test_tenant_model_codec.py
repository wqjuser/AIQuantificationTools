from __future__ import annotations

from datetime import datetime, timezone
import unittest

from quant_core.audit_events import AuditEventRecord
from quant_core.tenant_model_codec import decode_tenant_model, encode_tenant_model


class TenantModelCodecTest(unittest.TestCase):
    def test_round_trips_only_allowlisted_quant_core_models(self) -> None:
        record = AuditEventRecord(
            event_id="event-1",
            event_type="research",
            run_id=None,
            created_at=datetime(2026, 8, 3, tzinfo=timezone.utc),
            stage="research",
            source="test",
            summary="summary",
            detail="detail",
            metadata={"nested": ("a", 1)},
        )

        self.assertEqual(decode_tenant_model(encode_tenant_model(record)), record)
        with self.assertRaisesRegex(ValueError, "tenant_model_type_not_allowed"):
            decode_tenant_model({"$dataclass": "builtins:dict", "fields": {}})


if __name__ == "__main__":
    unittest.main()
