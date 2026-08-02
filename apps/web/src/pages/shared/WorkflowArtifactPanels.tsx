import { type AppI18n } from "../../lib/i18n";
import { Timeframe, WorkflowRunState, WorkflowStageView } from "../../lib/terminal-workbench";

export function CompactWorkflowNodes({
  activeStageId,
  i18n,
  runState,
  stages
}: {
  activeStageId: string;
  i18n: AppI18n;
  runState: WorkflowRunState;
  stages: WorkflowStageView[];
}) {
  const selectedStage = stages.find((stage) => stage.id === activeStageId) ?? stages[0];

  return (
    <div className="workflow-workspace compact">
      <div className="workflow-canvas-label">{i18n.t("module.workflow.canvas")}</div>
      <div className="workflow-canvas-large">
        {stages.map((stage) => {
          const translated = i18n.workflowNode(stage.id, stage.label, stage.detail);
          return (
            <article
              className={`workflow-stage ${stage.status} ${stage.id === selectedStage?.id ? "selected" : ""}`}
              key={stage.id}
            >
              <small>{workflowStageStatusLabel(i18n, stage.status)}</small>
              <strong>{translated.label}</strong>
              <span>{i18n.strategyText(stage.output)}</span>
            </article>
          );
        })}
      </div>
      {selectedStage ? (
        <div className="workflow-artifacts">
          <span>{i18n.t("module.workflow.artifacts")}</span>
          <div className="workflow-artifact-grid">
            {selectedStage.artifacts.map((artifact) => (
              <article className={`workflow-artifact ${artifact.tone}`} key={`${artifact.label}-${artifact.value}`}>
                <span>{workflowArtifactLabel(i18n, artifact.label)}</span>
                <strong>{i18n.strategyText(artifact.value)}</strong>
                <p>{i18n.strategyText(artifact.detail)}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
      <div className="workflow-log">
        <span>{i18n.t("module.workflow.log")}</span>
        {runState.log.length ? (
          <div className="workflow-log-list">
            {runState.log.map((entry) => (
              <article className={`workflow-log-entry ${entry.level}`} key={entry.id}>
                <small>{workflowArtifactLabel(i18n, entry.stageId)}</small>
                <span>{i18n.strategyText(entry.message)}</span>
              </article>
            ))}
          </div>
        ) : (
          <p className="workflow-log-empty">{i18n.t("module.workflow.idle")}</p>
        )}
      </div>
    </div>
  );
}

export function workflowStageStatusLabel(i18n: AppI18n, status: WorkflowStageView["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return (
    {
      active: "待运行",
      ready: "待运行",
      blocked: "阻断",
      running: "运行中",
      completed: "完成",
      failed: "失败"
    } satisfies Record<WorkflowStageView["status"], string>
  )[status];
}

export function workflowArtifactLabel(i18n: AppI18n, label: string): string {
  if (i18n.locale === "en-US") {
    return label;
  }
  return (
    {
      Instrument: "标的",
      Timeframe: "周期",
      Rows: "数据",
      Entry: "入场",
      Exit: "出场",
      Risk: "风控",
      Return: "收益率",
      "Max DD": "最大回撤",
      "Win Rate": "胜率",
      Trades: "交易数",
      "Initial cash": "初始资金",
      Fee: "手续费",
      Slippage: "滑点",
      Mode: "模式",
      "Live gates": "实盘闸门",
      data: "数据",
      factor: "因子",
      backtest: "回测",
      agent: "智能体",
      execution: "执行"
    } as Record<string, string>
  )[label] ?? label;
}
