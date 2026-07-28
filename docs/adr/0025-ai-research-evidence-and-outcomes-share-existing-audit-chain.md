# M4 AI 研究证据与结果复盘共享既有审计链

M4 不新建 AI Provider、研究状态机、行情仓库或独立结果数据库。它以既有权威 `aiqt.aiReviewRun` 为起点，把研究证据包和到期结果写入 `AuditEventStore`，继续绑定研究运行、策略实验、数据快照和原有 paper-only 边界。

## 决策

权威 AI 评审完成后，用户可以创建一份 `aiqt.aiResearchEvidence`：

- `claims[]` 分别使用 `fact`、`calculation`、`assumption` 和 `model_inference` 标签，并引用既有 AI 评审证据项；
- `informationRichness` 只评价证据种类、来源和缺口，`investmentCertainty` 单独评价当前判断的一致性，两者不互相推导；
- `recommendation` 记录研究观点、声明的持有周期、参考时间、参考价、原 AI 评审和快照身份，但没有目标仓位、风险授权或订单语义；
- `priorOutcomeLessons[]` 只作为未来研究上下文，并固定声明不能影响风险、授权、权限或订单路由。

A 股财务事实首版只覆盖营收、净利润、经营现金流、总资产、股东权益和每股收益。每个事实必须提供两个来源标识不同的观测值。服务端保留两边原值和来源，校验报告期与单位，按相对差异分类为 `agreement`、`warning` 或 `blocked`，并固定 `valuesMerged=false`。未提供财务事实时明确显示 `unavailable`，不会伪装成已完成验证；本阶段不建立通用财务仓库，也不静默抓取或融合公共来源。

多视角评审是同一份已审计证据的可选投影，只使用 bullish、bearish 和 neutral 三个角色，不创建 Agent 编排框架。它只允许 `1d` 或 `1w` 长周期研究；分钟级请求在服务端阻断，因此不会进入自动交易热路径或增加其延迟。

结果评估通过后续已审计研究运行完成，不直接调用公网行情。后续运行必须与原建议市场、标的和周期一致，并包含声明周期之后的已闭合 K 线；基准也必须引用一份同市场、同周期的已审计运行。结果记录原始收益、观点调整后收益、最大不利波动、基准收益和 alpha，并绑定原建议、AI 评审、研究运行、快照和基准快照。周期尚未到期、基准缺失或上下文不一致时不生成完成结果。

研究证据和结果分别使用 `ai_research_evidence`、`ai_research_outcome` 审计事件。事件 ID 和记录哈希由规范内容生成；相同输入幂等回读，不同内容不会覆盖旧记录。研究运行导出已经携带 `auditEvents[]`，因此 M4 证据自动复用现有导出、导入和完整性边界。

## 安全边界

- M4 只读取权威 AI 评审、策略实验和研究快照，不修改 AI 评审原记录。
- M4 没有交易适配器、账户、余额、订单、对账、模式切换或急停方法。
- `recommendation` 是研究观点，不是 `Signal`、`PortfolioTarget` 或 `OrderIntent`。
- 历史结果只进入后续研究证据，不能改变既有风险、生产准入、人工确认或路由状态。
- 普通测试和 Docker 验收使用冻结快照，不调用外部 AI、Testnet 或 Production 写接口。

## 验收

M4 退出需要同时证明：

1. 四类声明在 API 和界面中分栏展示，并保留证据引用。
2. 信息丰富度与投资确定性分别计算、分别显示。
3. A 股重要财务事实双来源报告覆盖一致、警告、阻断、单位或报告期不一致，并证明 `valuesMerged=false`。
4. 多视角评审仅在日线或周线显式启用，分钟级请求确定性阻断。
5. 到期复盘覆盖原始收益、观点调整收益、不利波动、基准收益和 alpha，并绑定原建议与快照。
6. 未到期、错误上下文、缺失基准和篡改哈希均不能形成完成结果。
7. 历史结果仅出现在后续研究上下文，安全边界明确阻断风险、授权、权限和订单路由影响。
8. Python/API、Web 组件、全量测试、生产构建、隔离 Docker 和真实页面复验通过。

## M4 退出结论

截至 2026-07-28，上述八项均由当前代码和可运行证据覆盖。后端聚焦测试覆盖四类声明、两种独立评分、财务差异的一致/警告/阻断及单位/报告期错配、分钟级多视角阻断、到期收益与基准 alpha、未到期和篡改拒绝、审计幂等及真实本地 HTTP 回环；前端聚焦测试覆盖严格响应校验、API 接线、生成/回读/复盘状态与真实评审工作区布局。

最终回归为 M4 Python `6 / 6`、M4/布局/评审工作区聚焦 `218 / 218`、Python 全量 `792 / 792`、Web 全量 `1083 / 1083`，生产构建和 `git diff --check` 通过，仅保留既知前端 chunk-size 提示。全量回归同时修复 M2 测试固定心跳与真实时钟混用造成的 90 秒后伪 `heartbeat_stale`：测试类统一冻结时钟，产品监控逻辑未改变，M2 聚焦 `11 / 11` 通过。

独立 Compose 项目 `aiqt-m4-acceptance` 使用独立数据卷和 5174 端口，显式清空交易、生产、AI、Webhook、free-stockdb 与代理配置。隔离环境生成一份本地权威 AI 评审和冻结双源研究证据；API 创建/回读的记录哈希一致，四类声明、双评分、`warning / valuesMerged=false`、三视角和五项研究边界均可回读。到期结果的完整计算使用冻结运行在测试中验证；Docker 页面没有伪造未到期的后续运行或基准。

真实页面 `http://127.0.0.1:5174/?workspace=ai-review&market=ashare&symbol=600000&timeframe=1d` 在 `1280 × 720` 下显示完整 M4 研究区，桌面主栏宽 734px，页面无横向溢出，控制台 `0 error / 0 warning`。复验只展开双源差异和三视角详情，没有点击运行研究、AI 评审、生成证据、到期复盘、模式切换、急停、对账或任何订单动作。

首次调用既有 `tools/docker_smoke.py` 时未带 `--no-build`，该工具按默认行为重建并重启了主 Compose 的 5173 `api/web`；发现后未再调用该路径。重启后的主服务均为 healthy，只读复核保持 `executionMode=testnet`、`enabled=true`、`runnerState=running`、`liveTradingAllowed=false`、`orderSubmissionEnabled=false`、`routeExecuted=false`、`liveBlockedBoundary=true`。M4 没有触发 Testnet/Production 委托、外部 AI 或执行状态变更。
