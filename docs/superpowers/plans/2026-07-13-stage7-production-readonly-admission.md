# Stage 7 生产只读准入实施计划

## 状态

已完成。2026-07-13 真实生产只读 manifest 已通过生成、API 重启回读和离线校验；Stage 0 至 Stage 7 均为 maintenance，下一阶段待单独规划。

退出证据：4497 个 Binance Spot 生产市场，全部 mutation 权限关闭，脱敏 `SPOT` 账户摘要，evidence hash `21ae79056f2fa4d738e42a2a096a6caf4c154cdb38659db20c669f7a0d78f029`，manifest hash `5eba10c5549e64a4fa12b727c648a96bb66416b25672d32a17042b482895bd6c`。

设计依据：[Stage 7 生产只读准入设计](../specs/2026-07-13-stage7-production-readonly-admission-design.md)。

## 工作项

### 1. 契约与边界

- [x] 固定 Binance Spot 生产环境、独立只读凭据和 live-blocked 边界。
- [x] 定义生产只读准入、生产只读凭据和脱敏生产账户摘要。
- [x] 记录 Stage 7 不开放生产委托的架构决策。

### 2. 服务端探针与审计

- [x] 复用现有 CCXT health 模块实现生产只读探针。
- [x] 在账户读取前权威验证 API Key 的交易、提现和转账权限均关闭。
- [x] 生成不含资产、余额、原始响应或密钥的 canonical 审计证据。
- [x] 绑定 Stage 6 exit、既有 production route review 与操作者资格确认。
- [x] 增加 POST/GET API，并在回读时重验 hash 和安全边界。

### 3. Web 与运维

- [x] Execution 复用现有执行卡片样式展示 Stage 7 状态和单一触发动作。
- [x] 密钥只进入 API 服务环境，不进入 Web bundle、请求、响应、日志、镜像或 manifest。
- [x] 编写中文生产只读运维文档，覆盖最小权限、IP 限制、失败分类、轮换和撤销。

### 4. 验收与发布

- [x] 增加无密钥 Docker smoke/validate，并接入默认 CI。
- [x] 增加人工真实生产只读 smoke/validate；无凭据时明确保持 pending。
- [x] 覆盖凭据回退、可交易 Key、可提现/转账 Key、脱敏、篡改、重启和回读测试。
- [x] 运行全量 Python/Web、构建、Docker 回归与双轴审查。
- [x] 同步 README、产品规划、架构和阶段状态，提交、推送并创建 PR。

## 明确不做

- 生产订单、成交、撤单、转账、提现或 live route。
- 生产资产明细、余额展示、账户历史或常驻同步。
- 第二交易所、多账户、Futures、杠杆或通用 broker framework。
