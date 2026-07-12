# Stage 6 Binance Spot Testnet 执行实施计划

## 状态

已完成。代码、无密钥门禁、真实 Binance Spot Testnet 双订单验收与顶层退出门禁全部通过，Stage 6 于 2026-07-13 转入 maintenance。

设计依据：[Stage 6 Binance Spot Testnet 执行设计](../specs/2026-07-12-stage6-binance-spot-testnet-execution-design.md)。

## 工作项

### 1. 阶段与权威契约

- [x] 将 Stage 6 标为 current，保持 Stage 0 至 Stage 5 为 maintenance。
- [x] 在独立分支实现 Stage 6 canonical batch/authorization/order transition/kill switch builder、validator 与 hash。
- [x] 只接受同一 Stage 4/5 权威证据链，复用稳定 `clientOrderId`、批次顺序和 `maxBatchNotional`。
- [x] 固定 Sandbox/live 分离字段，拒绝含糊 route、越权字段和自洽重算后的篡改。

### 2. Binance Spot Testnet 最小执行模块

- [x] 复用已安装 CCXT，创建 exchange 后首先启用 sandbox mode，并固定 Binance Spot。
- [x] 只读取 `CCXT_SANDBOX_API_KEY` / `CCXT_SANDBOX_SECRET`，缺失或环境不匹配时 fail closed。
- [x] 实现 markets/余额读取、数量价格规范化、GTC 限价创建、按 `clientOrderId` 查询和撤单。
- [x] 复用 CCXT module/exchange 注入做测试，不增加通用 broker interface 或 fake 产品 adapter。

### 3. 授权、提交与恢复

- [x] 规范化后执行交易对、精度、最小数量/金额、余额和 Stage 4 限额校验；失败不自动改单。
- [x] 实现绑定完整订单 hash、10 分钟有效的一次性批次授权。
- [x] 外部调用前持久化 `submission_pending`，按 canonical 顺序逐单提交。
- [x] 超时先查询，同 `clientOrderId` 最多重试一次；持续未知进入 `reconciliation_required`。
- [x] 批次失败立即停止后续提交、尽力撤销未成交订单并按交易所事实对账。
- [x] 强制单账户只存在一个活动批次。

### 4. Kill Switch 与事件驱动对账

- [x] 实现账户级持久化 kill switch，触发后先落账、阻断新提交并尽力撤销本系统未成交订单。
- [x] 人工重置前要求活动批次已完成权威对账。
- [x] 复用一个对账函数覆盖 API 启动、提交/撤单后、人工刷新和 kill switch。
- [x] 覆盖容器/API 重启后的 pending/open/partial/reconciliation_required 恢复。

### 5. API、Execution 与 Audit 黄金路径

- [x] 在现有标准库 API 中增加最小候选、授权、提交、查询、撤单、对账和 kill switch 合同。
- [x] 客户端只提交权威 id 与人工确认，不接受可绕过服务端重建的完整订单 payload。
- [x] Execution 实现唯一“检查 → 授权 → 提交 → 对账/撤单”路径和持久化恢复。
- [x] Portfolio 只跳转候选，Settings 只显示配置/探针，Audit 只读展示转换与 hash。
- [x] 覆盖成功、拒绝、活动批次阻断、授权过期、kill switch、刷新和 375px 布局。

### 6. 便携审计与安全导入

- [x] 扩展现有 `auditEvents[]`、`artifactCounts`、导出、导入预检、原子回滚和 Audit 包浏览器。
- [x] 按 Stage 4 → Stage 5 → Stage 6 依赖顺序服务端重建全部状态与 hash。
- [x] 导入的 Stage 6 证据固定为 `detached`，验证其不能提交、撤单、重试或对账。
- [x] 验证任何响应、日志、artifact、Web bundle 和 manifest 均不包含密钥。

### 7. Docker、真实 Testnet 与顶层退出门禁

- [x] 增加无密钥 Stage 6 Docker smoke/validate，确定性证明 fail closed 和故障恢复。
- [x] 增加显式凭据的 Binance Spot Testnet smoke/validate，完成真实提交、查询、撤单、对账和重启恢复。
- [x] 生成脱敏 `data/stage6-binance-spot-testnet.json`，不把网络偶发成交伪造成撤单成功。
- [x] 新增 `aiqt.stage6ExitAcceptance`，绑定 Stage 5 exit、无密钥门禁、真实 Testnet manifest 与安全字段。
- [x] 接入 CI：无密钥门禁始终运行；真实 Testnet 门禁只在受保护的人工发布验收环境运行，最终退出必须具备其 manifest。

### 8. 文档、全量验证与交付

- [x] 同步 README、产品规划、架构、`CONTEXT.md`、ADR 和中文 `docs/stage6-sandbox-operations.md`。
- [x] 运维文档覆盖密钥配置、启动检查、黄金路径、kill switch、未知状态恢复、对账、撤单和凭据轮换。
- [x] 运行聚焦测试、Python/Web 全量测试、生产构建与 Stage 3/4/5 回归门禁。
- [x] 运行 Stage 6 无密钥 Docker smoke/validate、真实 Testnet smoke/validate 和浏览器验收。
- [x] 执行 Standards/Spec 双轴独立审查并修复全部重要问题。
- [x] 更新本计划的实际验证结果，提交、推送、创建 PR、等待 CI 通过并合并到 main。

## 验收记录

- 聚焦 Stage 6：13 项 Python 测试通过，覆盖超过 50 条事件的分页回读、崩溃 pending 查询后同 ID 一次重试、撤单缺单禁止反向提交、终态恢复与 detached 导入阻断。
- 全量回归：Python 619/619、Web 936/936；`npm run build` 通过，仅保留既有 chunk size 提示。
- Docker 回归：Stage 3 local baseline、Stage 4 2 legs/2 orders/replayExact、Stage 5 5 drills/6 sessions/restartExact/portable 和 exit maintenance 全部通过；Stage 6 无密钥 smoke/validate 通过。
- Stage 6 无密钥 manifest hash 为 `40eacb8bc5c6db3514e2d1da27aedcb5675630f8f4617d1f6d1284c779e827ed`；专用凭据缺失、通用凭据拒绝、全部 live 字段为 false、`liveBlockedBoundary=true`。
- 浏览器验收：375px 无横向溢出；Execution Stage 6 阻断证据、独立 kill switch、刷新持久化与 exit missing 状态已验证，无控制台错误。
- 首轮 Standards/Spec 审查发现 5 个 Important，已修复事件分页、pending 恢复重试、统一交易所证据入口、撤单禁止反向提交，以及真实门禁绕过 API/硬编码 checks 的问题；最终复审为 Critical 0、Important 0、Minor 0。
- 真实 Binance Spot Testnet：BTC/USDT 与 ETH/USDT 两笔 GTC 限价委托均完成真实创建、查询、撤销和终态 `canceled` 对账；API 重启、detached 导入回读与八项检查全部通过。
- 真实 manifest hash：`096e5df28a48c7f7a6e99632622daacfd06da480c50b1f7daa83331492db884d`；`aiqt.stage6ExitAcceptance.status=accepted_for_maintenance`，全部 live 字段为 false。
- 实现提交：`2071065 feat: implement stage6 sandbox execution`；审查修复提交：`eb67192 fix: harden stage6 recovery acceptance`；PR [#3](https://github.com/wqjuser/AIQuantificationTools/pull/3) 的双 quality-gate 与 GitGuardian 全部通过，已以 merge commit `3b7314c` 合并到 main。

## 明确不做

- 不实现真实资金、生产 endpoint 或 live route。
- 不实现 Futures、杠杆、保证金、多交易所、多账户或并发批次。
- 不增加第二套订单/风险算法、通用 broker framework、常驻轮询器或消息队列。
