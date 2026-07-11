# Stage 5 Shadow Execution 第一阶段实施计划

## 目标

在不接真实券商的前提下，完成 Stage 5 首个可运行安全闭环：权威 Stage 4 输入、稳定 clientOrderId、shadow 状态机、限额、kill switch、超时恢复、对账、审计、Docker manifest 和阶段切换。

## 任务

- [x] 核对 Stage 4 退出标准、当前代码、核心文档和近期提交。
- [x] 定义 shadow session builder、validator、hash 和审计事件。
- [x] 增加 POST/GET shadow session API，复用 AuditEventStore 实现重启恢复与幂等。
- [x] 覆盖正常、超时恢复、拒绝、对账错配、kill switch 和篡改测试。
- [x] 增加 `aiqt.stage5ShadowExecutionAcceptance`、Docker smoke 和离线 validator。
- [x] 将 Stage 4 标为 maintenance、Stage 5 标为 current。
- [x] 同步中文 README、产品计划、架构和运维手册。
- [x] 完成全量测试、构建和 Docker smoke/validate。
- [x] 提交本阶段变更。

## 明确不做

- 不连接 broker/testnet 网络。
- 不读取或物化 broker secret。
- 不创建真实订单、撤单或账户同步。
- 不提前抽象多 broker adapter framework。
