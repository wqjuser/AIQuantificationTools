from __future__ import annotations

from collections.abc import Callable, Mapping
from datetime import datetime, timedelta, timezone
import json
import os
from threading import Event, Lock, Thread
from typing import Any
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from quant_core.audit_events import AuditEventStore, audit_event_record_to_payload
from quant_core.canonical import canonical_sha256
from quant_core.market_calendar import build_market_calendar_status


MONITORING_JOB_ID = "server-monitoring"
AUTO_TRADING_JOB_ID = "auto-trading:crypto:BTC-USDT:1m"
MONITORING_JOB_EVENT_ID = "m2-monitoring-job-current-state"
MONITORING_JOB_EVENT_TYPE = "monitoring_job_state"
OBSERVED_JOB_EVENT_TYPE = "monitoring_observed_job_state"
INCIDENT_EVENT_TYPE = "monitoring_incident_state"
NOTIFICATION_EVENT_TYPE = "monitoring_notification_delivery"
_UNRESOLVED_ORDER_STATES = {
    "submission_pending",
    "open",
    "partially_filled",
    "reconciliation_required",
}
_LOCK = Lock()


class MonitoringRunner:
    def __init__(
        self,
        service: MonitoringService,
        snapshot_provider: Callable[[], Mapping[str, Any]],
        *,
        interval_seconds: float = 35,
    ) -> None:
        if interval_seconds <= 0:
            raise ValueError("monitoring_interval_must_be_positive")
        self.service = service
        self.snapshot_provider = snapshot_provider
        self.interval_seconds = interval_seconds
        self._stopped = Event()
        self._thread: Thread | None = None

    @property
    def running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def start(self) -> None:
        if self.running:
            return
        self._stopped.clear()
        self._thread = Thread(
            target=self._run,
            name="server-monitoring-runner",
            daemon=True,
        )
        self.service.record_runner_state("running", self.interval_seconds)
        try:
            self._thread.start()
        except RuntimeError:
            self._thread = None
            self.service.record_runner_state("stopped", self.interval_seconds)
            raise

    def stop(self, timeout: float = 5) -> None:
        self._stopped.set()
        thread = self._thread
        if thread is None:
            return
        thread.join(timeout=max(0, timeout))
        if not thread.is_alive():
            self._thread = None
            self.service.record_runner_state("stopped", self.interval_seconds)

    def _run(self) -> None:
        while not self._stopped.is_set():
            cycle_error: str | None = None
            try:
                self.service.evaluate(self.snapshot_provider())
            except Exception as error:
                cycle_error = str(error)
            finally:
                self.service.record_cycle(cycle_error)
            self._stopped.wait(self.interval_seconds)


class MonitoringService:
    # ponytail: one observer thread owns incident transitions; use transactional
    # compare-and-swap if the local API ever becomes a multi-worker service.
    def __init__(
        self,
        store: AuditEventStore,
        *,
        notifier: Callable[[dict[str, Any]], None] | None = None,
        channel: Mapping[str, Any] | None = None,
    ) -> None:
        self.store = store
        self.notifier = notifier
        self.channel = {
            "type": "webhook",
            "configured": False,
            "status": "unconfigured",
            "configurationError": None,
            **dict(channel or {}),
        }

    def configure_notifier(
        self,
        notifier: Callable[[dict[str, Any]], None] | None,
        channel: Mapping[str, Any],
    ) -> dict[str, Any]:
        with _LOCK:
            self.notifier = notifier
            self.channel = dict(channel)
            return dict(self.channel)

    def test_notification(self) -> dict[str, Any]:
        with _LOCK:
            if self.channel.get("status") == "invalid":
                raise ValueError("monitoring_webhook_configuration_invalid")
            if self.notifier is None or not self.channel.get("configured"):
                raise ValueError("monitoring_webhook_unconfigured")
            now = _now()
            result = self._deliver(
                {
                    "incidentId": (
                        "monitoring-webhook-test-"
                        f"{canonical_sha256(now.isoformat())[:16]}"
                    ),
                    "incidentKey": "monitoring:webhook_test",
                    "occurrenceCount": 1,
                    "severity": "info",
                    "title": "AIQuant 监控测试",
                    "detail": "Webhook 测试投递；不代表真实交易事件。",
                },
                "test",
                now,
            )
            if result.get("deliveryStatus") != "sent":
                raise RuntimeError(
                    str(result.get("deliveryError") or "monitoring_webhook_test_failed")
                )
            return {
                "schemaVersion": 1,
                "deliveryStatus": "sent",
                "observedAt": now.isoformat(),
                "channelType": "webhook",
                "tradingActionsAvailable": False,
            }

    def evaluate(self, auto_trading_snapshot: Mapping[str, Any]) -> dict[str, Any]:
        state = auto_trading_snapshot.get("state")
        if not isinstance(state, Mapping):
            raise ValueError("monitoring_auto_trading_state_missing")
        with _LOCK:
            now = _now()
            self._record_observed_job(state, now)
            current = {
                str(item.get("incidentKey") or ""): item
                for item in self._incident_states()
                if item.get("incidentKey")
            }
            active_specs = {
                item["incidentKey"]: item
                for item in _auto_trading_incidents(state, now)
            }

            for incident_key, spec in active_specs.items():
                previous = current.get(incident_key)
                if previous and previous.get("status") == "active":
                    incident = {
                        **previous,
                        **spec,
                        "lastObservedAt": now.isoformat(),
                    }
                    self._record_incident(incident, now)
                    continue

                occurrence = int((previous or {}).get("occurrenceCount") or 0) + 1
                incident = {
                    **spec,
                    "incidentId": _incident_id(incident_key),
                    "status": "active",
                    "openedAt": now.isoformat(),
                    "lastObservedAt": now.isoformat(),
                    "resolvedAt": None,
                    "occurrenceCount": occurrence,
                }
                self._record_incident(incident, now)
                self._deliver(incident, "active", now)

            for incident_key, previous in current.items():
                if (
                    previous.get("status") != "active"
                    or incident_key in active_specs
                ):
                    continue
                incident = {
                    **previous,
                    "status": "resolved",
                    "lastObservedAt": now.isoformat(),
                    "resolvedAt": now.isoformat(),
                }
                self._record_incident(incident, now)
                self._deliver(incident, "recovered", now)

            return self.snapshot()

    def record_runner_state(
        self,
        runner_state: str,
        interval_seconds: float,
    ) -> dict[str, Any]:
        if runner_state not in {"running", "stopping", "stopped"}:
            raise ValueError("monitoring_runner_state_invalid")
        with _LOCK:
            now = _now()
            job = self._job_state()
            job.update({
                "runnerState": runner_state,
                "intervalSeconds": interval_seconds,
                "updatedAt": now.isoformat(),
            })
            self._record_job(job, now)
            return job

    def record_cycle(self, error: str | None = None) -> dict[str, Any]:
        with _LOCK:
            now = _now()
            job = self._job_state()
            job["cycleCount"] = int(job.get("cycleCount") or 0) + 1
            job["lastCycleAt"] = now.isoformat()
            job["nextEligibleRunAt"] = (
                now + timedelta(seconds=float(job.get("intervalSeconds") or 35))
            ).isoformat()
            if error:
                job["consecutiveFailures"] = int(
                    job.get("consecutiveFailures") or 0
                ) + 1
                job["lastErrorAt"] = now.isoformat()
                job["lastError"] = (error.strip() or "monitoring_cycle_failed")[:240]
            else:
                job["consecutiveFailures"] = 0
                job["lastSuccessAt"] = now.isoformat()
            job["updatedAt"] = now.isoformat()
            self._record_job(job, now)
            return job

    def snapshot(self) -> dict[str, Any]:
        job = self._job_state()
        incidents = self._incident_states()
        active = [item for item in incidents if item.get("status") == "active"]
        observed_jobs = [
            event.metadata
            for event in self.store.list_recent(
                event_type=OBSERVED_JOB_EVENT_TYPE,
                limit=20,
            )
        ]
        notifications = [
            audit_event_record_to_payload(event)
            for event in self.store.list_recent(
                event_type=NOTIFICATION_EVENT_TYPE,
                limit=20,
            )
        ]
        job_health = _monitoring_job_health(job, _now())
        if active:
            status = "attention"
            reason = f"{len(active)} 个服务端事件待恢复"
            next_action = str(active[0].get("nextAction") or "检查事件详情。")
        elif self.channel.get("status") == "invalid":
            status = "degraded"
            reason = "外部通知渠道配置无效"
            next_action = "检查 AIQT_MONITORING_WEBHOOK_URL。"
        elif job.get("lastDeliveryStatus") == "failed":
            status = "degraded"
            reason = "最近一次外部通知投递失败"
            next_action = "检查 Webhook 可用性；交易和审计状态不受影响。"
        elif job_health["status"] in {"blocked", "delayed", "offline"}:
            status = "degraded"
            reason = str(job_health["detail"])
            next_action = "检查本地 API 与服务端监控线程。"
        elif job_health["status"] == "waiting":
            status = "waiting"
            reason = "等待服务端监控首次运行"
            next_action = "保持本地 API 运行。"
        else:
            status = "healthy"
            reason = "服务端监控正常"
            next_action = (
                "无需操作。"
                if self.channel.get("configured")
                else "如需浏览器关闭后外部提醒，请配置 Webhook。"
            )
        return {
            "schemaVersion": 1,
            "status": status,
            "reason": reason,
            "nextAction": next_action,
            "job": {**job, "health": job_health},
            "observedJobs": observed_jobs,
            "activeIncidents": active,
            "incidents": incidents,
            "notifications": notifications,
            "channel": dict(self.channel),
            "tradingActionsAvailable": False,
        }

    def _record_observed_job(
        self,
        state: Mapping[str, Any],
        now: datetime,
    ) -> None:
        interval = float(state.get("runnerIntervalSeconds") or 35)
        schedule_from = _parse_time(state.get("lastRunnerCycleAt")) or now
        schedule = next_eligible_run(
            str(state.get("market") or "crypto"),
            schedule_from,
            interval_seconds=interval,
        )
        job = {
            "jobId": AUTO_TRADING_JOB_ID,
            "kind": "auto_trading",
            "market": str(state.get("market") or "crypto"),
            "symbol": str(state.get("symbol") or ""),
            "timeframe": str(state.get("timeframe") or ""),
            "runnerState": str(state.get("runnerState") or "stopped"),
            "enabled": state.get("enabled") is True,
            "status": str(state.get("status") or "unknown"),
            "lastCycleAt": state.get("lastRunnerCycleAt"),
            "lastSuccessAt": state.get("lastRunnerSuccessAt"),
            "lastErrorAt": state.get("lastRunnerErrorAt"),
            "lastError": state.get("lastRunnerError"),
            "consecutiveFailures": int(
                state.get("consecutiveRunnerFailures") or 0
            ),
            **schedule,
            "observedAt": now.isoformat(),
        }
        self.store.record(_event(
            event_id="m2-monitoring-observed-auto-trading",
            event_type=OBSERVED_JOB_EVENT_TYPE,
            created_at=now,
            summary="自动交易任务状态已观察",
            detail="服务端监控只读取并持久化现有运行状态。",
            metadata=job,
        ))

    def _record_incident(
        self,
        incident: Mapping[str, Any],
        now: datetime,
    ) -> None:
        incident_id = str(incident["incidentId"])
        self.store.record(_event(
            event_id=f"m2-monitoring-incident-{incident_id}",
            event_type=INCIDENT_EVENT_TYPE,
            created_at=now,
            summary=str(incident["title"]),
            detail=str(incident["detail"]),
            metadata=dict(incident),
        ))

    def _deliver(
        self,
        incident: Mapping[str, Any],
        lifecycle: str,
        now: datetime,
    ) -> dict[str, Any]:
        occurrence = int(incident["occurrenceCount"])
        dedupe_key = (
            f"{incident['incidentId']}:{occurrence}:{lifecycle}"
        )
        event_id = (
            "m2-monitoring-notification-"
            f"{canonical_sha256(dedupe_key)[:24]}"
        )
        title = (
            str(incident["title"])
            if lifecycle in {"active", "test"}
            else f"已恢复：{incident['title']}"
        )
        payload = {
            "schemaVersion": 1,
            "dedupeKey": dedupe_key,
            "incidentId": incident["incidentId"],
            "incidentKey": incident["incidentKey"],
            "lifecycle": lifecycle,
            "severity": incident["severity"],
            "title": title,
            "detail": incident["detail"],
            "observedAt": now.isoformat(),
        }
        claimed = _event(
            event_id=event_id,
            event_type=NOTIFICATION_EVENT_TYPE,
            created_at=now,
            summary=title,
            detail=str(incident["detail"]),
            metadata={
                **payload,
                "channelType": self.channel["type"],
                "deliveryStatus": "claimed",
                "deliveryError": None,
            },
        )
        existing, created = self.store.record_if_absent(claimed)
        if not created:
            return dict(existing.metadata)

        delivery_status = "skipped_unconfigured"
        delivery_error: str | None = None
        if self.notifier is not None and self.channel.get("configured"):
            try:
                self.notifier(payload)
                delivery_status = "sent"
            except Exception as error:
                delivery_status = "failed"
                delivery_error = (
                    str(error).strip() or "notification_delivery_failed"
                )[:240]

        self._record_delivery_result(delivery_status, delivery_error, now)
        delivered = {
            **claimed,
            "metadata": {
                **claimed["metadata"],
                "deliveryStatus": delivery_status,
                "deliveryError": delivery_error,
            },
        }
        self.store.record(delivered)
        return dict(delivered["metadata"])

    def _record_delivery_result(
        self,
        status: str,
        detail: str | None,
        now: datetime,
    ) -> None:
        job = self._job_state()
        job["lastDeliveryStatus"] = status
        if status == "failed":
            job["deliveryFailureCount"] = int(
                job.get("deliveryFailureCount") or 0
            ) + 1
            job["lastDeliveryErrorAt"] = now.isoformat()
            job["lastDeliveryError"] = detail
        elif status == "sent":
            job["lastDeliverySuccessAt"] = now.isoformat()
            job["lastDeliveryError"] = None
        job["updatedAt"] = now.isoformat()
        self._record_job(job, now)

    def _incident_states(self) -> list[dict[str, Any]]:
        return [
            dict(event.metadata)
            for event in self.store.list_recent(
                event_type=INCIDENT_EVENT_TYPE,
                limit=50,
            )
        ]

    def _job_state(self) -> dict[str, Any]:
        event = self.store.get(MONITORING_JOB_EVENT_ID)
        if event is not None:
            return dict(event.metadata)
        now = _now().isoformat()
        return {
            "jobId": MONITORING_JOB_ID,
            "kind": "incident_projection",
            "runnerState": "stopped",
            "intervalSeconds": 35,
            "cycleCount": 0,
            "consecutiveFailures": 0,
            "lastCycleAt": None,
            "lastSuccessAt": None,
            "lastErrorAt": None,
            "lastError": None,
            "nextEligibleRunAt": None,
            "deliveryFailureCount": 0,
            "lastDeliveryStatus": None,
            "lastDeliverySuccessAt": None,
            "lastDeliveryErrorAt": None,
            "lastDeliveryError": None,
            "updatedAt": now,
        }

    def _record_job(
        self,
        job: Mapping[str, Any],
        now: datetime,
    ) -> None:
        self.store.record(_event(
            event_id=MONITORING_JOB_EVENT_ID,
            event_type=MONITORING_JOB_EVENT_TYPE,
            created_at=now,
            summary="服务端监控任务状态已更新",
            detail="监控任务只投影已有运行状态和通知结果。",
            metadata=dict(job),
        ))


def build_webhook_notifier(
    environ: Mapping[str, str] | None = None,
) -> tuple[Callable[[dict[str, Any]], None] | None, dict[str, Any]]:
    source = os.environ if environ is None else environ
    url = str(source.get("AIQT_MONITORING_WEBHOOK_URL") or "").strip()
    if not url:
        return None, {
            "type": "webhook",
            "configured": False,
            "status": "unconfigured",
            "configurationError": None,
        }
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return None, {
            "type": "webhook",
            "configured": False,
            "status": "invalid",
            "configurationError": "monitoring_webhook_url_invalid",
        }
    try:
        timeout = float(
            source.get("AIQT_MONITORING_WEBHOOK_TIMEOUT_SECONDS") or 5
        )
    except (TypeError, ValueError):
        timeout = 5
    timeout = max(1, min(timeout, 30))

    def notify(payload: dict[str, Any]) -> None:
        request = Request(
            url,
            data=json.dumps(
                payload,
                ensure_ascii=False,
                separators=(",", ":"),
            ).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "User-Agent": "AIQuant-Terminal-Monitoring/1",
            },
            method="POST",
        )
        try:
            with urlopen(request, timeout=timeout) as response:
                status = int(getattr(response, "status", 200))
        except Exception as error:
            raise RuntimeError(
                f"monitoring_webhook_request_failed:{type(error).__name__}"
            ) from error
        if status < 200 or status >= 300:
            raise RuntimeError(
                f"monitoring_webhook_http_status_{status}"
            )

    return notify, {
        "type": "webhook",
        "configured": True,
        "status": "ready",
        "configurationError": None,
    }


def next_eligible_run(
    market: str,
    now: datetime,
    *,
    interval_seconds: float,
) -> dict[str, Any]:
    normalized_market = str(market or "").strip().lower()
    if normalized_market == "crypto":
        return {
            "scheduleKind": "continuous",
            "calendarStatus": "always_open",
            "nextEligibleRunAt": (
                now + timedelta(seconds=interval_seconds)
            ).isoformat(),
        }

    calendar = build_market_calendar_status(normalized_market, at=now)
    if calendar["isOpen"]:
        candidate = now + timedelta(seconds=interval_seconds)
        candidate_status = build_market_calendar_status(
            normalized_market,
            at=candidate,
        )
        next_at = (
            candidate
            if candidate_status["isOpen"]
            else _parse_time(candidate_status.get("nextOpen"))
        )
    else:
        next_at = _parse_time(calendar.get("nextOpen"))
    return {
        "scheduleKind": "market_calendar",
        "calendarStatus": calendar["status"],
        "nextEligibleRunAt": next_at.isoformat() if next_at else None,
    }


def _auto_trading_incidents(
    state: Mapping[str, Any],
    now: datetime,
) -> list[dict[str, Any]]:
    incidents: list[dict[str, Any]] = []
    mode = str(state.get("executionMode") or "paper")
    order = (
        state.get("lastLiveOrder")
        if mode == "live"
        else state.get("lastTestnetOrder")
        if mode == "testnet"
        else None
    )
    order_state = (
        str(order.get("state") or "")
        if isinstance(order, Mapping)
        else ""
    )
    if order_state in _UNRESOLVED_ORDER_STATES:
        incidents.append(_incident(
            "auto-trading:pending-order",
            "critical" if mode == "live" else "warning",
            "自动委托等待对账",
            "系统将继续只读查询原订单，新委托保持阻断。",
            "在执行中心使用“立即对账”核对原订单。",
        ))

    runner_health = _auto_runner_health(state, now)
    runtime_messages = {
        "runner_stopped": (
            "critical",
            "自动交易后台已停止",
            "重启本地 API，并确认原订单只读对账恢复。",
        ),
        "heartbeat_stale": (
            "critical",
            "自动交易后台心跳中断",
            "检查本地 API 进程和自动交易运行器。",
        ),
        "runner_failures": (
            "warning",
            "自动交易后台连续失败",
            "检查最近运行错误、行情和 AI Provider。",
        ),
    }
    runtime = runtime_messages.get(str(runner_health["reason"]))
    if runtime:
        severity, title, next_action = runtime
        incidents.append(_incident(
            f"auto-trading:{runner_health['reason']}",
            severity,
            title,
            str(runner_health["detail"]),
            next_action,
        ))

    status = str(state.get("status") or "")
    status_messages = {
        "account_mismatch": (
            "critical",
            "自动交易账户状态不一致",
            "核对交易所可用资产和未记录自动挂单。",
        ),
        "risk_paused": (
            "warning",
            "自动交易被风险边界暂停",
            "检查急停、生产会话、权限和风险限制。",
        ),
        "ai_error": (
            "warning",
            "自动交易 AI 评估失败",
            "检查 Provider 配置和最近错误。",
        ),
        "data_blocked": (
            "warning",
            "自动交易行情不可用",
            "检查完整 K 线、数据时效和行情适配器。",
        ),
        "evaluation_error": (
            "warning",
            "自动交易后台评估失败",
            "检查最近运行错误后等待下一轮恢复。",
        ),
        "order_rejected": (
            "critical" if mode == "live" else "warning",
            "自动委托被拒绝",
            "检查订单结果、交易场所规则和账户覆盖。",
        ),
    }
    message = status_messages.get(status)
    if message:
        severity, title, next_action = message
        incidents.append(_incident(
            f"auto-trading:{status}",
            severity,
            title,
            str(state.get("detail") or title),
            next_action,
        ))
    return incidents


def _auto_runner_health(
    state: Mapping[str, Any],
    now: datetime,
) -> dict[str, Any]:
    interval = float(state.get("runnerIntervalSeconds") or 35)
    stale_after = max(90, round(interval * 3))
    last_cycle = _parse_time(state.get("lastRunnerCycleAt"))
    if state.get("runnerState") != "running":
        return {
            "status": "offline",
            "reason": "runner_stopped",
            "detail": "自动交易运行器没有运行。",
        }
    if last_cycle is None:
        return {
            "status": "waiting",
            "reason": "heartbeat_missing",
            "detail": "自动交易运行器等待首次心跳。",
        }
    age = max(0, round((now - last_cycle).total_seconds()))
    if age > stale_after:
        return {
            "status": "delayed",
            "reason": "heartbeat_stale",
            "detail": f"自动交易运行器已 {age} 秒没有心跳。",
        }
    failures = int(state.get("consecutiveRunnerFailures") or 0)
    if failures > 0:
        return {
            "status": "blocked",
            "reason": "runner_failures",
            "detail": f"自动交易运行器已连续失败 {failures} 轮。",
        }
    return {
        "status": "running",
        "reason": "healthy",
        "detail": "自动交易运行器正常。",
    }


def _monitoring_job_health(
    job: Mapping[str, Any],
    now: datetime,
) -> dict[str, Any]:
    if job.get("runnerState") != "running":
        return {
            "status": "offline",
            "detail": "服务端监控线程没有运行。",
        }
    last_cycle = _parse_time(job.get("lastCycleAt"))
    if last_cycle is None:
        return {
            "status": "waiting",
            "detail": "服务端监控等待首次运行。",
        }
    stale_after = max(
        90,
        round(float(job.get("intervalSeconds") or 35) * 3),
    )
    age = max(0, round((now - last_cycle).total_seconds()))
    if age > stale_after:
        return {
            "status": "delayed",
            "detail": f"服务端监控已 {age} 秒没有心跳。",
        }
    failures = int(job.get("consecutiveFailures") or 0)
    if failures:
        return {
            "status": "blocked",
            "detail": f"服务端监控已连续失败 {failures} 轮。",
        }
    return {"status": "running", "detail": "服务端监控正常。"}


def _incident(
    incident_key: str,
    severity: str,
    title: str,
    detail: str,
    next_action: str,
) -> dict[str, Any]:
    return {
        "incidentKey": incident_key,
        "severity": severity,
        "title": title,
        "detail": detail[:240],
        "nextAction": next_action,
    }


def _incident_id(incident_key: str) -> str:
    return canonical_sha256({"incidentKey": incident_key})[:24]


def _event(
    *,
    event_id: str,
    event_type: str,
    created_at: datetime,
    summary: str,
    detail: str,
    metadata: Mapping[str, Any],
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": event_id,
        "eventType": event_type,
        "runId": None,
        "createdAt": created_at.isoformat(),
        "stage": "m2-monitoring",
        "source": "server-monitoring",
        "summary": summary,
        "detail": detail,
        "metadata": dict(metadata),
    }


def _parse_time(value: Any) -> datetime | None:
    normalized = str(value or "").strip()
    if not normalized:
        return None
    parsed = datetime.fromisoformat(normalized.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _now() -> datetime:
    return datetime.now(timezone.utc)
