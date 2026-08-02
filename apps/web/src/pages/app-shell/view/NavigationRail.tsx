import { productWorkAreaGroups, productWorkAreaIds, workAreaIcons } from "../navigation";
import { Radar } from "lucide-react";
import type { AppControllerBindings } from "../controller/bindings";

export type NavigationRailViewModel = Pick<AppControllerBindings,
    "activeWorkAreaId" | "i18n" | "productWorkAreas" | "selectProductWorkArea" | "workspace"
  >;

type NavigationRailProps = { controller: NavigationRailViewModel };

export function NavigationRail({ controller }: NavigationRailProps) {
  const {
    activeWorkAreaId, i18n, productWorkAreas, selectProductWorkArea, workspace
  } = controller;
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
                  <section className="work-area-group" key={group.id}>
                    <p className="work-area-group-label">
                      {i18n.locale === "zh-CN" ? group.labelZh : group.labelEn}
                    </p>
                    <div className="work-area-group-items">
                      {group.workAreaIds.map((workAreaId) => {
                        const area = productWorkAreas.find((candidate) => candidate.id === workAreaId);
                        if (!area) {
                          return null;
                        }
                        const Icon = workAreaIcons[area.id] ?? Radar;
                        const index = productWorkAreaIds.indexOf(area.id);
                        return (
                          <button
                            aria-current={activeWorkAreaId === area.id ? "page" : undefined}
                            className={`work-area-button ${area.accent} ${area.status} ${
                              activeWorkAreaId === area.id ? "selected active" : ""
                            }`}
                            key={area.id}
                            onClick={() => selectProductWorkArea(area.id)}
                            title={`${i18n.productWorkAreaLabel(area)} · ${i18n.productWorkAreaDescription(area)} · ${i18n.productWorkAreaDeliveryStage(area)}`}
                            type="button"
                          >
                            <span className="work-area-index">{index + 1}</span>
                            <Icon size={16} />
                            <span className="work-area-copy">
                              <strong>{i18n.productWorkAreaLabel(area)}</strong>
                              <small>{i18n.productWorkAreaDescription(area)}</small>
                              <span className="work-area-stage">
                                <span>{i18n.productWorkAreaDeliveryStage(area)}</span>
                                <em>{i18n.productDevelopmentStageStatus(area.deliveryStageStatus)}</em>
                              </span>
                            </span>
                            <em className="work-area-status">{i18n.productWorkAreaStatus(area.status)}</em>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </nav>
            </section>

            <section className="rail-profile">
              <span className="rail-avatar">AQ</span>
              <span>
                <strong>quant.user</strong>
                <small>{i18n.locale === "zh-CN" ? "研究员 · 三级" : "Researcher · Level 3"}</small>
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
            </section>
          </aside>
  );
}
