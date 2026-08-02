import { PageHeader, Status } from "../../components/TerminalSurfaceUi";
import type { TerminalWorkspacePageProps } from "../shared/terminal-workspace-page";
import { terminalSurfaceZh } from "../shared/terminal-workspace-formatters";
import "./StrategyPage.layout.css";
import "./StrategyAi.layout.css";
import "./StrategyExperiments.layout.css";
import "./StrategyLibrary.layout.css";
import "./StrategyWorkbench.layout.css";

export function StrategyPage({
  action,
  strategyWorkbench,
  workspace,
}: Pick<
  TerminalWorkspacePageProps,
  "action" | "strategyWorkbench" | "workspace"
>) {
  return (
    <>
      <PageHeader
        action={action}
        title="策略工坊"
        subtitle={`/ ${terminalSurfaceZh.strategyText(workspace.strategy.name)}`}
      >
        <div className="design-meta-line">
          状态：<Status tone="warning">草稿</Status>
          <span>
            修订版：{workspace.researchRun?.strategyRevision ?? "草稿"}
          </span>
          <span>
            最后修改：
            {workspace.researchRun
              ? new Date(workspace.researchRun.createdAt).toLocaleString(
                  "zh-CN",
                )
              : "尚未保存"}
          </span>
        </div>
      </PageHeader>
      <section
        aria-label="策略构建与版本治理"
        className="design-strategy-workbench"
      >
        {strategyWorkbench}
      </section>
    </>
  );
}
