# Stage 5 Shadow Execution 运维手册

## 运行

先启动或复用 Docker 服务，再执行：

```bash
npm run docker:smoke:stage5 -- --no-build
npm run docker:smoke:stage5:validate
```

第一条命令会先生成新的 Stage 4 权威 workflow，再执行一次超时故障、一次恢复和一次幂等回读，输出 `data/stage5-shadow-execution.json`。第二条命令只离线复核 manifest，不访问网络。

## 预期结果

- attempt 1：`recoverable_failure`。
- attempt 2：`reconciled`。
- 第三次调用：回读 attempt 2，不新增审计事件。
- 两次 attempt 的 `clientOrderId` 完全相同。
- manifest 保持六项安全边界，其中 `shadowOnly=true`，其余 live/order route 字段保持阻断。

## 故障处理

- `stage5_shadow_workflow_not_found`：先完成 Stage 4 workflow 归档。
- `invalid_stage5_shadow_session`：检查 workflow hash、failure mode 和请求字段。
- attempt 1 超时：使用完全相同的请求重试一次；不要更换 workflow hash 或订单身份。
- attempt 2 仍失败、对账错配或 kill switch 触发：停止；保留审计事件，禁止补造成功。

## 安全边界

当前 adapter 是 `local-fake-shadow`，不会访问 broker、testnet 或资金账户。任何真实连接、账户同步、委托或撤单都需要后续独立设计、人工授权和验收，不能通过本阶段 manifest 解锁。
