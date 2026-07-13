# Stage 0 SQLite 测试资源生命周期收口设计

## 状态

已完成。本阶段只修复 Python 测试自身的 SQLite 连接泄漏，不改变生产数据访问行为，不启动 Stage 9。

## 问题

全量 Python 测试虽然通过，但 Python 3.14 持续输出 `ResourceWarning: unclosed database`。tracemalloc 已把分配点精确定位到 `test_strategy_experiments.py` 和 `test_ai_review_stage3.py` 中的 23 处 `with sqlite3.connect(...)`。

SQLite `Connection` 的 context manager 只负责提交或回滚事务，退出时不会关闭连接。两份测试已经使用标准库 `contextlib.closing` 处理其他连接，但这 23 处仍误把事务 context 当成资源生命周期 context，连接只能等待垃圾回收。

生产 `quant_core` 的 102 个 `_connect()` 调用都已有显式 `finally: connection.close()`，因此本阶段不重写生产 store。

## 目标

1. 把两份测试中的裸 `with sqlite3.connect(...)` 全部改为既有 `closing(sqlite3.connect(...))`，并让同一连接继续进入事务上下文，保证先提交/回滚、后关闭；
2. 在现有 Python 契约测试中扫描 `test_*.py`，拒绝再次出现裸 SQLite context manager；
3. 用 tracemalloc + `ResourceWarning` 显式模式证明两份聚焦测试和全量测试不再泄漏；
4. 保持测试断言、数据库 schema、事务语义和产品代码不变。

## 固定边界

- 只复用 Python 标准库 `contextlib.closing`，不新增依赖或数据库封装。
- 不修改生产 `_connect()`、store、API、SQLite schema、事务或迁移逻辑。
- 不把所有 warning 升级为全局错误，不改变第三方库 warning 策略。
- 不新增 Stage 9、生产订单、成交、转账、提现或 live route。

## 验收

- Python 测试目录不存在裸 `with sqlite3.connect(...)`；
- 策略实验与 Stage 3 AI 评审聚焦测试在 `-X tracemalloc -W always::ResourceWarning` 下不输出 SQLite ResourceWarning；
- 全量 Python/Web、生产构建、Docker 基础 smoke 和 Stage 8 smoke/validate 通过；
- 所有 live/order 安全边界保持关闭。

## 明确不做

- 不为测试创建新的数据库 helper 或基类。
- 不重构生产 SQLite store。
- 不处理与 SQLite 连接无关的第三方 warning。
