import { useRef } from "react";
import { Radar, X } from "lucide-react";

import { McpConnectPage } from "../../mcp-connect/McpConnectPage";
import { productWorkAreaGroups, workAreaIcons } from "../navigation";
import type { AppControllerBindings } from "../controller/bindings";
import {
  authenticatedActor,
  hasPublicSession,
  isClaudeConnectEnabled,
  logoutPublicSession,
} from "../../../lib/public-auth";

export type NavigationRailViewModel = Pick<AppControllerBindings,
    "activeWorkAreaId" | "i18n" | "productWorkAreas" | "selectProductWorkArea" | "workspace"
  >;

type NavigationRailProps = { controller: NavigationRailViewModel };

export function NavigationRail({ controller }: NavigationRailProps) {
  const {
    activeWorkAreaId, i18n, productWorkAreas, selectProductWorkArea, workspace
  } = controller;
  const actor = authenticatedActor();
  const publicSession = hasPublicSession();
  const claudeConnectEnabled = isClaudeConnectEnabled();
  const connectDialogRef = useRef<HTMLDialogElement>(null);
  const renderItems = (workAreaIds: typeof productWorkAreaGroups[number]["workAreaIds"]) => (
    <div className="work-area-group-items">
      {workAreaIds.map((workAreaId) => {
        const area = productWorkAreas.find((candidate) => candidate.id === workAreaId);
        if (!area) return null;
        const Icon = workAreaIcons[area.id] ?? Radar;
        return (
          <button
            aria-current={activeWorkAreaId === area.id ? "page" : undefined}
            className={`work-area-button ${area.accent} ${area.status} ${activeWorkAreaId === area.id ? "selected active" : ""}`}
            key={area.id}
            onClick={() => selectProductWorkArea(area.id)}
            title={i18n.productWorkAreaLabel(area)}
            type="button"
          >
            <Icon size={16} />
            <span className="work-area-copy"><strong>{i18n.productWorkAreaLabel(area)}</strong></span>
          </button>
        );
      })}
    </div>
  );
  return (
    <aside className="left-rail">
            <div className="brand">
              <img className="brand-mark" src="/aiqt-logo.png" alt="AIQuantificationTools" />
              <div>
                <strong>AIQuantificationTools</strong>
                <span>{i18n.t("brand.subtitle")}</span>
              </div>
            </div>

            <section className="rail-section">
              <nav className="work-area-nav">
                {productWorkAreaGroups.map((group) => (
                  group.collapsible ? (
                    <details className="work-area-group" open={group.workAreaIds.includes(activeWorkAreaId) || undefined} key={group.id}>
                      <summary className="work-area-group-label">{i18n.locale === "zh-CN" ? group.labelZh : group.labelEn}</summary>
                      {renderItems(group.workAreaIds)}
                    </details>
                  ) : (
                    <section className="work-area-group" key={group.id}>
                      <p className="work-area-group-label">{i18n.locale === "zh-CN" ? group.labelZh : group.labelEn}</p>
                      {renderItems(group.workAreaIds)}
                    </section>
                  )
                ))}
              </nav>
            </section>

            <section className="rail-profile">
              <span className="rail-avatar">AQ</span>
              <span>
                <strong>{actor}</strong>
                <small>{i18n.locale === "zh-CN" ? "独立研究空间" : "Private research workspace"}</small>
              </span>
              <time dateTime={workspace.researchRun?.createdAt ?? ""}>
                {workspace.researchRun
                  ? new Date(workspace.researchRun.createdAt).toLocaleString("zh-CN", {
                      timeZone: "Asia/Shanghai"
                    })
                  : i18n.locale === "zh-CN"
                    ? "等待首次运行"
                    : "Waiting for first run"}
                <br />{i18n.strategyText("Asia/Shanghai")}
              </time>
              {claudeConnectEnabled ? (
                <button
                  aria-haspopup="dialog"
                  className="rail-connect-ai"
                  onClick={() => connectDialogRef.current?.showModal()}
                  type="button"
                >
                  连接第三方 AI
                </button>
              ) : null}
              {publicSession ? <button className="rail-logout" onClick={() => void logoutPublicSession()} type="button">退出登录</button> : null}
            </section>
            {claudeConnectEnabled ? (
              <dialog aria-labelledby="mcp-connect-title" className="mcp-connect-dialog" ref={connectDialogRef}>
                <form method="dialog">
                  <button aria-label="关闭第三方 AI 连接窗口" className="mcp-connect-dialog-close" type="submit">
                    <X aria-hidden="true" size={18} />
                  </button>
                </form>
                <McpConnectPage
                  embedded
                  origin={typeof window === "undefined" ? "" : window.location.origin}
                />
              </dialog>
            ) : null}
          </aside>
  );
}
