from __future__ import annotations

from urllib.parse import urlparse

from . import (
    adapter_paper,
    adapter_probe,
    adapter_runtime,
    adapter_secrets,
    ai_strategy_p0,
    audit,
    core,
    market,
    operations,
    portfolio,
    production_admission,
    research,
    research_import,
    shadow_sandbox,
    stage1,
    stage10,
)
from ..support.ai_validation import (
    _ai_research_evidence_route_id,
    _ai_review_decision_route_id,
    _optional_dependency_install_route_dependency,
)


class RouteDispatchMixin:
    def do_OPTIONS(self) -> None:
        self._send_json({})

    def do_PUT(self) -> None:
        parsed = urlparse(self.path)
        if not self._dispatch_put(parsed):
            self._send_json({"error": "not_found"}, status=404)

    def _dispatch_put(self, parsed) -> bool:
        if parsed.path == '/api/settings/configuration':
            core.put_settings_configuration(self, parsed)
            return True
        if parsed.path == '/api/research/workspace-state':
            research.put_research_workspace_state(self, parsed)
            return True
        if parsed.path == '/api/watchlist':
            core.put_watchlist(self, parsed)
            return True
        return False

    def do_DELETE(self) -> None:
        parsed = urlparse(self.path)
        if not self._dispatch_delete(parsed):
            self._send_json({"error": "not_found"}, status=404)

    def _dispatch_delete(self, parsed) -> bool:
        if parsed.path.startswith('/api/strategies/'):
            ai_strategy_p0.delete_strategies(self, parsed)
            return True
        return False

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if not self._dispatch_post(parsed):
            self._send_json({"error": "not_found"}, status=404)

    def _dispatch_post(self, parsed) -> bool:
        optional_dependency = _optional_dependency_install_route_dependency(parsed.path)
        if optional_dependency is not None:
            core.post_optional_dependency_install(self, parsed, optional_dependency)
            return True
        if parsed.path == '/api/market/ai-selections':
            market.post_market_ai_selections(self, parsed)
            return True
        if parsed.path == '/api/market/ai-selection-reviews':
            market.post_market_ai_selection_reviews(self, parsed)
            return True
        if parsed.path == '/api/operations/monitoring/test-notifications':
            operations.post_operations_monitoring_test_notifications(self, parsed)
            return True
        ai_research_review_id = _ai_research_evidence_route_id(parsed.path)
        if ai_research_review_id is not None:
            ai_strategy_p0.post_ai_research_evidence(self, parsed, ai_research_review_id)
            return True
        if parsed.path == '/api/ai-research/outcomes':
            ai_strategy_p0.post_ai_research_outcomes(self, parsed)
            return True
        decision_review_id = _ai_review_decision_route_id(parsed.path)
        if decision_review_id is not None:
            ai_strategy_p0.post_ai_review_decision(self, parsed, decision_review_id)
            return True
        if parsed.path == '/api/ai-reviews':
            ai_strategy_p0.post_ai_reviews(self, parsed)
            return True
        if parsed.path == '/api/strategy-experiments':
            ai_strategy_p0.post_strategy_experiments(self, parsed)
            return True
        if parsed.path == '/api/stage1/daily-use':
            stage1.post_stage1_daily_use(self, parsed)
            return True
        if parsed.path == '/api/stage1/bootstrap-preflight':
            stage1.post_stage1_bootstrap_preflight(self, parsed)
            return True
        if parsed.path == '/api/p2/readiness/acceptance':
            stage1.post_p2_readiness_acceptance(self, parsed)
            return True
        if parsed.path == '/api/p2/manifest-chain/preflight':
            stage1.post_p2_manifest_chain_preflight(self, parsed)
            return True
        if parsed.path == '/api/p0/pipeline':
            ai_strategy_p0.post_p0_pipeline(self, parsed)
            return True
        if parsed.path == '/api/p0/ai-reviews':
            ai_strategy_p0.post_p0_ai_reviews(self, parsed)
            return True
        if parsed.path == '/api/p0/paper-simulations':
            ai_strategy_p0.post_p0_paper_simulations(self, parsed)
            return True
        if parsed.path == '/api/strategies/ai-drafts':
            ai_strategy_p0.post_strategies_ai_drafts(self, parsed)
            return True
        if parsed.path == '/api/strategies/validate':
            ai_strategy_p0.post_strategies_validate(self, parsed)
            return True
        if parsed.path == '/api/strategies':
            ai_strategy_p0.post_strategies(self, parsed)
            return True
        if parsed.path == '/api/cache/refresh':
            market.post_cache_refresh(self, parsed)
            return True
        if parsed.path == '/api/cache/watchlist-refreshes':
            market.post_cache_watchlist_refreshes(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-secret-references':
            adapter_secrets.post_execution_adapter_secret_references(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-secret-materializations':
            adapter_secrets.post_execution_adapter_secret_materializations(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-secret-manifest-validations':
            adapter_secrets.post_execution_adapter_secret_manifest_validations(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-environment-bindings':
            adapter_secrets.post_execution_adapter_environment_bindings(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-runtime-reload-plans':
            adapter_runtime.post_execution_adapter_runtime_reload_plans(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-runtime-reload-executions':
            adapter_runtime.post_execution_adapter_runtime_reload_executions(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-runtime-reload-acceptances':
            adapter_runtime.post_execution_adapter_runtime_reload_acceptances(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-orchestration-dry-runs':
            adapter_runtime.post_execution_adapter_orchestration_dry_runs(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-orchestration-executions':
            adapter_runtime.post_execution_adapter_orchestration_executions(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-human-confirmations':
            adapter_runtime.post_execution_adapter_human_confirmations(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-sandbox-probe-plans':
            adapter_probe.post_execution_adapter_sandbox_probe_plans(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-sandbox-probe-executions':
            adapter_probe.post_execution_adapter_sandbox_probe_executions(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-sandbox-probe-reviews':
            adapter_probe.post_execution_adapter_sandbox_probe_reviews(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-production-route-reviews':
            adapter_probe.post_execution_adapter_production_route_reviews(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-sandbox-order-schema-dry-runs':
            adapter_probe.post_execution_adapter_sandbox_order_schema_dry_runs(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-paper-order-lifecycles':
            adapter_paper.post_execution_adapter_paper_order_lifecycles(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-paper-route-runbooks':
            adapter_paper.post_execution_adapter_paper_route_runbooks(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-ops-states':
            adapter_paper.post_execution_adapter_ops_states(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-paper-executions':
            adapter_paper.post_execution_adapter_paper_executions(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-certifications':
            adapter_paper.post_execution_adapter_certifications(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-certifications/apply':
            adapter_paper.post_execution_adapter_certifications_apply(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-certifications/restart-evidence':
            adapter_paper.post_execution_adapter_certifications_restart_evidence(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-certifications/restart-acceptance':
            adapter_paper.post_execution_adapter_certifications_restart_acceptance(self, parsed)
            return True
        if parsed.path == '/api/portfolio/workflows':
            portfolio.post_portfolio_workflows(self, parsed)
            return True
        if parsed.path == '/api/portfolio/risk-assessments':
            portfolio.post_portfolio_risk_assessments(self, parsed)
            return True
        if parsed.path == '/api/execution/shadow-sessions':
            shadow_sandbox.post_execution_shadow_sessions(self, parsed)
            return True
        if parsed.path == '/api/execution/sandbox-readiness-decisions':
            shadow_sandbox.post_execution_sandbox_readiness_decisions(self, parsed)
            return True
        if parsed.path == '/api/execution/sandbox-authorization-preflights':
            shadow_sandbox.post_execution_sandbox_authorization_preflights(self, parsed)
            return True
        if parsed.path == '/api/execution/sandbox-authorization-reviews':
            shadow_sandbox.post_execution_sandbox_authorization_reviews(self, parsed)
            return True
        if parsed.path == '/api/execution/stage8/production-readonly-access-controls':
            production_admission.post_execution_stage8_production_readonly_access_controls(self, parsed)
            return True
        if parsed.path == '/api/execution/stage7/production-readonly-probes':
            production_admission.post_execution_stage7_production_readonly_probes(self, parsed)
            return True
        if parsed.path == '/api/execution/stage9/production-order-admission-candidates':
            production_admission.post_execution_stage9_production_order_admission_candidates(self, parsed)
            return True
        if parsed.path == '/api/execution/stage9/production-order-admission-reviews':
            production_admission.post_execution_stage9_production_order_admission_reviews(self, parsed)
            return True
        if parsed.path == '/api/execution/auto-paper-trading':
            operations.post_execution_auto_paper_trading(self, parsed)
            return True
        if parsed.path == '/api/execution/auto-paper-trading/reconciliations':
            operations.post_execution_auto_paper_trading_reconciliations(self, parsed)
            return True
        if parsed.path == '/api/execution/auto-paper-trading/evaluations':
            operations.post_execution_auto_paper_trading_evaluations(self, parsed)
            return True
        if parsed.path == '/api/execution/stage10/production-trading-credential-preflights':
            stage10.post_execution_stage10_production_trading_credential_preflights(self, parsed)
            return True
        if parsed.path == '/api/execution/stage10/production-trading-permission-verifications':
            stage10.post_execution_stage10_production_trading_permission_verifications(self, parsed)
            return True
        if parsed.path == '/api/execution/stage10/production-execution-controls':
            stage10.post_execution_stage10_production_execution_controls(self, parsed)
            return True
        if parsed.path == '/api/execution/stage10/production-execution-authorizations':
            stage10.post_execution_stage10_production_execution_authorizations(self, parsed)
            return True
        if parsed.path == '/api/execution/stage10/production-execution-attempts':
            stage10.post_execution_stage10_production_execution_attempts(self, parsed)
            return True
        if parsed.path == '/api/execution/stage6/sandbox-authorizations':
            shadow_sandbox.post_execution_stage6_sandbox_authorizations(self, parsed)
            return True
        if parsed.path == '/api/execution/stage6/sandbox-batches':
            shadow_sandbox.post_execution_stage6_sandbox_batches(self, parsed)
            return True
        if parsed.path == '/api/execution/stage6/sandbox-reconciliations':
            shadow_sandbox.post_execution_stage6_sandbox_reconciliations(self, parsed)
            return True
        if parsed.path == '/api/execution/stage6/sandbox-cancellations':
            shadow_sandbox.post_execution_stage6_sandbox_cancellations(self, parsed)
            return True
        if parsed.path == '/api/execution/stage6/kill-switch':
            shadow_sandbox.post_execution_stage6_kill_switch(self, parsed)
            return True
        if parsed.path == '/api/portfolio/backtest':
            portfolio.post_portfolio_backtest(self, parsed)
            return True
        if parsed.path == '/api/portfolio/paper-orders':
            portfolio.post_portfolio_paper_orders(self, parsed)
            return True
        if parsed.path == '/api/portfolio/paper-order-approvals':
            portfolio.post_portfolio_paper_order_approvals(self, parsed)
            return True
        if parsed.path == '/api/portfolio/paper-order-simulations/batch':
            portfolio.post_portfolio_paper_order_simulations_batch(self, parsed)
            return True
        if parsed.path == '/api/portfolio/paper-order-simulations':
            portfolio.post_portfolio_paper_order_simulations(self, parsed)
            return True
        if parsed.path == '/api/research/note-drafts':
            research.post_research_note_drafts(self, parsed)
            return True
        if parsed.path == '/api/research/notes':
            research.post_research_notes(self, parsed)
            return True
        if parsed.path == '/api/handoff-notes':
            research.post_handoff_notes(self, parsed)
            return True
        if parsed.path == '/api/audit/events':
            audit.post_audit_events(self, parsed)
            return True
        if parsed.path == '/api/audit/signing-keys/rotation-plan':
            audit.post_audit_signing_keys_rotation_plan(self, parsed)
            return True
        if parsed.path == '/api/audit/signing-keys/rotation-apply':
            audit.post_audit_signing_keys_rotation_apply(self, parsed)
            return True
        if parsed.path == '/api/audit/signing-keys/rotation-restart-evidence':
            audit.post_audit_signing_keys_rotation_restart_evidence(self, parsed)
            return True
        if parsed.path == '/api/audit/signing-keys/secret-materializations':
            audit.post_audit_signing_keys_secret_materializations(self, parsed)
            return True
        if parsed.path == '/api/audit/signing-keys/environment-bindings':
            audit.post_audit_signing_keys_environment_bindings(self, parsed)
            return True
        if parsed.path == '/api/audit/signing-keys/runtime-reload-plans':
            audit.post_audit_signing_keys_runtime_reload_plans(self, parsed)
            return True
        if parsed.path == '/api/audit/signing-keys/runtime-reload-executions':
            audit.post_audit_signing_keys_runtime_reload_executions(self, parsed)
            return True
        if parsed.path == '/api/audit/signing-keys/rotation-acceptances':
            audit.post_audit_signing_keys_rotation_acceptances(self, parsed)
            return True
        if parsed.path == '/api/audit/reports/sign':
            audit.post_audit_reports_sign(self, parsed)
            return True
        if parsed.path == '/api/audit/reports/verify':
            audit.post_audit_reports_verify(self, parsed)
            return True
        if parsed.path == '/api/audit/reports/verify-package':
            audit.post_audit_reports_verify_package(self, parsed)
            return True
        if parsed.path == '/api/audit/reports/revoke':
            audit.post_audit_reports_revoke(self, parsed)
            return True
        if parsed.path == '/api/research/runs/import/undo':
            research_import.post_research_runs_import_undo(self, parsed)
            return True
        if parsed.path == '/api/research/runs/import':
            research_import.post_research_runs_import(self, parsed)
            return True
        if parsed.path.startswith('/api/research/runs/') and parsed.path.endswith('/ai-reviews'):
            research.post_legacy_research_run_ai_reviews(self, parsed)
            return True
        if parsed.path.startswith('/api/research/runs/') and parsed.path.endswith('/paper-executions'):
            research.post_research_run_paper_executions(self, parsed)
            return True
        return False

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if not self._dispatch_get(parsed):
            self._send_json({"error": "not_found"}, status=404)

    def _dispatch_get(self, parsed) -> bool:
        if parsed.path == '/health':
            core.get_health(self, parsed)
            return True
        if parsed.path == '/api/auth/session':
            core.get_local_auth_session(self, parsed)
            return True
        ai_research_review_id = _ai_research_evidence_route_id(parsed.path)
        if ai_research_review_id is not None:
            ai_strategy_p0.get_ai_research_evidence(self, parsed, ai_research_review_id)
            return True
        if parsed.path == '/api/ai-review/providers':
            ai_strategy_p0.get_ai_review_providers(self, parsed)
            return True
        if parsed.path == '/api/market/ai-selection-statistics':
            market.get_market_ai_selection_statistics(self, parsed)
            return True
        decision_review_id = _ai_review_decision_route_id(parsed.path)
        if decision_review_id is not None:
            ai_strategy_p0.get_ai_review_decision(self, parsed, decision_review_id)
            return True
        if parsed.path == '/api/ai-reviews':
            ai_strategy_p0.get_ai_reviews(self, parsed)
            return True
        if parsed.path.startswith('/api/ai-reviews/'):
            ai_strategy_p0.get_ai_review_detail(self, parsed)
            return True
        if parsed.path == '/api/strategy-experiments':
            ai_strategy_p0.get_strategy_experiments(self, parsed)
            return True
        if parsed.path.startswith('/api/strategy-experiments/'):
            ai_strategy_p0.get_strategy_experiment_detail(self, parsed)
            return True
        if parsed.path == '/api/demo':
            core.get_demo(self, parsed)
            return True
        if parsed.path == '/api/workspace':
            core.get_workspace(self, parsed)
            return True
        if parsed.path == '/api/watchlist':
            core.get_watchlist(self, parsed)
            return True
        if parsed.path == '/api/research/workspace-state':
            research.get_research_workspace_state(self, parsed)
            return True
        if parsed.path == '/api/settings/status':
            core.get_settings_status(self, parsed)
            return True
        if parsed.path == '/api/settings/openai-compatible-models':
            core.get_settings_openai_compatible_models(self, parsed)
            return True
        if parsed.path == '/api/p0/acceptance/latest':
            ai_strategy_p0.get_p0_acceptance_latest(self, parsed)
            return True
        if parsed.path == '/api/p1/acceptance/latest':
            stage1.get_p1_acceptance_latest(self, parsed)
            return True
        if parsed.path == '/api/desktop/release/latest':
            stage1.get_desktop_release_latest(self, parsed)
            return True
        if parsed.path == '/api/stage1/daily-use/latest':
            stage1.get_stage1_daily_use_latest(self, parsed)
            return True
        if parsed.path == '/api/stage1/bootstrap-preflight/latest':
            stage1.get_stage1_bootstrap_preflight_latest(self, parsed)
            return True
        if parsed.path == '/api/p2/pre-live/acceptance/latest':
            stage1.get_p2_pre_live_acceptance_latest(self, parsed)
            return True
        if parsed.path == '/api/p2/paper-replay/latest':
            stage1.get_p2_paper_replay_latest(self, parsed)
            return True
        if parsed.path == '/api/p2/readiness/acceptance/latest':
            stage1.get_p2_readiness_acceptance_latest(self, parsed)
            return True
        if parsed.path == '/api/stage5/exit-acceptance/latest':
            stage1.get_stage5_exit_acceptance_latest(self, parsed)
            return True
        if parsed.path == '/api/stage6/exit-acceptance/latest':
            stage1.get_stage6_exit_acceptance_latest(self, parsed)
            return True
        if parsed.path == '/api/p2/manifest-chain/preflight/latest':
            stage1.get_p2_manifest_chain_preflight_latest(self, parsed)
            return True
        if parsed.path == '/api/cache/watchlist-refreshes':
            market.get_cache_watchlist_refreshes(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-ledger':
            adapter_paper.get_execution_adapter_ledger(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-secret-references':
            adapter_secrets.get_execution_adapter_secret_references(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-secret-materializations':
            adapter_secrets.get_execution_adapter_secret_materializations(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-secret-manifest-validations':
            adapter_secrets.get_execution_adapter_secret_manifest_validations(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-environment-bindings':
            adapter_secrets.get_execution_adapter_environment_bindings(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-runtime-reload-plans':
            adapter_runtime.get_execution_adapter_runtime_reload_plans(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-runtime-reload-executions':
            adapter_runtime.get_execution_adapter_runtime_reload_executions(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-runtime-reload-acceptances':
            adapter_runtime.get_execution_adapter_runtime_reload_acceptances(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-orchestration-dry-runs':
            adapter_runtime.get_execution_adapter_orchestration_dry_runs(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-orchestration-executions':
            adapter_runtime.get_execution_adapter_orchestration_executions(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-human-confirmations':
            adapter_runtime.get_execution_adapter_human_confirmations(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-sandbox-probe-plans':
            adapter_probe.get_execution_adapter_sandbox_probe_plans(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-sandbox-probe-executions':
            adapter_probe.get_execution_adapter_sandbox_probe_executions(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-sandbox-probe-reviews':
            adapter_probe.get_execution_adapter_sandbox_probe_reviews(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-production-route-reviews':
            adapter_probe.get_execution_adapter_production_route_reviews(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-sandbox-order-schema-dry-runs':
            adapter_probe.get_execution_adapter_sandbox_order_schema_dry_runs(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-paper-order-lifecycles':
            adapter_paper.get_execution_adapter_paper_order_lifecycles(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-paper-route-runbooks':
            adapter_paper.get_execution_adapter_paper_route_runbooks(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-ops-states':
            adapter_paper.get_execution_adapter_ops_states(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-paper-executions':
            adapter_paper.get_execution_adapter_paper_executions(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-health/ccxt-sandbox':
            adapter_probe.get_execution_adapter_health_ccxt_sandbox(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-certifications/restart-acceptance':
            adapter_paper.get_execution_adapter_certifications_restart_acceptance(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-certifications/restart-evidence':
            adapter_paper.get_execution_adapter_certifications_restart_evidence(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-certifications/applies':
            adapter_paper.get_execution_adapter_certifications_applies(self, parsed)
            return True
        if parsed.path == '/api/execution/adapter-certifications':
            adapter_paper.get_execution_adapter_certifications(self, parsed)
            return True
        if parsed.path == '/api/portfolio/workflows':
            portfolio.get_portfolio_workflows(self, parsed)
            return True
        if parsed.path == '/api/portfolio/risk-assessments':
            portfolio.get_portfolio_risk_assessments(self, parsed)
            return True
        if parsed.path == '/api/execution/shadow-sessions':
            shadow_sandbox.get_execution_shadow_sessions(self, parsed)
            return True
        if parsed.path == '/api/execution/sandbox-readiness-decisions':
            shadow_sandbox.get_execution_sandbox_readiness_decisions(self, parsed)
            return True
        if parsed.path == '/api/execution/sandbox-authorization-preflights':
            shadow_sandbox.get_execution_sandbox_authorization_preflights(self, parsed)
            return True
        if parsed.path == '/api/execution/sandbox-authorization-reviews':
            shadow_sandbox.get_execution_sandbox_authorization_reviews(self, parsed)
            return True
        if parsed.path == '/api/execution/stage8/production-readonly-continuity':
            production_admission.get_execution_stage8_production_readonly_continuity(self, parsed)
            return True
        if parsed.path == '/api/execution/stage7/production-readonly-probes':
            production_admission.get_execution_stage7_production_readonly_probes(self, parsed)
            return True
        if parsed.path == '/api/execution/stage9/production-order-admission-candidates':
            production_admission.get_execution_stage9_production_order_admission_candidates(self, parsed)
            return True
        if parsed.path == '/api/execution/stage9/production-order-admission-reviews':
            production_admission.get_execution_stage9_production_order_admission_reviews(self, parsed)
            return True
        if parsed.path == '/api/execution/auto-paper-trading':
            operations.get_execution_auto_paper_trading(self, parsed)
            return True
        if parsed.path == '/api/operations/monitoring':
            operations.get_operations_monitoring(self, parsed)
            return True
        if parsed.path == '/api/execution/stage10/production-trading-credential-preflights':
            stage10.get_execution_stage10_production_trading_credential_preflights(self, parsed)
            return True
        if parsed.path == '/api/execution/stage10/production-trading-permission-verifications':
            stage10.get_execution_stage10_production_trading_permission_verifications(self, parsed)
            return True
        if parsed.path == '/api/execution/stage10/production-execution-controls':
            stage10.get_execution_stage10_production_execution_controls(self, parsed)
            return True
        if parsed.path == '/api/execution/stage10/production-execution-authorizations':
            stage10.get_execution_stage10_production_execution_authorizations(self, parsed)
            return True
        if parsed.path == '/api/execution/stage10/production-execution-attempts':
            stage10.get_execution_stage10_production_execution_attempts(self, parsed)
            return True
        if parsed.path == '/api/execution/stage6/sandbox-authorizations':
            shadow_sandbox.get_execution_stage6_sandbox_authorizations(self, parsed)
            return True
        if parsed.path == '/api/execution/stage6/sandbox-batches':
            shadow_sandbox.get_execution_stage6_sandbox_batches(self, parsed)
            return True
        if parsed.path == '/api/execution/stage6/kill-switch':
            shadow_sandbox.get_execution_stage6_kill_switch(self, parsed)
            return True
        if parsed.path == '/api/portfolio/paper-orders':
            portfolio.get_portfolio_paper_orders(self, parsed)
            return True
        if parsed.path == '/api/portfolio/paper-order-replay':
            portfolio.get_portfolio_paper_order_replay(self, parsed)
            return True
        if parsed.path == '/api/portfolio/paper-order-state-history':
            portfolio.get_portfolio_paper_order_state_history(self, parsed)
            return True
        if parsed.path == '/api/portfolio/paper-order-approvals':
            portfolio.get_portfolio_paper_order_approvals(self, parsed)
            return True
        if parsed.path == '/api/portfolio/paper-order-simulations':
            portfolio.get_portfolio_paper_order_simulations(self, parsed)
            return True
        if parsed.path == '/api/audit/signing-keys':
            audit.get_audit_signing_keys(self, parsed)
            return True
        if parsed.path == '/api/audit/signing-keys/secret-materializations':
            audit.get_audit_signing_keys_secret_materializations(self, parsed)
            return True
        if parsed.path == '/api/audit/signing-keys/environment-bindings':
            audit.get_audit_signing_keys_environment_bindings(self, parsed)
            return True
        if parsed.path == '/api/audit/signing-keys/runtime-reload-plans':
            audit.get_audit_signing_keys_runtime_reload_plans(self, parsed)
            return True
        if parsed.path == '/api/audit/signing-keys/runtime-reload-executions':
            audit.get_audit_signing_keys_runtime_reload_executions(self, parsed)
            return True
        if parsed.path == '/api/audit/signing-keys/rotation-acceptances':
            audit.get_audit_signing_keys_rotation_acceptances(self, parsed)
            return True
        if parsed.path == '/api/golden-path/status':
            audit.get_golden_path_status(self, parsed)
            return True
        if parsed.path == '/api/audit/events':
            audit.get_audit_events(self, parsed)
            return True
        if parsed.path == '/api/market/information':
            market.get_market_information(self, parsed)
            return True
        if parsed.path == '/api/market/discovery':
            market.get_market_discovery(self, parsed)
            return True
        if parsed.path == '/api/market/quotes':
            market.get_market_quotes(self, parsed)
            return True
        if parsed.path == '/api/market/calendar':
            market.get_market_calendar(self, parsed)
            return True
        if parsed.path == '/api/market/search':
            market.get_market_search(self, parsed)
            return True
        if parsed.path == '/api/market/data-readiness':
            market.get_market_data_readiness(self, parsed)
            return True
        if parsed.path == '/api/market/klines':
            market.get_market_klines(self, parsed)
            return True
        if parsed.path == '/api/strategies':
            ai_strategy_p0.get_strategies(self, parsed)
            return True
        if parsed.path.startswith('/api/strategies/'):
            ai_strategy_p0.get_strategy_detail(self, parsed)
            return True
        if parsed.path == '/api/research/notes':
            research.get_research_notes(self, parsed)
            return True
        if parsed.path == '/api/handoff-notes':
            research.get_handoff_notes(self, parsed)
            return True
        if parsed.path == '/api/research/run':
            research.get_research_run(self, parsed)
            return True
        if parsed.path.startswith('/api/research/runs/') and parsed.path.endswith('/production-strategy-handoff'):
            research.get_research_run_production_strategy_handoff(self, parsed)
            return True
        if parsed.path.startswith('/api/research/runs/') and parsed.path.endswith('/paper-executions'):
            research.get_research_run_paper_executions(self, parsed)
            return True
        if parsed.path.startswith('/api/research/runs/') and parsed.path.endswith('/ai-reviews'):
            research.get_research_run_ai_reviews(self, parsed)
            return True
        if parsed.path.startswith('/api/research/runs/') and parsed.path.endswith('/promotion'):
            research.get_research_run_promotion(self, parsed)
            return True
        if parsed.path.startswith('/api/research/runs/') and parsed.path.endswith('/export'):
            research.get_research_run_export(self, parsed)
            return True
        if parsed.path.startswith('/api/research/runs/'):
            research.get_research_run_detail(self, parsed)
            return True
        if parsed.path == '/api/research/runs':
            research.get_research_run_history(self, parsed)
            return True
        return False
