# 终端 UI 逐页设计验收

验收日期：2026-07-15
最近专项验收：2026-07-16

## 验收基准

- Figma 文件：`qbF7LVyzZ0RL5uYjZzqf06`
- 桌面视口：`1440 × 1024`
- 移动视口：`375 × 812`
- 运行状态：本地 Docker `api + web`，页面读取当前 quant-core 与持久化运行；没有权威组合、订单或成交时显示明确空状态，不补造设计稿中的业务记录。
- 安全状态：`paperOnly=true`、`liveTradingAllowed=false`、`orderSubmissionEnabled=false`、`routeExecuted=false`、`liveBlockedBoundary=true`。

## 九页逐张证据

| 页面 | Figma 基准 | Docker 实现 | 并排对照 |
| --- | --- | --- | --- |
| 行情中心 | `docs/assets/ui-redesign/figma/01-market.png` | `docs/assets/ui-redesign/implementation/01-market.png` | `docs/assets/ui-redesign/comparisons/01-market.png` |
| 研究工作台 | `docs/assets/ui-redesign/figma/02-research.png` | `docs/assets/ui-redesign/implementation/02-research.png` | `docs/assets/ui-redesign/comparisons/02-research.png` |
| 策略工坊 | `docs/assets/ui-redesign/figma/03-strategy.png` | `docs/assets/ui-redesign/implementation/03-strategy.png` | `docs/assets/ui-redesign/comparisons/03-strategy.png` |
| 回测实验室 | `docs/assets/ui-redesign/figma/04-backtest.png` | `docs/assets/ui-redesign/implementation/04-backtest.png` | `docs/assets/ui-redesign/comparisons/04-backtest.png` |
| AI 评审 | `docs/assets/ui-redesign/figma/05-ai-review.png` | `docs/assets/ui-redesign/implementation/05-ai-review.png` | `docs/assets/ui-redesign/comparisons/05-ai-review.png` |
| 组合风控 | `docs/assets/ui-redesign/figma/06-portfolio.png` | `docs/assets/ui-redesign/implementation/06-portfolio.png` | `docs/assets/ui-redesign/comparisons/06-portfolio.png` |
| 执行中心 | `docs/assets/ui-redesign/figma/07-execution.png` | `docs/assets/ui-redesign/implementation/07-execution.png` | `docs/assets/ui-redesign/comparisons/07-execution.png` |
| 审计回放 | `docs/assets/ui-redesign/figma/08-audit.png` | `docs/assets/ui-redesign/implementation/08-audit.png` | `docs/assets/ui-redesign/comparisons/08-audit.png` |
| 设置 | `docs/assets/ui-redesign/figma/09-settings.png` | `docs/assets/ui-redesign/implementation/09-settings.png` | `docs/assets/ui-redesign/comparisons/09-settings.png` |

移动证据：`docs/assets/ui-redesign/implementation/mobile-market-375.png`。

行情中心空白与图表裁切专项证据：`docs/assets/ui-redesign/market-spacing-audit/`，依次保存用户同尺寸 2048×1027、375×812 和标准 1440×1024 Docker 页面。

## 检查结果

- 字体与层级：页面标题、面板标题、等宽行情/审计数据和状态文字形成稳定的 23px / 13.5px / 10px 层级；表格与状态不再使用难以辨认的 9px 主体字号。
- 间距与布局：208px 左栏、48px 顶栏、62px 状态栏和九套工作区网格通过；导航边框统一为中性状态，只有当前页面使用青绿色强调；AI 右栏跨两行，不再把 Decision 追加链推到首屏之外。
- 颜色与边界：深蓝黑底、青绿成功、琥珀复核、红色阻断与设计稿一致；实盘阻断状态始终可见。
- 图表质量：行情页复用真实 500 根 K 线、成交量和 MACD；研究页复用同一行情数据；回测页把净值/基准与回撤分层显示。没有用占位图或 CSS 图形替代数据可视化。
- 数据诚实性：watchlist、research runs、审计行、组合腿和执行订单都来自现有模型/API；当前 Docker 没有权威组合或 Stage 9 候选时使用空状态，不为凑齐设计稿行数伪造持仓、订单或成交。
- 空状态质量：回测、组合和执行页用“状态标题 + 原因/下一步”替代大块空白文案；继续复用右上角现有主动作，没有新增第二套工作流。
- 文案与动作：九个页面主动作继续调用现有 App 回调；高频主任务留在首屏，P0/Golden Path 证据收进“高级功能与证据”。
- 响应式：375px 下页面 `clientWidth=375`、`scrollWidth=375`，主内容单列；底部状态压缩为“数据状态 + 实盘阻断”两项，“高级功能与证据”入口避开主动作，底部导航仍可见，无页面级横向溢出。

## 迭代记录

1. 第一轮对照发现所有页面只换了统一外壳，主内容仍是通用卡片；据此拆成九个路由专属 surface。
2. 第二轮补齐行情搜索/八列自选/右栏/排行、研究第四侧栏、AI 证据侧栏、MACD、左栏个人状态和 375px 单列布局。
3. Docker 逐页对照发现首次行情截图过早、回测净值与回撤重叠、组合/执行空状态留白过大、AI 侧栏推高首行；分别延后到真实 K 线完成、拆分回测图层、补充真实空状态与计数、让 AI 侧栏跨两行。
4. 最终在相同桌面视口重拍九页并生成并排图，同时复核移动宽度和安全边界。
5. 细节复审再次逐页检查 Docker 截图，统一面板圆角、边框、行高和正文可读性；为回测/组合/执行补充可操作空状态，为设置页长文本表格增加受控换行，并把移动状态栏从四项压缩为两项。
6. 行情中心专项复审量化发现：四行自选表下方存在 327px 无效空白，八列表格超出面板 9px，375px 页面还会裁断第五列表头。桌面端现用现有自选数据填充概览并把表格收回面板宽度；移动端只投影代码、名称、最新价和涨跌幅四个核心字段。行情摘要改为展示真实更新时间、来源和数据状态，底部榜单也改成与当前自选数据一致的名称。复验结果为桌面表格溢出 0px、移动页面 `clientWidth=375` 且 `scrollWidth=375`。
7. 按用户 2048×1027 截图再次复查，确认上一轮仍有三个真实缺陷：标题与工具栏分行使首个面板下沉 114px，概览因 `align-content:center` 在上下各留下约 89px，图表正文按错误的固定标题高度计算并裁掉底部 19px 数据按钮。修复后工具栏与标题同排，首个面板下沉降为 58px；概览上下留白分别为 17px/16px；图表溢出为 0px，标的、收盘、日期、数据源和 K 线数量五个按钮完整显示。1440×1024 和 375×812 均复验无横向溢出，移动端“高级功能与证据”也不再覆盖市场选择器。
8. 研究工作台底部贴合第一轮只比较了主网格底边与状态栏上沿，虽然两者同为 900px，但遗漏了外层内容容器只显示到 884px，导致 16px 仍被裁掉；用户复验因此正确判定间距仍在。
9. 根因修复专项：源图为 `/Users/wenqingjie/Library/Containers/com.sw33tlie.macshot.macshot/Data/Library/Application Support/com.sw33tlie.macshot/clipboard/Screenshot 2026-07-16 at 17-51-10.png`，最终实现截图为 `/private/tmp/aiquant-research-gap-root-final.png`；视口 `1680 × 962`，浅色主题，研究工作台、`600000`、日 K 状态。外层主容器遗留的三行网格产生两个 8px 空行间隔；研究页桌面端清除该行间距后，主网格、可见内容容器与状态栏边界均为 900px，可见间距为 0px，页面无横向溢出。字体、颜色、图表资产、文案和交互均未改动，复验无 P0/P1/P2 遗留。

final result: passed
