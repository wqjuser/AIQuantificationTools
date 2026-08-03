# AIQuantificationTools

AIQuantificationTools 是一个面向个人研究者的量化研究工作台。它把行情与 AI 选股、研究证据、策略、回测和 AI 评审放进同一条可审计流程，并提供独立的组合风控、模拟执行和受控实盘能力。

项目默认运行在本机。AI 选股只用于确定研究优先级，不会自动研究、加入观察池或连接订单。任何生产交易仍需独立凭据、近期重新认证、人工授权、风险检查和急停控制。

## 主要能力

- A 股、美股自选池和 Binance USDT 现货行情与日 K。
- 服务端固定 `100 → 20 → 5` 的研究型 AI 选股。
- 可追溯研究笔记、策略版本、回测、AI 评审和研究包。
- 到期收益、固定基准、命中率和研究价值 cohort 复盘。
- 组合风控、Paper/Testnet 执行和受控 Binance Spot 生产链。
- 规范哈希、不可变审计、导入回读和跨上下文校验。

## 运行模式

| 模式 | 存储与身份 | 网络边界 |
| --- | --- | --- |
| `local`（默认） | SQLite、合成租户 `local`、无需登录 | Web 只监听 `127.0.0.1` |
| `public` | PostgreSQL 多租户、OIDC 登录 | 只由 Caddy 暴露 HTTPS 80/443 |

`public` 模式缺少 PostgreSQL、OIDC、HTTPS Origin 或 32 字节主密钥时会拒绝启动。公网部署必须先完成迁移、双用户隔离和实盘安全验收，不能直接把 local 服务端口暴露到公网。

## 本地快速启动

要求 Node.js 20.19+、npm 10+ 和 Python 3.12+。

```shell
python3.12 -m venv .venv
.venv/bin/python -m pip install -e services/quant_core
npm ci
npm run api
```

另开终端：

```shell
npm run dev
```

打开 Vite 输出的本机地址。需要 AKShare、yfinance 和 ccxt 完整数据源时：

```shell
.venv/bin/python -m pip install -e 'services/quant_core[data]'
```

复制 `.env.example` 为 `.env` 后可配置数据源、SEC EDGAR User-Agent 和可选 AI Provider。密钥不要提交到 Git。

## Docker 启动

本机模式：

```shell
INSTALL_DATA_DEPS=true docker compose build
docker compose up -d --no-build
```

默认页面为 `http://127.0.0.1:5173`；API 只在 Compose 网络内暴露。

公网模式需要先完成 [公网部署手册](docs/public-deployment.md)，再运行：

```shell
docker compose -f compose.yaml -f compose.public.yaml build
docker compose -f compose.yaml -f compose.public.yaml up -d --no-build
```

## 五步研究主线

1. **行情与选股**：选择市场、标的和周期，检查已完成 K 线；需要时运行条件筛选或 AI 选股。
2. **研究**：显式运行研究，保存笔记与来源证据。选股的“开始研究”只绑定候选，不会自动运行。
3. **策略**：把研究假设写成可审计策略版本；AI 候选必须人工采用。
4. **回测**：检查收益、回撤、成交、费用和证据上下文，避免未来数据和未完成 K 线。
5. **AI 评审**：本地确定性基线优先；外部模型只提供补充意见，失败不会覆盖本地结论。

组合风控、执行中心和动态交易属于高级执行，不是研究主线的默认下一步。审计回放与设置位于系统分组。

## AI 选股与真实价值

- 浏览器不能上传行情或收益事实；服务端从受保护审计与已完成 K 线回放。
- 固定基准为 A 股 `000300`、美股 `SPY`、加密资产 `BTC/USDT`。
- 未到持有周期显示“观察中”，缺基准或数据时明确降级。
- 样本按一次选股批次统计，重叠持有窗口不进入稳定性判定。
- 只有同一 cohort 达到严格样本、月份、覆盖率、Wilson 下界和中位 alpha 门槛，才显示“已证明稳定研究价值”。

完整方法见 [AI 选股样本与稳定价值](docs/market-ai-selection-research-value.md)。

## 实盘安全

- local 和 public 的生产交易默认都关闭。
- public 模式不读取服务器环境中的用户 AI、Sandbox 或生产交易密钥。
- 修改生产密钥、开启或续期实盘、恢复 Stage 10 前要求 5 分钟内 OIDC 重认证。
- 生产账户、权限、急停、风险限额和 PostgreSQL lease 任一不满足时，在下单网络调用前阻断。
- 研究包永远不能恢复密钥、授权、订单、成交或生产控制。

公网实盘操作见 [Stage 10 公网手册](docs/public-stage10-operations.md)。自动化测试不会提交真实生产订单。

## 测试

```shell
npm test
npm run build
npm run docker:smoke -- --no-build
git diff --check
```

## 详细文档

- [架构](docs/architecture.md)
- [产品计划](docs/product-plan.md)
- [权威术语](CONTEXT.md)
- [公网部署、迁移与恢复](docs/public-deployment.md)
- [Stage 10 公网实盘](docs/public-stage10-operations.md)
- [AI 选股样本与稳定价值](docs/market-ai-selection-research-value.md)
- [设计验收记录](design-qa.md)
