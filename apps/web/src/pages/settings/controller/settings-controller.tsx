import { InstallablePlatformDataDependency, installPlatformDataDependency, loadAiReviewProviders, loadExecutionAdapterCertificationApplies, loadExecutionAdapterCertifications, loadExecutionAdapterControlledRestartEvidence, loadExecutionAdapterEnvironmentBindings, loadExecutionAdapterHealthProbe, loadExecutionAdapterHumanConfirmations, loadExecutionAdapterLedger, loadExecutionAdapterOpsStates, loadExecutionAdapterOrchestrationDryRuns, loadExecutionAdapterOrchestrationExecutions, loadExecutionAdapterPaperExecutions, loadExecutionAdapterPaperOrderLifecycles, loadExecutionAdapterPaperRouteRunbooks, loadExecutionAdapterProductionRouteReviews, loadExecutionAdapterRestartAcceptances, loadExecutionAdapterRuntimeReloadAcceptances, loadExecutionAdapterRuntimeReloadExecutions, loadExecutionAdapterRuntimeReloadPlans, loadExecutionAdapterSandboxOrderSchemaDryRuns, loadExecutionAdapterSandboxProbeExecutions, loadExecutionAdapterSandboxProbePlans, loadExecutionAdapterSandboxProbeReviews, loadExecutionAdapterSecretManifestValidations, loadExecutionAdapterSecretMaterializations, loadExecutionAdapterSecretReferences, loadOpenAiCompatibleModels, loadPlatformSettings, loadWatchlistCacheRefreshRuns, PlatformSettingsResult, PlatformSettingsUpdateRequest, savePlatformSettings, testMonitoringWebhook } from "../../../lib/terminal-api";
import { ProductWorkAreaId } from "../../../lib/terminal-workbench";
import { initialSettingsStatusState, quantCoreBaseUrl } from "../../app-shell/initial-state";
import { latestRecordedProductionRouteReviewIdForAdapter } from "../../execution/certification-evidence";
import { useCallback, useRef, useState } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "activeWorkAreaId" | "aiReviewStage3Providers" | "executionAdapterCertificationApplies" | "executionAdapterCertifications" | "executionAdapterControlledRestartEvidence" | "executionAdapterEnvironmentBindings" | "executionAdapterHealthProbe" | "executionAdapterHumanConfirmations" | "executionAdapterLedger" | "executionAdapterOpsStates" | "executionAdapterOrchestrationDryRuns" | "executionAdapterOrchestrationExecutions" | "executionAdapterPaperExecutions" | "executionAdapterPaperOrderLifecycles" | "executionAdapterPaperRouteRunbooks" | "executionAdapterProductionRouteReviews" | "executionAdapterRestartAcceptances" | "executionAdapterRuntimeReloadAcceptances" | "executionAdapterRuntimeReloadExecutions" | "executionAdapterRuntimeReloadPlans" | "executionAdapterSandboxOrderSchemaDryRuns" | "executionAdapterSandboxProbeExecutions" | "executionAdapterSandboxProbePlans" | "executionAdapterSandboxProbeReviews" | "executionAdapterSecretManifestValidations" | "executionAdapterSecretMaterializations" | "executionAdapterSecretReferences" | "setActiveWorkAreaId" | "setAiReviewStage3Providers" | "setExecutionAdapterCertificationApplies" | "setExecutionAdapterCertifications" | "setExecutionAdapterControlledRestartEvidence" | "setExecutionAdapterEnvironmentBindings" | "setExecutionAdapterHealthProbe" | "setExecutionAdapterHumanConfirmations" | "setExecutionAdapterLedger" | "setExecutionAdapterOpsStates" | "setExecutionAdapterOrchestrationDryRuns" | "setExecutionAdapterOrchestrationExecutions" | "setExecutionAdapterPaperExecutions" | "setExecutionAdapterPaperOrderLifecycles" | "setExecutionAdapterPaperRouteRunbooks" | "setExecutionAdapterProductionRouteReviews" | "setExecutionAdapterRestartAcceptances" | "setExecutionAdapterRuntimeReloadAcceptances" | "setExecutionAdapterRuntimeReloadExecutions" | "setExecutionAdapterRuntimeReloadPlans" | "setExecutionAdapterSandboxOrderSchemaDryRuns" | "setExecutionAdapterSandboxProbeExecutions" | "setExecutionAdapterSandboxProbePlans" | "setExecutionAdapterSandboxProbeReviews" | "setExecutionAdapterSecretManifestValidations" | "setExecutionAdapterSecretMaterializations" | "setExecutionAdapterSecretReferences" | "setWatchlistCacheRefreshHistory" | "watchlistCacheRefreshHistory">;
type Result = Pick<AppControllerBindings, "settingsStatus" | "setSettingsStatus" | "hasLoadedSettingsStatus" | "setHasLoadedSettingsStatus" | "isSavingSettingsConfiguration" | "setIsSavingSettingsConfiguration" | "isTestingMonitoringWebhook" | "setIsTestingMonitoringWebhook" | "installingDataDependency" | "setInstallingDataDependency" | "settingsConfigurationMessage" | "setSettingsConfigurationMessage" | "hasUnsavedSettingsConfiguration" | "setHasUnsavedSettingsConfiguration" | "pendingSettingsWorkAreaId" | "setPendingSettingsWorkAreaId" | "settingsUnsavedDialogRef" | "settingsUnsavedContinueButtonRef" | "pendingSettingsNavigationActionRef" | "settingsSaveRequestIdRef" | "refreshSettingsStatus" | "saveSettingsConfiguration" | "installSettingsDataDependency" | "loadSettingsOpenAiCompatibleModels" | "testSettingsMonitoringWebhook" | "deferSettingsNavigation" | "continueEditingSettings" | "saveSettingsAndLeave" | "discardSettingsAndLeave"> & Pick<AppControllerBindings, "updateSettingsConfigurationDirty">;

export function useSettingsController(controller: Dependencies): Result {
  const {
    activeWorkAreaId, aiReviewStage3Providers, executionAdapterCertificationApplies, executionAdapterCertifications, executionAdapterControlledRestartEvidence, executionAdapterEnvironmentBindings,
    executionAdapterHealthProbe, executionAdapterHumanConfirmations, executionAdapterLedger, executionAdapterOpsStates, executionAdapterOrchestrationDryRuns, executionAdapterOrchestrationExecutions,
    executionAdapterPaperExecutions, executionAdapterPaperOrderLifecycles, executionAdapterPaperRouteRunbooks, executionAdapterProductionRouteReviews, executionAdapterRestartAcceptances, executionAdapterRuntimeReloadAcceptances,
    executionAdapterRuntimeReloadExecutions, executionAdapterRuntimeReloadPlans, executionAdapterSandboxOrderSchemaDryRuns, executionAdapterSandboxProbeExecutions, executionAdapterSandboxProbePlans, executionAdapterSandboxProbeReviews,
    executionAdapterSecretManifestValidations, executionAdapterSecretMaterializations, executionAdapterSecretReferences, setActiveWorkAreaId, setAiReviewStage3Providers, setExecutionAdapterCertificationApplies,
    setExecutionAdapterCertifications, setExecutionAdapterControlledRestartEvidence, setExecutionAdapterEnvironmentBindings, setExecutionAdapterHealthProbe, setExecutionAdapterHumanConfirmations, setExecutionAdapterLedger,
    setExecutionAdapterOpsStates, setExecutionAdapterOrchestrationDryRuns, setExecutionAdapterOrchestrationExecutions, setExecutionAdapterPaperExecutions, setExecutionAdapterPaperOrderLifecycles, setExecutionAdapterPaperRouteRunbooks,
    setExecutionAdapterProductionRouteReviews, setExecutionAdapterRestartAcceptances, setExecutionAdapterRuntimeReloadAcceptances, setExecutionAdapterRuntimeReloadExecutions, setExecutionAdapterRuntimeReloadPlans, setExecutionAdapterSandboxOrderSchemaDryRuns,
    setExecutionAdapterSandboxProbeExecutions, setExecutionAdapterSandboxProbePlans, setExecutionAdapterSandboxProbeReviews, setExecutionAdapterSecretManifestValidations, setExecutionAdapterSecretMaterializations, setExecutionAdapterSecretReferences,
    setWatchlistCacheRefreshHistory, watchlistCacheRefreshHistory
  } = controller;
  const [settingsStatus, setSettingsStatus] = useState<PlatformSettingsResult>(initialSettingsStatusState);
  const [hasLoadedSettingsStatus, setHasLoadedSettingsStatus] = useState(false);
  const [isSavingSettingsConfiguration, setIsSavingSettingsConfiguration] = useState(false);
  const [isTestingMonitoringWebhook, setIsTestingMonitoringWebhook] = useState(false);
  const [installingDataDependency, setInstallingDataDependency] =
      useState<InstallablePlatformDataDependency | null>(null);
  const [settingsConfigurationMessage, setSettingsConfigurationMessage] = useState<string | null>(null);
  const [hasUnsavedSettingsConfiguration, setHasUnsavedSettingsConfiguration] = useState(false);
  const updateSettingsConfigurationDirty = useCallback(
    (dirty: boolean) => setHasUnsavedSettingsConfiguration(dirty),
    [],
  );
  const [pendingSettingsWorkAreaId, setPendingSettingsWorkAreaId] = useState<ProductWorkAreaId | null>(null);
  const settingsUnsavedDialogRef = useRef<HTMLDialogElement | null>(null);
  const settingsUnsavedContinueButtonRef = useRef<HTMLButtonElement | null>(null);
  const pendingSettingsNavigationActionRef = useRef<(() => void) | null>(null);
  const settingsSaveRequestIdRef = useRef(0);
  const refreshSettingsStatus = useCallback(async () => {
      const settingsRequest = loadPlatformSettings(quantCoreBaseUrl).then((result) => {
        setSettingsStatus(result);
        setHasLoadedSettingsStatus(true);
        const freeStockdbConfigured = result.settings?.marketDataAdapters.some(
          (adapter) => adapter.id === "free-stockdb-ohlcv" && adapter.externalTelemetry.dependencyAvailable
        );
        if (freeStockdbConfigured) {
          void loadPlatformSettings(quantCoreBaseUrl, undefined, true).then((probedResult) => {
            if (probedResult.source === "core") setSettingsStatus(probedResult);
          });
        }
        return result;
      });
      const [settingsResult, adapterLedgerResult, adapterHealthProbeResult, watchlistRefreshHistory] = await Promise.all([
        settingsRequest,
        loadExecutionAdapterLedger(quantCoreBaseUrl),
        loadExecutionAdapterHealthProbe(quantCoreBaseUrl, { adapterId: "ccxt-live", exchange: "binance" }),
        loadWatchlistCacheRefreshRuns(quantCoreBaseUrl, { limit: 4 })
      ]);
      const liveAdapters = settingsResult.settings?.executionAdapters.filter((row) => row.route === "live") ?? [];
      const [
        certificationResults,
        applyResults,
        restartEvidenceResults,
        restartAcceptanceResults,
        secretReferenceResults,
        materializationResults,
        secretManifestValidationResults,
        environmentBindingResults,
        runtimeReloadPlanResults,
        runtimeReloadExecutionResults,
        runtimeReloadAcceptanceResults,
        orchestrationDryRunResults,
        orchestrationExecutionResults,
        humanConfirmationResults,
        sandboxProbePlanResults,
        sandboxProbeExecutionResults,
        sandboxProbeReviewResults,
        productionRouteReviewResults,
        sandboxOrderSchemaDryRunResults,
        paperOrderLifecycleResults,
        paperRouteRunbookResults,
        adapterOpsStateResults,
        adapterPaperExecutionResults
      ] = await Promise.all([
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterCertifications(quantCoreBaseUrl, row.id, undefined, 3))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterCertificationApplies(quantCoreBaseUrl, row.id, undefined, 5))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterControlledRestartEvidence(quantCoreBaseUrl, row.id, undefined, 5))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterRestartAcceptances(quantCoreBaseUrl, row.id, undefined, 5))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterSecretReferences(quantCoreBaseUrl, row.id, undefined, 5))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterSecretMaterializations(quantCoreBaseUrl, row.id, undefined, 5))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterSecretManifestValidations(quantCoreBaseUrl, row.id, undefined, 5))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterEnvironmentBindings(quantCoreBaseUrl, row.id, undefined, 5))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterRuntimeReloadPlans(quantCoreBaseUrl, row.id, undefined, 5))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterRuntimeReloadExecutions(quantCoreBaseUrl, row.id, undefined, 5))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterRuntimeReloadAcceptances(quantCoreBaseUrl, row.id, undefined, 5))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterOrchestrationDryRuns(quantCoreBaseUrl, row.id, undefined, 5))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterOrchestrationExecutions(quantCoreBaseUrl, row.id, undefined, 5))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterHumanConfirmations(quantCoreBaseUrl, row.id, undefined, 5))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterSandboxProbePlans(quantCoreBaseUrl, row.id, undefined, 5))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterSandboxProbeExecutions(quantCoreBaseUrl, row.id, undefined, 5))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterSandboxProbeReviews(quantCoreBaseUrl, row.id, undefined, 5))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterProductionRouteReviews(quantCoreBaseUrl, row.id, undefined, 5))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterSandboxOrderSchemaDryRuns(quantCoreBaseUrl, row.id, undefined, 5))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterPaperOrderLifecycles(quantCoreBaseUrl, row.id, undefined, 5))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterPaperRouteRunbooks(quantCoreBaseUrl, row.id, undefined, 5))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterOpsStates(quantCoreBaseUrl, row.id, undefined, 5))),
        Promise.all(liveAdapters.map((row) => loadExecutionAdapterPaperExecutions(quantCoreBaseUrl, row.id, undefined, 5)))
      ]);
      const productionRouteReviews = productionRouteReviewResults.flatMap((result) => result.adapterProductionRouteReviews);
      const latestCcxtProductionRouteReviewId = latestRecordedProductionRouteReviewIdForAdapter(
        productionRouteReviews,
        "ccxt-live"
      );
      const resolvedAdapterHealthProbeResult = latestCcxtProductionRouteReviewId
        ? await loadExecutionAdapterHealthProbe(quantCoreBaseUrl, {
            adapterId: "ccxt-live",
            exchange: "binance",
            productionRouteReviewId: latestCcxtProductionRouteReviewId
          })
        : adapterHealthProbeResult;
      setWatchlistCacheRefreshHistory(watchlistRefreshHistory.watchlistRefreshes);
      setExecutionAdapterLedger(adapterLedgerResult);
      setExecutionAdapterHealthProbe(resolvedAdapterHealthProbeResult);
      setExecutionAdapterCertifications(certificationResults.flatMap((result) => result.adapterCertifications));
      setExecutionAdapterCertificationApplies(applyResults.flatMap((result) => result.certificationApplies));
      setExecutionAdapterControlledRestartEvidence(restartEvidenceResults.flatMap((result) => result.controlledRestartEvidence));
      setExecutionAdapterRestartAcceptances(restartAcceptanceResults.flatMap((result) => result.restartAcceptances));
      setExecutionAdapterSecretReferences(secretReferenceResults.flatMap((result) => result.adapterSecretReferences));
      setExecutionAdapterSecretMaterializations(materializationResults.flatMap((result) => result.adapterSecretMaterializations));
      setExecutionAdapterSecretManifestValidations(
        secretManifestValidationResults.flatMap((result) => result.adapterSecretManifestValidations)
      );
      setExecutionAdapterEnvironmentBindings(environmentBindingResults.flatMap((result) => result.adapterEnvironmentBindings));
      setExecutionAdapterRuntimeReloadPlans(runtimeReloadPlanResults.flatMap((result) => result.adapterRuntimeReloadPlans));
      setExecutionAdapterRuntimeReloadExecutions(runtimeReloadExecutionResults.flatMap((result) => result.adapterRuntimeReloadExecutions));
      setExecutionAdapterRuntimeReloadAcceptances(runtimeReloadAcceptanceResults.flatMap((result) => result.adapterRuntimeReloadAcceptances));
      setExecutionAdapterOrchestrationDryRuns(orchestrationDryRunResults.flatMap((result) => result.adapterOrchestrationDryRuns));
      setExecutionAdapterOrchestrationExecutions(orchestrationExecutionResults.flatMap((result) => result.adapterOrchestrationExecutions));
      setExecutionAdapterHumanConfirmations(humanConfirmationResults.flatMap((result) => result.adapterHumanConfirmations));
      setExecutionAdapterSandboxProbePlans(sandboxProbePlanResults.flatMap((result) => result.adapterSandboxProbePlans));
      setExecutionAdapterSandboxProbeExecutions(
        sandboxProbeExecutionResults.flatMap((result) => result.adapterSandboxProbeExecutions)
      );
      setExecutionAdapterSandboxProbeReviews(
        sandboxProbeReviewResults.flatMap((result) => result.adapterSandboxProbeReviews)
      );
      setExecutionAdapterProductionRouteReviews(productionRouteReviews);
      setExecutionAdapterSandboxOrderSchemaDryRuns(sandboxOrderSchemaDryRunResults.flatMap((result) => result.adapterSandboxOrderSchemaDryRuns));
      setExecutionAdapterPaperOrderLifecycles(paperOrderLifecycleResults.flatMap((result) => result.adapterPaperOrderLifecycles));
      setExecutionAdapterPaperRouteRunbooks(paperRouteRunbookResults.flatMap((result) => result.adapterPaperRouteRunbooks));
      setExecutionAdapterOpsStates(adapterOpsStateResults.flatMap((result) => result.adapterOpsStates));
      setExecutionAdapterPaperExecutions(
        adapterPaperExecutionResults.flatMap((result) => result.adapterPaperExecutions)
      );
    }, []);
  const saveSettingsConfiguration = useCallback(async (request: PlatformSettingsUpdateRequest) => {
      const requestId = ++settingsSaveRequestIdRef.current;
      setIsSavingSettingsConfiguration(true);
      setSettingsConfigurationMessage(null);
      try {
        const result = await savePlatformSettings(quantCoreBaseUrl, request);
        if (result.source !== "core" || !result.settings) {
          setSettingsConfigurationMessage(`保存失败：${result.error ?? "核心服务未返回配置"}`);
          return false;
        }
        setSettingsStatus(result);
        setHasUnsavedSettingsConfiguration(false);
        setSettingsConfigurationMessage("配置已加密保存并实时生效。");
        const navigationAction = pendingSettingsNavigationActionRef.current;
        pendingSettingsNavigationActionRef.current = null;
        setPendingSettingsWorkAreaId(null);
        navigationAction?.();
        if (result.settings.marketDataAdapters.some(
          (adapter) => adapter.id === "free-stockdb-ohlcv" && adapter.externalTelemetry.dependencyAvailable
        )) {
          void loadPlatformSettings(quantCoreBaseUrl, undefined, true).then((probedResult) => {
            if (settingsSaveRequestIdRef.current === requestId && probedResult.source === "core") {
              setSettingsStatus(probedResult);
            }
          }).catch(() => undefined);
        }
        void loadAiReviewProviders(quantCoreBaseUrl).then((providers) => {
          if (settingsSaveRequestIdRef.current === requestId && providers.source === "core") {
            setAiReviewStage3Providers(providers.providers);
          }
        }).catch(() => undefined);
        return true;
      } catch (saveError) {
        setSettingsConfigurationMessage(
          `保存失败：${saveError instanceof Error ? saveError.message : "无法保存当前配置"}`
        );
        return false;
      } finally {
        setIsSavingSettingsConfiguration(false);
      }
    }, []);
  const installSettingsDataDependency = useCallback(async (dependency: InstallablePlatformDataDependency) => {
      setInstallingDataDependency(dependency);
      setSettingsConfigurationMessage(`正在安装 ${dependency}…`);
      try {
        const result = await installPlatformDataDependency(quantCoreBaseUrl, dependency);
        if (result.source !== "core" || !result.settings) {
          setSettingsConfigurationMessage(`安装失败：${result.error ?? "核心服务未返回状态"}`);
          return;
        }
        setSettingsStatus(result);
        setSettingsConfigurationMessage(
          `${dependency} 已安装并可在当前 API 环境导入，无需重启；数据源健康仍以首次读取证据为准。`
        );
      } finally {
        setInstallingDataDependency(null);
      }
    }, [quantCoreBaseUrl]);
  const loadSettingsOpenAiCompatibleModels = useCallback(
      (baseUrl: string) => loadOpenAiCompatibleModels(quantCoreBaseUrl, baseUrl),
      [],
    );
  const testSettingsMonitoringWebhook = useCallback(async () => {
      setIsTestingMonitoringWebhook(true);
      setSettingsConfigurationMessage(null);
      try {
        const result = await testMonitoringWebhook(quantCoreBaseUrl);
        setSettingsConfigurationMessage(
          result.source === "core"
            ? "Webhook 测试投递成功；未触发任何交易动作。"
            : `Webhook 测试失败：${result.error ?? "核心服务未返回投递结果"}`
        );
      } finally {
        setIsTestingMonitoringWebhook(false);
      }
    }, [quantCoreBaseUrl]);
  const deferSettingsNavigation = useCallback((
      targetWorkAreaId: ProductWorkAreaId,
      navigationAction: () => void,
    ) => {
      if (
        activeWorkAreaId === "settings"
        && targetWorkAreaId !== activeWorkAreaId
        && hasUnsavedSettingsConfiguration
      ) {
        pendingSettingsNavigationActionRef.current = navigationAction;
        setPendingSettingsWorkAreaId(targetWorkAreaId);
        return true;
      }
      return false;
    }, [activeWorkAreaId, hasUnsavedSettingsConfiguration]);
  const continueEditingSettings = useCallback(() => {
      pendingSettingsNavigationActionRef.current = null;
      setPendingSettingsWorkAreaId(null);
    }, []);
  const saveSettingsAndLeave = useCallback(() => {
      const form = document.querySelector<HTMLFormElement>("#settings-configuration");
      if (!form) return;
      if (!form.checkValidity()) {
        continueEditingSettings();
        window.requestAnimationFrame(() => form.reportValidity());
        return;
      }
      form.requestSubmit();
    }, [continueEditingSettings]);
  const discardSettingsAndLeave = useCallback(() => {
      const navigationAction = pendingSettingsNavigationActionRef.current;
      if (!pendingSettingsWorkAreaId || !navigationAction) return;
      pendingSettingsNavigationActionRef.current = null;
      setHasUnsavedSettingsConfiguration(false);
      setPendingSettingsWorkAreaId(null);
      navigationAction();
    }, [pendingSettingsWorkAreaId]);
  return {
    settingsStatus, setSettingsStatus, hasLoadedSettingsStatus, setHasLoadedSettingsStatus, isSavingSettingsConfiguration, setIsSavingSettingsConfiguration,
    isTestingMonitoringWebhook, setIsTestingMonitoringWebhook, installingDataDependency, setInstallingDataDependency, settingsConfigurationMessage, setSettingsConfigurationMessage,
    hasUnsavedSettingsConfiguration, setHasUnsavedSettingsConfiguration, pendingSettingsWorkAreaId, setPendingSettingsWorkAreaId, settingsUnsavedDialogRef, settingsUnsavedContinueButtonRef,
    pendingSettingsNavigationActionRef, settingsSaveRequestIdRef, refreshSettingsStatus, saveSettingsConfiguration, installSettingsDataDependency, loadSettingsOpenAiCompatibleModels,
    testSettingsMonitoringWebhook, deferSettingsNavigation, continueEditingSettings, saveSettingsAndLeave, discardSettingsAndLeave,
    updateSettingsConfigurationDirty
  };
}
