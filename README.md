# AIQuantificationTools

本项目是一个本地优先的 AI 量化研究工作台，首版目标是让同一套前端同时运行在 Web 和桌面端，并由本地 Python 核心负责数据、策略、回测、AI 研究报告和模拟执行。

## What Is Included

- Web/Desktop 共用前端：`apps/web` 使用 React、TypeScript、Vite，并包含 Tauri v2 桌面壳配置。
- Python 量化核心：`services/quant_core` 提供 OHLCV schema、SQLite 本地缓存、可视化策略配置、回测、AI 研究报告和 Paper Trading 执行器。
- 本地 API：`npm run api` 启动 `http://127.0.0.1:8765`，前端通过 `/api/workspace` 读取终端工作区契约，通过 `/api/research/run` 触发终端研究流水线，也可调用 `/api/demo` 跑通演示研究闭环。
- 免费数据源预留：A 股 AKShare、美股 yfinance/Alpha Vantage、加密货币 ccxt 以适配器方式预留；当前默认用 demo adapter 保证开箱可跑。
- 运行审计：每次终端研究流水线会写入 `data/research_runs.sqlite`，用于追踪 run id、策略 revision、数据行数、指标和 AI 决策。
- 运行历史：前端通过 `/api/research/runs` 读取最近审计记录，并在终端右侧展示最近运行摘要。

## Commands

```powershell
npm install
npm run test
npm run build
npm run api
npm run dev
```

前端默认连接 `http://127.0.0.1:8765`。如需更换本地核心地址，可在 `.env` 中设置：

```powershell
VITE_QUANT_API_BASE=http://127.0.0.1:8765
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

首版聚焦研究、回测、AI 解读和模拟交易，不连接真实 A 股券商账户。终端工作区默认 `paper_only`，自动化交易能力通过 `ExecutionAdapter` 风格的接口预留，等有合法券商接口且通过适配器认证、风控审批和人工确认后再接入实盘适配器。

## Data Policy

- 日线：作为跨 A 股、美股、加密货币的默认研究粒度。
- 分钟线：采用“免费源近期窗口 + 本地缓存持续沉淀”的策略。
- API Key：无 Key 数据源用于快速体验，有 Key 数据源通过 `.env` 或本地配置增强稳定性和覆盖范围。

## Safety

AI 研究助手只解释已传入的策略和回测结果，不承诺收益，不直接替用户做投资决策。模拟执行会保留拒单原因、订单状态和账户快照，后续实盘接入必须经过风控检查。
