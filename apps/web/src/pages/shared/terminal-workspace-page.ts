import type { ReactNode, RefObject } from "react";
import type {
  Stage4PortfolioGoldenPath,
  Stage4PortfolioWorkflow,
} from "../../lib/portfolio-stage4";
import type {
  PortfolioRiskAssessment,
  PortfolioRiskAssessmentRequest,
} from "../../lib/portfolio-m5";
import type { AiReviewProviderId, AiReviewProviderStatus } from "../../lib/ai-review-stage3";
import type {
  CacheWatchlistRefreshRun,
  InstallablePlatformDataDependency,
  MarketAiSelectionResearchOrigin,
  MarketCalendarStatus,
  MarketDiscoveryParams,
  MarketDiscoveryResult,
  MarketInformationResult,
  OpenAiCompatibleModelsResult,
  PlatformSettingsStatus,
  PlatformSettingsUpdateRequest,
  PortfolioBacktestRun,
  ProductionStrategyHandoffResult,
  ResearchNoteResult,
  StrategyProductionBinding,
} from "../../lib/terminal-api";
import type { ColorScheme } from "../../lib/theme";
import type {
  BrokerAdapterRow,
  ExecutionAdapterChainHealthRollup,
  ExecutionAdapterHealthProbeRow,
  ExecutionAdapterLedgerRow,
  Instrument,
  Market,
  PortfolioPaperOrderApprovalRow,
  ProductWorkAreaId,
  ResearchRunAudit,
  StrategyExperimentDetail,
  StrategyExperimentListItem,
  StrategyExperimentWalkForward,
  TerminalWorkspace,
  Timeframe,
} from "../../lib/terminal-workbench";
import type { MarketAiSelectionController } from "../../components/MarketAiSelectionPanel";
import type { SurfaceAction } from "../../components/TerminalSurfaceUi";
import type { AiReviewController } from "./ai-review-contract";
import type { AutoTradingSnapshot } from "./auto-trading-contract";

export type TerminalWorkspaceSurfaceAction = SurfaceAction;

export interface TerminalWorkspacePageProps {
  action: TerminalWorkspaceSurfaceAction;
  activeWorkAreaId: ProductWorkAreaId;
  adapterRows: BrokerAdapterRow[];
  adapterChainHealthRollups?: ExecutionAdapterChainHealthRollup[];
  adapterHealthProbeRows?: ExecutionAdapterHealthProbeRow[];
  adapterLedgerRows?: ExecutionAdapterLedgerRow[];
  settings?: PlatformSettingsStatus;
  isLoadingSettingsConfiguration?: boolean;
  installingDataDependency?: InstallablePlatformDataDependency | null;
  isSavingSettingsConfiguration?: boolean;
  isTestingMonitoringWebhook?: boolean;
  onLoadOpenAiCompatibleModels?: (baseUrl: string) => Promise<OpenAiCompatibleModelsResult>;
  onInstallDataDependency?: (dependency: InstallablePlatformDataDependency) => void;
  onSaveSettingsConfiguration?: (request: PlatformSettingsUpdateRequest) => Promise<boolean> | void;
  onSettingsConfigurationDirtyChange?: (dirty: boolean) => void;
  onTestMonitoringWebhook?: () => void;
  settingsConfigurationMessage?: string | null;
  aiReview: AiReviewController;
  chart: ReactNode;
  colorScheme: ColorScheme;
  executionAcceptanceAudit?: ReactNode;
  executionReadiness?: ReactNode;
  executionSnapshot?: AutoTradingSnapshot | null;
  isSavingWatchlist: boolean;
  latestWatchlistCacheRefresh: CacheWatchlistRefreshRun | null;
  marketCalendar?: MarketCalendarStatus;
  marketDiscovery?: {
    isLoading: boolean;
    onSearch: (params: MarketDiscoveryParams) => void;
    result: MarketDiscoveryResult | null;
  };
  marketAiSelection?: MarketAiSelectionController;
  marketAiSelectionResearchOrigin?: MarketAiSelectionResearchOrigin | null;
  marketInformation?: {
    isLoading: boolean;
    isLoadingNews: boolean;
    market: Market;
    newsResult: MarketInformationResult | null;
    onMarketChange: (market: Market) => void;
    onNewsPageChange: (offset: number, scope: "all" | "market" | "instrument") => void;
    onRefresh: () => void;
    result: MarketInformationResult | null;
    symbol: string;
  };
  marketRefreshIssue: string | null;
  onApprovePortfolioOrder?: (row: PortfolioPaperOrderApprovalRow) => void;
  onRemoveWatchlistInstrument: (instrument: Instrument) => void;
  onRejectPortfolioOrder?: (row: PortfolioPaperOrderApprovalRow) => void;
  onSaveWatchlist: () => void;
  onOpenMarketInformation?: () => void;
  onScrollPositionChange: (scrollTop: number) => void;
  onSelectInstrument: (instrument: Instrument) => void;
  onResearchInstrument?: (instrument: Instrument) => void;
  onSelectTimeframe: (timeframe: Timeframe) => void;
  approvingPortfolioOrderId?: string | null;
  portfolio: PortfolioBacktestRun | null;
  portfolioActionError?: string | null;
  portfolioGoldenPath?: Stage4PortfolioGoldenPath;
  portfolioPaperOrderApprovalRows?: PortfolioPaperOrderApprovalRow[];
  portfolioProductionRisk?: {
    snapshot: AutoTradingSnapshot | null;
    error: string | null;
    loading: boolean;
    onRefresh: () => void;
  };
  portfolioRiskAssessment?: PortfolioRiskAssessment | null;
  portfolioStage4Workflow?: Stage4PortfolioWorkflow | null;
  isRunningPortfolioRiskAssessment?: boolean;
  onRunPortfolioRiskAssessment?: (request: PortfolioRiskAssessmentRequest) => void;
  productionStrategyHandoff?: {
    binding: StrategyProductionBinding | null;
    busy: boolean;
    errorLabel: string | null;
    switchBlockedReasonLabel?: string | null;
    onBind: (operator: string) => Promise<boolean>;
    onOpenDynamicTrading: () => void;
    result: ProductionStrategyHandoffResult;
  };
  researchPreparation: {
    externalDataApproved: boolean;
    generationError: string | null;
    generationStatus: string | null;
    isGeneratingNote: boolean;
    isSavingNote: boolean;
    isSavingWorkspace: boolean;
    note: ResearchNoteResult;
    noteDraft: string;
    onExternalDataApprovedChange: (approved: boolean) => void;
    onGenerateNote: () => void;
    onNoteChange: (value: string) => void;
    onProviderChange: (providerId: AiReviewProviderId) => void;
    onSaveNote: () => void;
    onSaveWorkspace: () => void;
    providerId: AiReviewProviderId;
    providers: AiReviewProviderStatus[];
    workspaceSaved: boolean;
  };
  runs: ResearchRunAudit[];
  source: "core" | "fallback";
  strategyExperiment: {
    active: StrategyExperimentDetail | null;
    busy: boolean;
    error: string | null;
    history: StrategyExperimentListItem[];
    onWalkForwardChange: (walkForward: StrategyExperimentWalkForward | null) => void;
    walkForward: StrategyExperimentWalkForward | null;
  };
  strategyWorkbench: ReactNode;
  surfaceRef: RefObject<HTMLElement | null>;
  workflowGuide?: ReactNode;
  workspace: TerminalWorkspace;
}

export const terminalWorkspacePageTitles: Record<ProductWorkAreaId, string> = {
  market: "行情中心",
  "market-information": "市场资讯",
  research: "研究工作台",
  strategy: "策略工坊",
  backtest: "回测实验室",
  "ai-review": "AI 评审",
  portfolio: "组合风控",
  execution: "执行中心",
  "dynamic-trading": "动态交易",
  audit: "审计回放",
  settings: "设置",
};
