# Cache Stats In Settings

## Goal

让 Settings 工作区从“只显示缓存路径”推进到“可观察本地行情缓存状态”：本地核心 `/api/settings/status` 返回 SQLite OHLCV 缓存的总行数、市场/标的/周期上下文数量和最新 K 线时间，前端设置页以紧凑方式展示这些状态。

## Scope

- 后端 `MarketDataCache` 增加只读统计能力。
- `/api/settings/status` 合并缓存统计，仍不返回任何密钥值，也不执行修复/删除/刷新操作。
- 前端 API 契约校验新增缓存统计字段。
- Settings UI 展示行数、上下文数量和最新时间。
- 更新产品计划和架构文档。

## Out Of Scope

- 缓存清理、重建、刷新队列。
- 数据源 API Key 写入或编辑。
- 实盘交易闸门解锁。

## TDD Checklist

- [x] RED: 后端缓存统计测试先失败。
- [x] RED: 前端 Settings 契约测试先失败。
- [x] GREEN: 实现缓存统计和设置接口输出。
- [x] GREEN: 实现前端契约与 UI 展示。
- [x] REFACTOR: 文案和文档收敛。
- [x] VERIFY: targeted tests, full tests, build, diff check, Browser smoke.
