# AIQuantificationTools

本项目的长期目标是做成本地优先的全功能量化交易平台，覆盖行情、研究、策略、回测、AI 评审、组合风控、模拟交易、未来实盘执行和全链路审计。当前阶段先把研究、回测、AI 评审和模拟执行做扎实，再逐步推进到受控实盘。

完整产品路线见 [docs/product-plan.md](docs/product-plan.md)。后续开发应先映射到该规划中的产品工作区和路线阶段，再进入实现。

## What Is Included

- Web/Desktop 共用前端：`apps/web` 使用 React、TypeScript、Vite，并包含 Tauri v2 桌面壳配置。
- Python 量化核心：`services/quant_core` 提供 OHLCV schema、SQLite 本地缓存、可视化策略配置、回测、AI 研究报告和 Paper Trading 执行器。
- 本地 API：`npm run api` 启动 `http://127.0.0.1:8765`，前端通过 `/api/workspace` 读取终端工作区契约，通过 `/api/research/run` 触发终端研究流水线，也可调用 `/api/demo` 跑通演示研究闭环。
- 免费数据源：A 股 `AkShareMarketDataAdapter`、美股 `YFinanceMarketDataAdapter` 和加密货币 `CcxtMarketDataAdapter` 已支持公开 OHLCV 归一化，默认仍用 demo fallback 保证开箱可跑。
- 运行审计：每次终端研究流水线会写入 `data/research_runs.sqlite`，用于追踪 run id、策略 revision、数据行数、指标和 AI 决策。
- 运行历史：前端通过 `/api/research/runs` 读取最近审计记录，并在终端右侧展示最近运行摘要。
- 审计回放：点击 Run History 中的记录可把该次运行的指标、AI 决策和审计摘要回放到当前终端。
- 研究上下文切换：点击 Watchlist 标的会切换当前研究对象，并清除旧审计结果，避免跨标的复用过期回测指标。
- 周期粒度切换：顶部 `1d / 1m / 5m / 15m / 30m / 60m` 控件会改变研究周期，Pipeline 按当前标的和周期运行。
- 多语言：`apps/web/src/lib/i18n.ts` 提供 `zh-CN / en-US` 语言包，默认中文，顶部语言控件可切换。
- 实时报价：参考 QuantDinger 的 REST quote + watchlist cache 方法，A 股走腾讯 quote，美股优先 Finnhub 并降级 yfinance，加密货币走 ccxt ticker，API 暴露 `/api/market/quotes`。
- 实盘图表：参考 QuantDinger 的 `/api/kline` + `klinecharts` 方法，前端图表从 `/api/market/klines` 拉取 OHLCV；A 股优先腾讯/东方财富并降级到正式 AKShare adapter，美股优先 Yahoo chart 并降级到正式 yfinance adapter，加密货币优先 Binance/Coinbase REST 并降级到正式 ccxt adapter。
- 行情适配器状态：`GET /api/settings/status` 会把 AKShare、yfinance 和 ccxt 的公开 OHLCV adapter、能力、周期覆盖、Key 需求、缓存 scope 和按市场聚合的缓存诊断暴露给 Settings 页面；该状态只读且不返回任何密钥值。
- ccxt sandbox 健康检查：`GET /api/execution/adapter-health/ccxt-sandbox` 会在只读模式下检查 ccxt sandbox/testnet 的 `set_sandbox_mode(true)`、markets、status/time 和可选账户同步；Settings 页面会显示检查结果。该能力不下单、不撤单、不写密钥、不启用实盘。

## Commands

```powershell
npm install
npm run test
npm run build
npm run api
npm run dev
```

前端默认使用同源 `/api`，Docker 通过 Nginx 反向代理到核心服务，本地 `npm run dev` 通过 Vite 代理到 `http://127.0.0.1:8765`。如需更换核心地址，可在 `.env` 中设置：

```powershell
VITE_QUANT_API_BASE=http://127.0.0.1:8765
```

## Docker Deployment

项目现在提供 Docker Compose 部署入口，默认启动两个容器：

- `api`：Python quant-core，本地核心监听容器内 `0.0.0.0:8765`，SQLite 数据写入命名卷 `quant-data`。
- `web`：Nginx 托管 Vite 构建产物，并把 `/api/*` 和 `/health` 反向代理到 `api` 服务。

启动：

```powershell
docker compose up --build
```

部署自检：

```powershell
npm run docker:smoke
```

如果镜像已经构建好，只想复用当前 Compose 服务：

```powershell
npm run docker:smoke -- --no-build
```

如果要验证 P0 产品闭环，而不只是验证容器和首页可访问：

```powershell
npm run docker:smoke:p0 -- --no-build --down
```

`docker:smoke:p0` 会在 Compose 服务中依次调用 P0 策略流水线、证据型 AI 评审、纸面模拟委托、研究包导出、复现包导入和导入后重导出，并把验收结果写入 `data/p0-acceptance.json`。它会校验导出包包含 `p0_paper_simulation` 审计事件、完整 `p0PackageCompleteness`，且全程保持 `paperOnly=true`、`liveTradingAllowed=false`、`liveOrderSubmitted=false`、`routeExecuted=false`。该命令会写入容器数据卷中的本地 SQLite 审计记录，不会触发真实下单。

已经归档的验收报告可以离线复核，不需要重新启动 Docker：

```powershell
npm run docker:smoke:p0:validate
```

如需做严格的干净数据库验收，可先启动第二个全新实例，再把导入目标传给底层 smoke helper：

```powershell
npm run docker:smoke -- --no-build --p0-acceptance --p0-import-check --p0-import-base-url http://127.0.0.1:5174
```

该 JSON 文件会记录 P0 run id、标的、周期、导入目标、每个验收步骤和 `paperOnly=true / liveTradingAllowed=false` 边界，用于复核本次部署是否跑通过 P0 闭环；它不是交易建议，也不代表实盘许可。

运行中的核心服务也可以读取这份本地验收产物：

```powershell
curl http://127.0.0.1:5173/api/p0/acceptance/latest
```

该端点默认读取 `data/p0-acceptance.json`，返回 `passed / missing / invalid` 三种状态。缺失或非法 manifest 不会被当成成功；如果 manifest 试图打开 `liveTradingAllowed` 或破坏 live-blocked 边界，平台会标记为 `invalid`，但仍不会放开实盘路由。

主工作台的 P0 readiness 区域会同步读取同一份本地验收产物，显示通过、缺失或无效状态，并提供“刷新验收”和跳转 Audit 复核的动作。这个卡片只用于产品验收证据回读：缺失或无效时会提示处理，验收通过时也仍保持 `liveTradingAllowed=false` 的模拟优先边界。

Audit 工作区也会显示同一份 P0 验收复核面板，列出 manifest 来源、run id、市场上下文、检查项和 live-blocked 边界。它用于复核本地部署是否跑通过 P0 闭环，不会执行真实交易，也不会把验收通过解释为实盘授权。该面板可以复制或下载 Markdown 复核材料，也可以将复核结果写入 Audit 账本为 `p0_acceptance_review` 事件，用于个人留档、小团队异步复核和后续证据搜索。

访问：

```powershell
http://127.0.0.1:5173/
http://127.0.0.1:5173/health
```

常用配置：

```powershell
$env:AIQT_WEB_PORT="5173"
$env:FINNHUB_API_KEY="your_finnhub_key"
$env:CCXT_DEFAULT_EXCHANGE="binance"
docker compose up --build
```

如果希望镜像内安装 AKShare、yfinance、ccxt 这类可选数据源依赖：

```powershell
$env:INSTALL_DATA_DEPS="true"
docker compose build api
docker compose up
```

ccxt sandbox/testnet 健康检查只读取环境变量是否存在，不会把密钥值返回给浏览器。通用变量和交易所前缀变量都支持：

```powershell
$env:INSTALL_DATA_DEPS="true"
$env:CCXT_DEFAULT_EXCHANGE="binance"
$env:CCXT_BINANCE_API_KEY="your_testnet_key"
$env:CCXT_BINANCE_SECRET="your_testnet_secret"
$env:CCXT_TIMEOUT="10000"
docker compose up --build
```

如果未安装 `ccxt` 或未配置测试网 key，Settings 会显示 blocked/review；这属于安全状态，不代表实盘可用。

停止服务但保留 SQLite 数据卷：

```powershell
docker compose down
```

停止并删除数据卷：

```powershell
docker compose down -v
```

## Continuous Integration

`.github/workflows/ci.yml` 会在 push 和 pull request 时运行同一套质量门禁：`npm ci`、`npm test`、`npm run build`、`docker compose config`、`docker compose build`，然后通过 `npm run docker:smoke -- --no-build --down` 验证容器化部署可以启动并通过 `/health`、`/`、`/api/workspace` 自检。

CI 还会运行 `npm run docker:smoke:p0 -- --no-build --down`，把 P0 策略流水线、AI 评审、纸面模拟、导出、导入和重导出作为产品验收门禁，并上传 `data/p0-acceptance.json` 为 `p0-acceptance-manifest` artifact。

归档产物会再通过 `npm run docker:smoke:p0:validate` 离线复核。校验会拒绝缺少核心 P0 检查、开启实盘边界或检查数量不一致的 manifest。

实时报价可选配置：

```powershell
FINNHUB_API_KEY=your_finnhub_key
CCXT_DEFAULT_EXCHANGE=binance
```

桌面端开发：

```powershell
npm run desktop:dev
```

桌面端打包：

```powershell
npm run desktop:build
```

## Product Boundary

产品目标是全功能量化交易平台，但实盘执行必须分阶段解锁。当前版本聚焦行情、研究、回测、AI 评审、组合风控雏形和模拟交易，不连接真实 A 股券商账户。交易工作区默认 `paper_only`，自动化交易能力通过 `ExecutionAdapter` 风格的接口预留；只有在合法券商接口明确、适配器认证通过、风控审批通过、用户人工确认后，才允许接入实盘适配器。

## Data Policy

- 日线：作为跨 A 股、美股、加密货币的默认研究粒度。
- 分钟线：采用“免费源近期窗口 + 本地缓存持续沉淀”的策略。
- API Key：无 Key 数据源用于快速体验，有 Key 数据源通过 `.env` 或本地配置增强稳定性和覆盖范围。

## Safety

AI 研究助手只解释已传入的策略和回测结果，不承诺收益，不直接替用户做投资决策。模拟执行会保留拒单原因、订单状态和账户快照，后续实盘接入必须经过风控检查。
