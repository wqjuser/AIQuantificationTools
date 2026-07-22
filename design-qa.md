# 终端 UI 逐页设计验收

验收日期：2026-07-15
最近专项验收：2026-07-21

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
10. 全工作区复验确认该缺陷属于共享主布局，而非研究页专属：研究页临时修复前，其余 9 个工作区的主容器均为 `row-gap: 8px`，两个遗留空行间隔使内容底边停在 884px，距 900px 状态栏上沿恰好 16px。桌面端现统一由共享 `.terminal-main` 清除行间距；在 `1680 × 962` Docker 页面逐一复验行情、研究、策略、回测、AI、组合、执行、运行管理、审计和设置，10 个工作区的内容底边与状态栏上沿均为 900px，可见间距全部为 0px，且均无页面级横向溢出。
11. 策略工坊日间配色专项：源图为 `/Users/wenqingjie/Library/Containers/com.sw33tlie.macshot.macshot/Data/Library/Application Support/com.sw33tlie.macshot/clipboard/Screenshot 2026-07-16 at 19-19-03.png`，实现截图为 `/private/tmp/aiquant-strategy-light-after.png`；视口 `2048 × 1027`，浅色主题，策略工坊状态。首轮全图对照发现搜索输入、策略卡片和规则标题仍使用深色背景，规则正文、验证指标和修订记录沿用深色主题低对比前景色，均记为 P2。修复后这些组件统一复用现有浅色 surface、border、text、muted、teal 变量，选中卡片使用浅青绿色背景；同尺寸复验无横向溢出，切换主题动作正常，字体与层级、间距与布局、颜色与状态语义、品牌图标资产、文案内容均无新增偏差。受影响控件在原始全图尺寸已清晰可读，因此不再制作独立裁剪；最终无 P0/P1/P2 遗留。
12. 回测实验室日间配色专项：源图为 `/Users/wenqingjie/Library/Containers/com.sw33tlie.macshot.macshot/Data/Library/Application Support/com.sw33tlie.macshot/clipboard/Screenshot 2026-07-16 at 20-00-39.png`，实现截图为 `/private/tmp/aiquant-backtest-light-after.png`；视口 `2048 × 1027`，浅色主题，当前 Docker 策略草稿与等待回测状态。首轮全图对照发现净值/回撤空状态仍使用深色网格与灰色径向底纹，六项指标条维持深蓝背景，画布网格及净值、基准、回撤线还写死深色主题色，最近运行记录也沿用深色边界和低对比文字，均记为 P2。修复后空状态、指标条和运行记录统一复用现有 `surface`、`surface-raised`、`border`、`text`、`muted` 变量；画布增加 `chart-grid`、`chart-teal`、`chart-blue`、`chart-red` 四个专用主题变量，深色值保持原样，深浅色 shell 都同步声明明确色值，并把 `colorScheme` 作为显式绘制依赖以保证切换时重绘。同尺寸全图复验空状态无横向溢出，深色与浅色往返切换后颜色恢复准确，控制台无错误；原始全图已能清晰覆盖所有受影响区域，因此不再制作独立裁剪，最终无 P0/P1/P2 遗留。
13. 执行与治理工作区日间配色专项：源图依次为 `/private/tmp/aiquant-execution-light-before.png`、`/private/tmp/aiquant-operations-light-before.png`、`/private/tmp/aiquant-audit-light-before.png`、`/private/tmp/aiquant-settings-light-before.png`，实现截图依次为同目录下对应的 `*-light-after.png`；视口统一为 `2048 × 1027`，浅色主题。执行中心统计卡和安全提示、审计回放筛选器、设置页导航/表单/告警均因新版组件缺少浅色覆盖而形成深色孤岛；运行管理则仍复用旧版 `terminal-panel`、队列、健康卡、扫描器、日历和工作流组件，连“工作区上下文”展开层也保留整套深色前景与背景，均记为 P2。修复优先复用现有 `surface`、`surface-raised`、`border`、`text`、`muted`、`teal`、`amber` 语义变量，并保留成功、复核、阻断的状态边；运行管理展开态另以 `/private/tmp/aiquant-operations-context-light-after.png` 验收。最终四页可见区域与展开层的深色背景扫描均为 0，页面和工作区横向溢出均为 0；深色切换后面板恢复 `rgb(16, 24, 35)`，切回浅色后恢复 `rgb(255, 255, 255)`，控制台无错误，最终无 P0/P1/P2 遗留。
14. 执行与治理配色独立复审：逐项补齐运行管理隐藏状态中的分享链接、模拟成交结果、完成/恢复提示以及成功、复核、阻断状态级联，执行中心未通过闸门图标保持琥珀色，设置页小型外部服务告警也改用同一浅色告警语义。`2048 × 1027` Docker 终态再次扫描执行中心、运行管理、审计回放、设置及运行管理展开层，深色背景与横向溢出均为 0；`375 × 812` 展开层通过 footer 换行与响应式 basis 复位后，页面和浮层横向溢出均为 0，提示行高度为 13.5px，不再产生空白。深浅主题往返结果仍为 `rgb(255, 255, 255) → rgb(16, 24, 35) → rgb(255, 255, 255)`，浏览器日志为空；独立代码复审为 Critical 0、Important 0、Minor 0。
15. 运行管理布局与全局滚动隔离专项：源图为 `/Users/wenqingjie/Library/Containers/com.sw33tlie.macshot.macshot/Data/Library/Application Support/com.sw33tlie.macshot/clipboard/Screenshot 2026-07-16 at 23-47-27.png`，实现截图为 `/private/tmp/aiquant-operations-layout-scroll-final.png`，同状态并排图为 `/private/tmp/aiquant-operations-layout-scroll-comparison.png`；桌面 CSS 视口 `2048 × 1178`，浅色主题，运行管理状态。旧布局的左右内容共享 Grid 行高，右侧长数据健康面板会把左侧市场扫描器向下推开；顶部还残留孤立的“保存自选”卡和窄操作列。现改为左右两条独立纵向内容栈，队列与扫描器、数据健康与市场日历的相邻间距均为 10px，首行对齐，无页面或工作区横向溢出，右侧就绪指标按三列排布。移动证据为 `/private/tmp/aiquant-operations-layout-scroll-mobile.png`，`375 × 812` 下操作区、队列卡片和底部安全状态完整可见，`scrollWidth=clientWidth=375`；断点内保持“研究队列、数据健康、市场扫描、交易日历、工作流”的任务顺序。滚动状态按工作区 ID 分别保存：桌面端行情 `220px`、研究 `140px`、运行管理 `310px` 在往返切换后分别恢复；移动端行情 `420px`、研究 `260px` 同样独立恢复。独立复审进一步消除了旧监听器在切换瞬间误写位置的竞态，并补齐同等 specificity 的窄屏网格顺序规则；终态复审为 Critical 0、Important 0、Minor 0。字体、状态色、Logo、业务数据与动作均继续复用现有组件和 API，桌面与移动浏览器错误日志均为空，最终无 P0/P1/P2 遗留。
16. 研究确认弹窗日间配色专项：源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-b9645595-8d12-425a-91e3-98adf447d5cd.png`，实现截图为 `/private/tmp/aiquant-research-confirmation-light-final.png`，并排对照为 `/private/tmp/aiquant-research-confirmation-light-comparison.png`；浅色主题、研究工作台、3 项上下文复核状态。根因是弹窗主体、问题卡片和控制按钮只声明了深色硬编码，未跟随根节点主题。现直接复用已有 `surface`、`surface-raised`、`border`、`text`、`muted`、`amber` 变量补齐根级浅色覆盖：弹窗主体计算背景为 `rgb(255, 255, 255)`，问题卡片与按钮为 `rgb(242, 246, 249)`，遮罩从 78% 近黑改为 38% 深灰；深色主题往返复验仍保持原有 `rgb(15, 26, 38)` 主体和 `rgb(18, 29, 42)` 卡片。默认 `1280 × 720` 预览无浏览器错误，`375 × 700` 下弹窗宽 343px、左右各 16px 且页面无横向溢出；字体层级、间距、图标资产、文案和研究动作均未改动，最终无 P0/P1/P2 遗留。
17. 行情中心密集自选与周期切换专项：源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-f77eb8a0-82a3-4790-8a65-7e4b9aa2fcbe.png`，实现截图为 `/private/tmp/aiquant-market-watchlist-scroll-final.png`；`1680 × 906` 浅色主题、7 条自选、周 K 状态。根因一是固定高度面板隐藏溢出，底部排行与关注列表还在渲染前硬截断为 5 条；现保留完整自选数组，并让顶部自选正文及三个底部表格正文独立纵向滚动。Docker 实测顶部自选区为 7 行、`overflow-y: auto`、最大滚动 9px，三个底部表均为 7 行、最大滚动 83px，鼠标滚动后分别到达 8.5px 与 83px。根因二是标的搜索副作用依赖当前周期，导致非空输入框在切换 K 线时重新发起搜索；现复用已有搜索抑制标记，仅在周期真实变化时跳过一次搜索，并立即清空建议层。非空输入框从日 K 切到周 K 后等待 2.9 秒，建议层始终为 0；随后真实输入新代码仍返回 1 个搜索结果。浏览器控制台无错误，既有行情、图表和安全边界均未改动，最终无 P0/P1/P2 遗留。
18. 行情搜索结果浅色样式专项：源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-e77d2909-646f-48b7-9006-0dea539a00a0.png`，实现截图为 `/private/tmp/aiquant-search-suggestions-light-final.png`，同框对照为 `/private/tmp/aiquant-search-suggestions-light-comparison.png`；`1680 × 906` 浅色主题、查询 `60060`、7 条结果状态。首轮测量确认股票代码继承深色主题白色前景，结果行纵向间距为 `0px`，无刷新按钮的结果仍保留空网格列和 `6px` 右侧空隙，均记为 P2。现继续复用既有结果结构和主题变量，仅把浮层改为纵向 Grid：四周内边距为 `8px`、相邻结果间距为 `6px`；浅色代码计算色恢复为 `rgb(33, 51, 70)`；唯一结果按钮横跨整行后右侧空隙为 `0px`。终态页面和浮层横向溢出均为 `0px`，应用页面无错误日志；字体、图标、文案、缓存动作与搜索行为均未改动，最终无 P0/P1/P2 遗留。
19. 顶部全局标的搜索导航专项：共享 `selectInstrument` 原先在任何标的切换后都写死跳转到研究工作台，导致搜索提交、结果点击和结果缓存刷新在所有页面改变当前工作区。现为该共享入口保留“默认进入研究”的既有语义，只让顶部全局搜索的三条路径显式传入当前工作区。Docker 浏览器分别在策略工坊和设置页点击 `600000` 结果后，页面 `data-workspace` 与 URL 中的 `workspace` 均保持原值，标的正常切换，应用错误日志为空；研究运营队列等原有单参数调用仍按既有行为进入研究工作台。

20. 行情搜索历史数据浮层布局专项：源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-e222ccc1-cdfc-45e7-a7ee-75a0944acd53.png`，实现截图为 `/tmp/aiqt-search-popover-after.png`，同框对照为 `/tmp/aiqt-search-popover-comparison.png`；桌面视口 `1680 × 962`，浅色主题，查询 `600001`。首轮测量确认 320px 浮层内存在结果按钮与刷新按钮多层边框、证券信息横向争抢和过长日期范围，均记为 P1；现把浮层右对齐搜索框并扩至 400px，结果卡按“代码与名称、市场与来源、历史数据截至日期”形成三级层次，更新动作改为“检查更新”并固定在右侧。`375 × 844` 复验发现后置响应式规则曾把浮层压缩到 112px，修复后浮层宽 351px、页面无横向溢出，操作按钮完整落在结果卡底部。搜索输入可返回邯郸钢铁结果，既有选择与更新处理器保持不变；不完整的 `listbox/option` 语义已移除，更新按钮可访问名称包含证券代码。Web 975 项测试、生产构建与 Docker 健康检查通过，浏览器错误日志为空，最终无 P0/P1/P2 遗留。

21. 行情搜索多结果密度专项：源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-e6357c95-0d7d-4cb5-bf71-e8fc530c86e6.png`，实现截图为 `/tmp/aiqt-search-list-compact-final.png`，移动实现为 `/tmp/aiqt-search-list-compact-mobile-final.png`，同框对照为 `/tmp/aiqt-search-list-compact-comparison.png`；查询 `60000`，浅色主题。上一轮单结果布局扩展到多结果后形成“浮层外框、结果卡外框、操作按钮外框”三层嵌套，每行约 130px，更新按钮视觉权重过高，最新缓存还展示了冗长的起止日期。现保留唯一浮层外框，结果改为 53px 扁平行与中性分隔线；证券代码和名称位于首行，来源与缓存状态合并到次行，最新缓存只显示更新时间和行数，历史缓存继续明确截至日期。桌面操作按钮高 30px，标签收敛为“更新 / 获取”，列表 `280px` 高度内独立滚动；`375 × 844` 下浮层宽 351px，隐藏冗余来源信息并保留完整缓存状态，按钮宽 72px。桌面和移动页面均无横向溢出，结果选择、缓存动作和包含证券代码的可访问名称保持不变。

22. 行情自选概览层级专项：源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-c2f736d0-dfae-454c-8d68-ff4f37246ed8.png`，实现截图为 `/tmp/aiqt-watchlist-overview-final-1680.png`，同框对照为 `/tmp/aiqt-watchlist-overview-comparison.png`；桌面视口 `1680 × 962`，浅色主题，7 条自选状态。根因是概览把“市场分布”放入可压缩到 0 的网格轨道，同时在末尾重复展示已由选中行、图表标题和刷新状态表达的“当前标的 / 最近更新”，空间不足时两组内容会交错。现删除重复摘要，概览只保留“标的总数、涨跌统计、市场分布”三层信息，并把市场分布轨道改为最小内容高度、组间距收敛为 8px。Docker 实测三条市场行重叠均为 0px，概览自身溢出为 0px，页面横向溢出为 0px；既有自选选择、编辑、报价和刷新行为均未改动。

23. 全工作区底部回弹与空白专项：源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-7dfbf6d2-a3f0-4c8d-97a0-cf92e79a27ff.png`，实现截图为 `/tmp/aiqt-shared-scroll-final-1680.png`，同框对照为 `/tmp/aiqt-shared-scroll-comparison.png`。共享工作区仍保留旧版状态栏避让用的 `76px` 底部内边距，主容器也继续使用三个自动网格轨道；状态栏已独立占据底部 62px 后，这两处遗留会让短页面露出空轨道，并让原本到达底部的页面继续滚动 76px。现把桌面主容器收敛为唯一可伸缩工作区轨道，工作区底部内边距改为 0，并用 `overscroll-behavior-y: none` 禁止边界回弹。`1680 × 962` Docker 逐页复验行情、研究、策略、回测、AI、组合、执行、运行管理、审计和设置：工作区底边到状态栏间距全部为 0px，人工增加的滚动距离从 76px 降为 0px；运行管理保留 804px、审计保留 8px 的真实内容滚动，其余短页面最大滚动均为 0px。`375 × 812` 下继续保留底部固定导航所需的移动端 70px 避让，页面横向溢出为 0px。

24. 行情中心桌面底部间距专项：源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-12e71fae-d3ea-4750-9804-2e3340ae78b0.png`，实现截图为 `/tmp/aiqt-market-bottom-final-10px.png`，同框对照为 `/tmp/aiqt-market-bottom-final-10px-comparison.png`；浅色主题、行情中心、日 K 状态。共享容器空白清除后，行情页自身仍把两行内容固定为 `535px + 215px`，因此较高桌面窗口会在排行卡片与状态栏之间留下过多剩余空间。现只在桌面行情页让外层内容轨道占满可用高度，把第二行改为最小 `215px`、其余空间自适应，并复用页面现有的 10px 卡片节奏保留底部呼吸空间；`1680 × 962` 下第二行为 227px，内容底边到状态栏上沿为 10px，页面无横向溢出。`375 × 812` 保持原有单列布局和 70px 移动导航避让，`scrollWidth=clientWidth=375`；字体、颜色、图表、文案和交互均未改动，浏览器错误日志为空，最终无 P0/P1/P2 遗留。

25. 行情中心重试卡片对齐与交互专项：源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-1b3607c2-9581-4695-946c-6a2af29e4799.png`，实现截图为 `/tmp/aiqt-market-retry-final.png`，同框对照为 `/tmp/aiqt-market-retry-comparison.png`；桌面视口 `1680 × 962`，浅色主题、行情中心、`600000`、日 K 状态。原右栏五张卡片按内容高度依次排列，“重试与恢复”只有 143px 高，顶部为 734px，既没有与 663px 开始、227px 高的排行行对齐，“立即重试”也只是无处理器的静态按钮。现把上方四张状态卡收进与首行同高的 535px 网格，把恢复卡放入与排行行共享的第二轨道；终态排行行与恢复卡的顶部、底部、高度分别同为 `663px / 890px / 227px`。刷新失败说明同步移入空间更充足且语义对应的恢复卡，避免被上方等分状态卡裁掉；`1101–1300px` 中等桌面断点也使用相同的两行对齐与紧凑状态卡规则。按钮直接复用现有行情刷新动作，右侧内缩 12px，与上方状态行保持 10px 间距；点击后立即进入禁用的“重试中…”状态，完成后恢复为“立即重试”，最新刷新时间同步到 15:52。`375 × 812` 下恢复卡保持自然单列，`scrollWidth=clientWidth=375`；浏览器日志为空，字体、颜色、图表、业务数据和安全边界均未改动，最终无 P0/P1/P2 遗留。

26. 行情中心四张状态卡内部节奏专项：源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-38f7b747-cc33-4f2b-9c65-11dd72c926ce.png`，实现全图为 `/tmp/aiqt-market-side-spacing-viewport.png`，聚焦同框对照为 `/tmp/aiqt-market-side-spacing-comparison.png`；桌面视口 `1680 × 962`，浅色主题、行情中心、`600000`、日 K 状态。四张卡片虽然外部等高，但正文高度仍由内容决定，内容较少的“缓存覆盖率”会把约 30px 可见余量全部留在底部，形成明显贴顶感，记为 P2。现只让桌面端四张既有面板复用同一纵向 Flex 节奏：正文填满剩余高度、内容垂直居中、相邻信息保持 2px 间隔；“缓存覆盖率”上下余量由约 `7px / 30px` 收敛为约 `16px / 17px`，其余三张卡也保持上下对称。`1200 × 800` 下四张卡均为 `scrollHeight=clientHeight=126px`，无裁切或页面横向溢出；`375 × 812` 保持原有自然高度，`scrollWidth=clientWidth=375`。字体、颜色、圆角、阴影、图标资产、文案与业务动作均未改动，浏览器日志为空，最终无 P0/P1/P2 遗留。

27. 研究工作台底部呼吸空间专项：调整前截图为 `/tmp/aiqt-research-bottom-before.png`，实现截图为 `/tmp/aiqt-research-bottom-after.png`；桌面视口 `1680 × 962`，浅色主题、研究工作台状态。共享滚动容器为消除全局虚假空白而保留 `padding-bottom: 0`，研究页滚到底后最后一张“研究准备”卡片因此与状态栏直接相接。现仅为非移动研究工作台复用行情页已经验收的 `10px` 页面收尾节奏；滚动终点的内容底边与容器底边间距由 `0px` 调整为 `10px`，没有引入页面或工作区横向溢出。`1200 × 800` 下同样保持 `10px`；`375 × 812` 继续使用原有 `70px` 固定导航避让，`scrollWidth=clientWidth=375`。布局回归测试、生产构建与 Docker 页面验收通过，浏览器日志为空，最终无 P0/P1/P2 遗留。

28. 行情中心少量自选稳定布局专项：源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-bafc576c-a80f-4e42-9778-78b1d4430dad.png`，实现截图为 `/tmp/aiqt-market-sparse-final-dark.png`，聚焦同框对照为 `/tmp/aiqt-market-sparse-comparison.png`；桌面视口 `1680 × 962`，深色主题、仅保留 `BTC/USDT` 一项自选。根因是自选表格和概览共享纵向 Flex 剩余空间，概览使用 `flex: 1`，市场分布又把剩余空间平均分给现有市场行，导致单项自选时概览由正常摘要膨胀到 `422.5px`，唯一市场行被拉高到 `146.25px`。现将表格放入独立滚动视口，概览固定为 `240px`，市场行固定为 `24px` 并从顶部顺序排列；终态表格视口为 `248px`，概览及内部摘要不再随自选数量变化，8 项及以上也继续保留概览并只滚动列表。最后一项不是某个预设标的被锁定，而是当前数据模型要求自选列表至少保留一项；编辑态现以禁用的“需保留”按钮、中文悬浮说明和可访问名称明确解释该约束，没有扩散修改既有空列表持久化语义。终态页面无横向溢出，浅色、深色及 `375 × 812` 移动布局均保持原有主题与响应式行为，最终无 P0/P1/P2 遗留。

29. 顶部标的搜索跨市场与连续查询专项：Docker 复现确认两个独立根因。其一，界面隐藏了市场选择器，但查询仍固定使用当前标的市场；仅保留 `BTC/USDT` 时输入 `600000` 实际请求 `market=crypto`，因此稳定返回“没有匹配标的”。其二，旧的一次性搜索抑制标记会在选中精确结果后残留，导致下一次真实输入被直接跳过。现复用已有市场模型，只对明确的证券代码进行最小市场识别：数字 A 股代码前缀、短美股代码和带交易对分隔符或 `USDT` 后缀的币对分别路由到既有单市场 API；中文名称等不明确输入继续沿用当前市场。查询与表单提交共用同一识别结果，同时删除会泄漏的抑制标记，改由既有搜索浮层开关决定是否发起查询。Docker 浏览器从当前 `crypto · BTC/USDT` 上下文依次搜索 `600000`、`AAPL`、`BTC/USDT`，分别返回浦发银行、Apple Inc. 和 Bitcoin；选择 `600001` 后下一次搜索仍立即返回结果，周期切换后浮层关闭且后续首次输入正常。API 连续 curl 首次均返回权威结果，Web 全量测试、生产构建和容器健康检查通过，页面错误日志为空。

30. 行情中心单市场概览收口专项：源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-7098d807-c8f0-4398-b536-083b1d3b6fda.png`，实现全图为 `/tmp/aiqt-market-single-after-full.png`，聚焦同框对照为 `/tmp/aiqt-market-single-gap-comparison.png`；桌面视口 `1680 × 962`，深色主题、仅保留 `BTC/USDT`、单一加密货币市场。上一轮为阻止概览随自选数量伸缩而固定了 `240px` 高度，但单市场内容只需要一行，最后一行下方因此仍留下约 `78px` 无效空白，记为 P2。现继续保留列表独立滚动，只把概览从固定高度改为按“标题、涨跌统计、实际市场行”自然收口；终态概览高度为 `178px`，唯一市场行高为 `24px`，内容底部间距为 `16px`，列表可视区同步从 `248px` 增至 `310px`。页面 `clientWidth=scrollWidth=1680`、`clientHeight=scrollHeight=962`；`375 × 812` 下概览按既有规则隐藏且 `clientWidth=scrollWidth=375`。字体、颜色、边框、图标、业务数据和自选行为均未改动，浏览器错误日志为空，最终无 P0/P1/P2 遗留。

31. 行情搜索浮层深色配色专项：源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-22d008c2-3b77-402c-84d7-eae6d95d3189.png`，实现全图为 `/tmp/aiqt-search-dark-after-full.png`，聚焦同框对照为 `/tmp/aiqt-search-dark-comparison.png`；桌面视口 `1680 × 962`，深色主题、查询 `600`、多结果状态。根因不是搜索结果自身配色，而是顶部标的表单的后置通用按钮规则使用了后代选择器，把浮层内所有结果按钮也覆盖为青绿色背景，记为 P2。现把两处表单按钮规则收窄到直属提交按钮；结果行恢复透明背景并透出 `rgb(15, 23, 34)` 的中性深蓝浮层，只有“更新 / 获取”操作按钮和悬停状态继续使用青绿色语义。`375 × 844` 下浮层左右各 `12px`、宽 `351px`，结果背景同样透明，`clientWidth=scrollWidth=375`。字体、间距、状态文案、缓存动作和搜索行为均未改动，Docker 页面错误日志为空，最终无 P0/P1/P2 遗留。

32. 行情搜索中文名称跨市场专项：仅保留 `BTC/USDT` 时，顶部搜索的当前市场为加密货币；旧解析器只识别股票代码、短美股代码和币对格式，中文股票名称会沿用当前市场，导致 `贵州茅台` 被错误发送到加密货币搜索。A 股搜索接口已验证可直接返回 `600519 · 贵州茅台`，因此不新增聚合搜索或第二套接口，只在共享市场解析器中把包含汉字的名称路由到既有 A 股搜索。Docker 浏览器从唯一加密货币自选状态输入 `贵州茅台`，首轮即显示 `600519 · 贵州茅台`，点击后仍停留在行情中心并加载对应日 K；回归测试覆盖从加密货币和美股上下文搜索中文名称，既有数字代码、美股代码和币对识别保持不变。

33. 行情中心市场日历真实性专项：右侧卡片原先仅根据数据源是否可用写死“交易中 / 09:30 / 15:00”，没有使用 App 已加载的当前标的市场日历，因此周末和加密货币场景都会显示错误。现直接把既有 `marketCalendarState.calendar` 交给行情卡片：A 股周末使用权威 `closed/weekend` 状态显示“休市、下次开盘 07/20 09:30”，加密货币使用 `always_open/continuous` 显示“全天交易、24/7、UTC”。Docker 浏览器分别以 `600000` 和 `BTC/USDT` 验收，两种状态均与 `/api/market/calendar` 返回一致；没有在前端新增第二套交易日判断。

34. 行情自选行导航专项：新版自选表本身只触发传入的标的选择回调，但 App 原样传入了默认目标为研究工作台的共享 `selectInstrument`，因此任何自选行点击都会把 `workspace=market` 改为 `workspace=research`。现仅在新版行情 surface 接线处显式传入 `"market"`；顶部搜索继续保持当前工作区，研究运营队列等单参数调用仍保留进入研究工作台的既有语义。Docker 浏览器复现修复前点击 `BTC/USDT` 后进入研究页，修复后点击 `600519` 仍停留行情中心并切换图表；回归测试锁定新版 surface 的精确接线点。

35. 行情标的中文名称回填专项：既有自选中的 `600519` 最初由代码直输创建，名称也被保存为代码；顶部搜索虽已返回“贵州茅台”，共享选择函数遇到同一市场和代码时却原样复用旧自选项，导致自选表、排行和关注标的继续显示 `600519`，而搜索占位对象还会暂时清空 1253 元报价。现仍复用同一 `Instrument` 与自选数组，只在共享合并点用非占位中文名称升级匹配项，并保留既有价格、涨跌幅、来源和更新时间；选中项与自选项同步引用合并结果且不产生重复项。Docker 浏览器从持久化旧名称复现，点击 `600519 · 贵州茅台` 后，自选表、行情标题、顶部快照、涨跌排行与关注标的均显示“贵州茅台”，价格保持 `1253.00 / -0.48% / tencent`；保存并重新加载后名称与报价仍正确。

36. 研究运行预检反馈专项：周末 A 股休市本身只会产生“复核”项，不会阻止研究运行；实际无响应场景中的 `600519 · 1d` 已有 500 根完整腾讯 K 线，但设置状态里没有对应本地缓存上下文，因此预检把“本地缓存”判定为阻断。旧分支仅把错误写入新版页面未展示的状态后返回，用户看不到任何反馈。现直接复用既有研究复核弹窗：阻断时显示“有 1 项阻止运行”，说明“休市等复核项不会阻止运行”，把阻断卡标红并提供“前往数据刷新”等直达入口，同时隐藏“仍然运行”以防绕过；仅含复核项时仍保留确认后运行。Docker 浏览器分别验收 `600519` 阻断场景与有新鲜缓存的 `600000` 周末场景：前者弹窗存在、本地缓存与刷新入口可见且没有绕过按钮；后者显示交易日历“休市 · 周末”并保留“仍然运行”。

37. 研究预检缓存直修专项：旧“前往数据刷新”只把用户送到运行管理的数据健康长面板中部，没有执行动作，也没有把具体下一步带过去；现复用已有 `refreshSelectedMarketCache` / `refreshWatchlistMarketCache` 回调，预检卡直接显示“刷新缓存 / 刷新自选缓存”，点击后留在研究工作台完成刷新并原位重新预检。进一步复现发现设置状态只返回最近 8 条缓存摘要，当前标的即使已刷新也可能被省略；现以无数量截断的当前标的 `market-data-readiness` 作为同市场、代码、周期严格匹配后的回退上下文，不新增接口或第二套新鲜度算法。Docker 浏览器以此前无缓存的 `600036 · 1d` 验收：点击“刷新缓存”后生成 `cache-refresh-284d3f535f0f`，数据就绪变为 `fresh / 500`，页面保持研究工作台，阻断弹窗原位变为仅含 4 个复核项并出现“仍然运行”；此时设置摘要仍为 `8 / 31` 且不含 `600036`，证明回退路径实际生效。

38. 研究笔记 AI 草稿专项：研究准备区复用现有 Provider 状态和研究笔记编辑框，新增本地基线/外部 Provider 选择、model 与脱敏 Base URL 展示、外发范围说明、单次授权和生成状态。外部模式未授权时按钮保持禁用；授权在请求发出时立即复位，下一次生成必须重新确认。授权后只发送市场、标的、周期、缓存日期/行数和派生统计，不发送原始 K 线或已有笔记。Docker 浏览器分别验证本地草稿与已配置 `openai-compatible`：成功结果进入同一个 textarea 并显示“需人工复核”，生成后刷新页面草稿为空，证明没有调用保存接口；外部超时或不合规时，空草稿采用后端确定性本地基线，已有用户内容则原样保留，并提示重新授权重试或显式切换本地基线。生成期间只要用户编辑过草稿，即使后来撤销为请求前文本，慢响应也不会覆盖当前内容。浅色、深色主题均使用现有表面、边框、文字和按钮变量；生成、保存笔记和保存工作区仍是三个独立动作，实盘与委托安全边界未改变。

39. 研究准备编辑区间距专项：源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-eebf9fab-c47c-4af9-bf8f-5953203dc068.png`，Docker 深色实现截图为 `/tmp/aiqt-research-preparation-spacing-final.png`，同框对照为 `/tmp/aiqt-research-preparation-spacing-comparison.png`；源图为 `2891 × 805` 的宽屏聚焦视图，实现使用内置浏览器 `1280 × 720` 视口，二者按研究准备区域等宽显示后比较，未对不同视口做伪精确像素映射。首轮确认左侧笔记字段被右侧 AI 操作列拉高后，CSS Grid 把两个隐式自动行同时拉伸，研究笔记标签行实际高达 `117.07px`，虽然声明间距只有 `6px`，可见文本框仍被向下推开，记为 P2。现只给既有笔记字段声明“内容高度标题行 + 填满剩余空间的编辑行”，并固定从顶部排布；Docker 实测标题行降为 `14px`、标题元素与 textarea 的真实间距为 `6px`，textarea 连续使用剩余 `294.14px`，右侧笔记状态、AI 辅助和保存动作保持顶对齐。深浅主题、字体层级、颜色变量、文案、图标和交互均未改动；聚焦对照已足以清晰判断本次唯一受影响的网格行，因此不另做细节裁剪。Web 专项 180 项与全量 992 项测试、生产构建和 Docker `api + web` 健康检查通过，最终无 P0/P1/P2 遗留。

40. AI 研究笔记真实流专项：旧实现会先等待外部 Provider 完整返回并通过总体验证，再把成品按固定字符数快速播放，视觉上虽有逐字变化，但首段正文延迟与非流式调用完全相同。现复用三种既有外部 Provider 适配器，在单次请求中开启 SSE 或 NDJSON 上游流；原始 token 只在核心内部累计，完整 JSON 字段闭合后才复用现有 assessment 校验器验证中文、长度、证据引用和禁止交易语义，并按研究假设、已知观察、失效条件、主要风险、证据缺口五个累计章节推送。进一步实测确认当前兼容网关会缓冲严格 `json_schema` 流；研究笔记的 OpenAI-compatible 流因此改用携带完整 schema 的 `json_object`，一次性 AI 评审仍保持严格 `json_schema`，最终 `_validated_assessment` 和全量安全复核不变。Docker API 验收记录为 `56ms started → 6.517s 研究假设 → 8.018s 已知观察 → 9.599s 失效条件 → 12.050s 主要风险 → 13.590s 证据缺口 → 13.593s complete`；内置浏览器又观测到同一 textarea 的正文长度在 `7.712s / 10.000s / 11.739s / 14.732s` 连续增长，最终 `16.224s` 完成，证明现在是随上游到达的真实章节流，而不是等待成品后的快速播放。每次编辑框更新会跨过实际浏览器绘制机会；生成前保留原文快照，后续字段违规会发送 `reset` 并恢复原文，空笔记才采用确定性本地基线。API 连接轮询、socket 关闭和真实客户端 abort 测试保证用户取消后不会把静默上游请求留到 30 秒总超时。前端不再维护第二个预览区，生成中禁用保存；上下文错配、手动编辑、断流、乱序和缺少完成事件均不能留下可保存的半成品。原始 K 线、已有笔记、密钥和未脱敏错误不会进入流，实盘与委托边界不变。

41. 研究准备空白与流式跟随专项：源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-9d1f6dbc-237e-4e91-900c-10e51826b512.png`，Docker 实现截图为 `/tmp/aiqt-research-preparation-stream-bottom.png`，聚焦同框对照为 `/tmp/aiqt-research-preparation-qa-comparison.png`；源图为 `2887 × 803` 的深色宽屏聚焦状态，实现以 `2887 × 900` CSS 视口复核，截图输出为 `2185 × 900`。首轮对照确认右侧 AI 操作列决定整行高度，但左侧笔记列仍使用 `align-content: start`，textarea 只占顶部内容高度并在下方留下整块无效空白，记为 P2。现只让既有左列恢复 Grid 的拉伸语义，未新增容器或第二套编辑器；DOM 实测左列、字段和右侧操作列均为 `314.14px` 高，textarea 底边与列底边同为 `817.14px`，空白由编辑区自然接管。流式行为继续复用同一 textarea，并仅在 `isGeneratingNote` 时把 `scrollTop` 同步到 `scrollHeight`；本地草稿实际生成后正文为 452 字符，`clientHeight=271px`、`scrollHeight=497px`、`scrollTop=225.5px`，满足 `scrollTop + clientHeight >= scrollHeight - 1`，最后一行保持可见。全图和聚焦对照确认字体与层级、颜色与主题变量、文案、图标及既有业务布局没有漂移，不涉及新增图片资产；主交互覆盖本地 Provider 切换、草稿生成和编辑框自动跟随，页面错误日志为空。最终无 P0/P1/P2 遗留。

42. 研究完成态层级专项：源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-07641ab0-f73b-4e5f-8fab-4b3264b5a822.png`，Docker 全图为 `/tmp/aiqt-research-completed-final.png`，聚焦实现为 `/tmp/aiqt-research-completed-focus.png`，源图与实现并排证据为 `/tmp/aiqt-research-completed-comparison.png`；实现视口 `2048 × 1200`，深色主题、研究工作台、`600000 · 1d`，加载持久化审计运行 `run-a1c885dc2713`，页面状态为“历史证据已载入”。首轮对照确认当前完成态只是稀疏摘要：缺少得分主体、指标表和历史摘要，时间线被等高网格拉出大块空白，四张证据卡内容与设计层级不符，均记为 P1。第二轮直接复用现有运行、指标、AI 报告、数据快照、修订与回放状态，补齐回测胜率环、六项审计指标、历史摘要、研究动态/证据链标签、五项真实证据轨迹以及 AI 摘要、数据源血缘、审计回放、恢复与复现四卡；没有补造参考图中的 `68.4` 综合分、未来预测、星级置信度或自动重试策略。第三轮移除时间线强制等高行，并让因子正文按面板剩余高度自然排布；终态因子正文 `clientHeight=scrollHeight=494px`，无裁切和内部伪空白。浅色主题往返无深色孤岛；`1024 × 900` 下核心完成态顺序保留，`375 × 812` 下所有区块单列且 `clientWidth=scrollWidth=375`；研究动态/证据链切换有效，浏览器错误日志为空。Web 专项 183 项、全量 1005 项、Python 678 项、生产构建与 Docker 健康检查均通过，最终无 P0/P1/P2 遗留。

43. 研究完成态圆环精修专项：源图继续使用 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-07641ab0-f73b-4e5f-8fab-4b3264b5a822.png`，用户反馈截图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-dc493488-e833-4aaa-afdc-7f3c1cf8093c.png`，Docker 全图为 `/tmp/aiqt-score-ring-page-after.png`，聚焦实现为 `/tmp/aiqt-score-ring-after-focus.png`，归一化同框对照为 `/tmp/aiqt-score-ring-comparison.png`；浏览器视口 `1280 × 720`，深色主题、研究工作台、`600000 · 1d`、历史运行完成态。首轮量化确认旧环虽为 88px 外径，但实际环宽约 10px，且仅按胜率给小段着色，剩余部分使用大面积暗轨；内部两行由隐式等高网格拉开，数值宽度和字重也明显大于源图，均记为 P2。修复继续复用同一 `meter` 与真实回测胜率，不新增组件或依赖：外环改为完整的琥珀/青绿双色构成，外径 `90px`、内径 `76px`、环宽 `7px`；内部使用两条最小内容轨道和 `2px` 间距，数值为 `22px / 500`，标签为 `10px / 600`，并移除额外描边与发光。Docker 实测当前圆环 `90 × 90px`、内圈 `76 × 76px`、数值 `22px / 500`、标签 `10px / 600`、两行真实间距 `2px`；浅色主题内圈随表面变量切换，深色恢复正常，浏览器日志为空。专项 183 项与 Web 全量 1005 项测试、生产构建和 Docker 重建均通过，最终无 P0/P1/P2 遗留。

44. 研究完成态圆环进度真实性专项：源图继续使用 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-07641ab0-f73b-4e5f-8fab-4b3264b5a822.png`，Docker 全图为 `/tmp/aiqt-score-ring-progress-page.png`，聚焦实现为 `/tmp/aiqt-score-ring-progress-focus.png`，同框对照为 `/tmp/aiqt-score-ring-progress-comparison.png`；浏览器视口 `1280 × 720`，深色主题、研究工作台、`600000 · 1d`、历史运行完成态。上一轮为了贴近参考图的双色外观，把“剩余百分比”也绘成另一种强调色，导致任何分数都呈现完整圆环，不能表达以 `100` 为最大值的真实进度，记为 P1。本轮保留同一 `meter`、真实回测胜率和既有尺寸，只把填充改为中性轨道上的单段 SVG 进度线：路径以 `100` 归一化，`strokeDashoffset = 100 - score`，两端使用圆角；分数 `< 40` 为红色、`40–59.99` 为琥珀色、`>= 60` 为青绿色。Docker 当前真实胜率为 `9.0909`，DOM 实测 `aria-valuemax=100`、`aria-valuenow=9.0909`、`stroke-dashoffset=90.9091`，即准确绘制约 `9.1%` 的红色弧线；圆环仍为 `90 × 90px`、线宽 `8px`，数值为 `22px / 500`、标签为 `10px / 600`。三档颜色直接复用全局 `danger / amber / teal` 主题变量，浅色模式获得对应高对比色；无结果时省略 `aria-valuenow` 并读作“暂无回测胜率”，`0 / 100 / 负数 / 超过 100` 的边界也由测试锁定。浅色主题的中性轨道和内圈表面随主题切换，实际进度与色阶保持不变；浏览器日志为空。专项 183 项与 Web 全量 1005 项测试、生产构建和 Docker 重建通过，`api` 与 `web` 容器均健康，最终无 P0/P1/P2 遗留。

45. 策略工坊功能重构专项：新版页面原先只展示静态模板、规则和状态卡，不能编辑或保存；现把既有 `StrategySummary` 结构化构建器直接接回新版策略工作区，继续复用模板应用、规则草稿、就绪校验、版本保存/载入和治理动作，没有新增第二套策略模型、Store 或 API。顶部只保留一个“保存版本”主动作，页面内可编辑名称、入场/出场、RSI/成交量确认、仓位、止损、止盈和最大回撤，并展示可审计快照、四项就绪闸门、规则矩阵、版本治理队列与策略库。治理层保留英文领域数据，在渲染层按现有 `i18n` 入口统一为中文，市场、当前草稿、差异字段、跨上下文和复审原因均不再混排；阻断、跨上下文和版本过期三类文案由行为测试直接覆盖。Docker 在 `1280 × 720` 深浅主题及 `375 × 812` 下复验：页面与工作区横向溢出均为 `0px`，移动端模板、字段、规则和版本卡片按单列折叠，控制台无错误或警告；模板切换、字段编辑、版本保存和历史载入均调用原有回调。Web 聚焦 196 项、全量 1009 项测试、生产构建和 Docker `api + web` 健康检查通过。

46. 策略工坊条件编辑布局与主题菜单专项：源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-f177f8aa-8cb1-45a6-8089-bfb1537a80d4.png` 与 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-3edefd1a-1504-44fa-a768-31394bfbe888.png`，Docker 深色全图为 `/tmp/aiqt-strategy-qa/strategy-desktop-dark.png`，浅色全图为 `/tmp/aiqt-strategy-qa/strategy-desktop-light.png`，移动端全图为 `/tmp/aiqt-strategy-qa/strategy-mobile-light.png`，源图与聚焦实现同框证据为 `/tmp/aiqt-strategy-qa/strategy-comparison.png`。首轮确认 `auto-fit` 把八项设置摊成五列，入场/出场语义被打散并产生大片横向空白；原生 `<select>` 又调用系统级黑蓝菜单，完全脱离应用主题，均记为 P2。现继续复用同一个 `StrategyRuleDraft` 和既有 `onUpdate`：桌面按“入场与出场、RSI 与成交量确认、四项风险参数”排为 `2 + 2 + 4` 的三行结构；`900px` 收为双列，`375px` 收为单列。原生选择器改为无依赖的应用内 `details/summary` 菜单，继续使用现有 `Check` 图标和新增的 `ChevronDown` 图标，面板绝对定位，不会在展开时撑高表单；深浅主题均复用既有表面、边框、文字与青绿色变量。Docker 实测 `1280 × 720` 下前两行字段宽 `503px`，四项风险字段宽 `246px`，容器与页面横向溢出均为 `0px`；菜单展开前后网格高度不变。选择“RSI 低于”后菜单关闭、键盘焦点回到触发器，草稿与可审计快照同步更新为 `RSI20 < 30`，页面不跳转；`900 × 720` 与 `375 × 812` 下同样无横向溢出，浏览器错误和警告日志为空。字体、业务文案、策略模型、Store、API 和保存语义均未改动；Web 聚焦 `609` 项与全量 `1011` 项测试、生产构建和最新 Docker `api + web` 健康检查通过，最终无 P0/P1/P2 遗留。

47. 策略工坊确认字段等高专项：源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-75ba3187-1e1d-4553-9ed9-fc9eb5ed234c.png`，Docker 全图为 `/tmp/aiqt-strategy-confirm-aligned.png`，聚焦实现为 `/tmp/aiqt-strategy-confirm-aligned-focus.png`，源图与实现上下同框证据为 `/tmp/aiqt-strategy-confirm-comparison.png`；浏览器视口 `1280 × 720`，深色主题、策略工坊、RSI 与成交量确认均关闭。首轮确认通用 `.strategy-draft-field > div` 的双列规则比专用确认字段选择器优先级更高，导致 RSI 四个子项被排成两行、成交量三个子项也产生隐式第二行，两个控件分别高 `68.80px` 与 `54.20px`，记为 P2。现只把两个既有专用选择器限定到直接子元素，不改组件结构或策略状态；浏览器实测左右字段同为 `73.90px`，内部控件同为 `35.40px`，标题、控件和提示三行基线完全一致，且两组输入都保持单行。字体、颜色、图标、文案和图片资产未变化；控制台错误与警告为空，Web 聚焦 `169` 项与全量 `1011` 项测试、生产构建和最新 Docker `api + web` 健康检查通过，最终无 P0/P1/P2 遗留。

48. 策略工坊确认参数语义专项：源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-75ba3187-1e1d-4553-9ed9-fc9eb5ed234c.png`，Docker 全图为 `/tmp/aiqt-strategy-rsi-labels.png`，聚焦实现为 `/tmp/aiqt-strategy-rsi-labels-focus.png`，源图与实现上下同框证据为 `/tmp/aiqt-strategy-rsi-labels-comparison.png`；浏览器视口 `1280 × 720`，深色主题、策略工坊、RSI 与成交量确认均关闭。首轮确认 `14`、`55` 与 `20` 仅作为无标签数字显示，用户无法判断它们分别代表 RSI 计算周期、RSI 触发阈值和成交量均线周期，记为 P2；它们并非最小值与最大值。现继续复用既有数值输入、国际化入口、草稿模型和 `onUpdate`，只在控件内部补充可见的“周期 14 / 阈值 55 / 均线周期 20”语义，并把可访问名称同步为“RSI 确认 周期 / RSI 确认 阈值 / 成交量确认 均线周期”，未新增状态、API 或组件抽象。桌面控件仍同为 `35.40px` 高；`375 × 812` 下字段宽 `333px`、页面横向溢出为 `0px`。字体、颜色、图标、业务数值和图片资产未变化；浏览器错误与警告为空，Web 聚焦 `178` 项与全量 `1011` 项测试、生产构建通过，最终无 P0/P1/P2 遗留。

49. 策略工坊版本治理列对齐专项：源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-df895243-82be-49ba-8b75-9c88b14ef69a.png`，Docker 实现截图为 `/tmp/aiqt-strategy-governance-aligned-1425.png`，源图与实现上下同框证据为 `/tmp/aiqt-strategy-governance-comparison.png`；浏览器视口 `1425 × 696`，深色主题、策略工坊、版本治理队列状态。首轮确认各数据行是独立 Grid，而最后的动作列使用 `auto`；“保存”“加载”“加载并审计”按钮宽度不同，导致每一行的版本、状态和证据轨道都重新分配，列起点随行漂移，记为 P2。现只把既有四列模板的动作轨道改成同一 `minmax(96px, 0.3fr)`，并让动作标题和按钮同样从该列左边界开始；版本、状态、证据、动作四列的实测起点在表头与所有数据行中分别固定为 `248 / 607.02 / 842.14 / 1263.11px`。字体、颜色、图标、文案、业务状态和动作回调均未改变；`375 × 812` 下行宽 `333px`、按钮完整可见，页面与工作区横向溢出均为 `0px`。Web 聚焦 `168` 项与全量 `1011` 项测试、生产构建和最新 Docker `api + web` 健康检查通过，最终无 P0/P1/P2 遗留。

50. 策略工坊版本治理居中对齐专项：继续使用源图 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-df895243-82be-49ba-8b75-9c88b14ef69a.png`，Docker 实现截图为 `/tmp/aiqt-strategy-governance-centered-1425.png`，源图与实现上下同框证据为 `/tmp/aiqt-strategy-governance-centered-comparison.png`；浏览器视口 `1425 × 696`，深色主题、策略工坊、版本治理队列状态。第 49 项虽然消除了可变列宽，却把正文统一成左对齐，仍不符合表头居中的视觉规则，记为 P2。现保留同一固定四列模板，仅让桌面端正文和动作按钮分别使用 `text-align: center` 与 `justify-self: center`；表头及前三行的版本、状态、证据、动作内容中心线均严格一致，实测为 `423.51 / 720.58 / 1048.63 / 1325.05px`。`375 × 812` 下继续使用更适合卡片阅读的左对齐，按钮保持左起，页面和工作区横向溢出均为 `0px`。字体、颜色、图标、文案、数据及动作回调均未改变；浏览器错误与警告为空，Web 聚焦 `168` 项与全量 `1011` 项测试、生产构建和最新 Docker 健康检查通过，最终无 P0/P1/P2 遗留。

51. 策略库版本删除专项：Docker 深色实现截图为 `/tmp/aiqt-strategy-delete-dialog.png`；浏览器视口 `1280 × 720`，策略工坊、A 股 `600000 · 1d`，使用一次性版本“删除验收临时版本”完成验收。删除动作直接复用现有 `StrategyLibraryStore.delete` 和策略详情 URL，新增 `DELETE /api/strategies/{revision}`，没有引入第二套 Store 或级联删除算法。策略卡把“载入 / 删除”收进同一动作区；删除使用应用内主题化 `alertdialog`，明确展示名称、revision、上下文和“仅移除本地策略库条目”的边界，默认焦点在“取消”，不使用浏览器原生确认框。取消后版本仍同时存在于策略库和治理队列；确认后两处同步消失，弹窗关闭，随后详情回读返回 `404`。删除成功后复用既有权威策略库回读：临时把库补足到 13 条，在 12 条投影中删除首条后可见数量仍为 12，第 13 条自动补位，清理后恢复原 8 条数据；删除按钮的可访问名称同时包含策略名和 revision，可区分同名版本。浅色往返实测弹窗为白色表面、深色正文和红色危险动作，关闭后已恢复用户原有深色主题。删除允许作用于当前已载入、已审计或最后一个保存版本，但当前草稿、历史研究运行、策略实验和审计证据继续保留；失败时弹窗保持打开并显示中文错误。移动断点下两个动作和弹窗按钮各占一列，最小高度 `42px`，由 CSS 契约测试锁定。Python 全量 `678` 项、Web 全量 `1013` 项、生产构建、Docker 重建和 `api + web` 健康检查通过；容器日志记录实际 `DELETE 200` 与删除后 `GET 404`，最终无 P0/P1/P2 遗留。

52. 策略工坊 AI 帮写专项：在现有结构化策略草稿与 Stage 3 Provider 注册表之上增加“AI 帮写”，不新增第二套策略模型、Store 或执行链。用户填写策略目标并选择已配置 Provider；外部 Provider 必须逐次确认只发送市场、标的、周期、目标和当前结构化草稿摘要，不发送原始 K 线、账户、订单、密钥或已有笔记。返回结果先经过后端严格结构校验与安全边界校验，再在弹窗内同时展示完整的“当前草稿 -> AI 候选”差异和 3 至 6 条中文“为什么这样编写”；只有人工点击“应用到当前草稿”才会原子更新编辑器，并清除不再匹配的新旧审计/回测证据。应用不会自动保存版本、运行研究、提交订单或开放实盘，`paperOnly=true` 与全部 live 阻断边界保持不变。Docker 真实已配置 OpenAI-compatible Provider 验收成功生成 `SMA30 + RSI14 > 55 + VOL20 / SMA20` 候选及 5 条中文理由；人工应用后名称、入场、确认项、出场与四项风险参数同步更新，就绪闸门为 `3/4`、状态仍为“待审计”，策略库数量仍为 `0`，底部继续显示“模拟盘 / 实盘交易已阻断”。请求支持 45 秒超时、显式取消和关闭中止；浏览器实测生成后立即点击“取消生成”，弹窗在 300ms 内关闭且不留下候选。浅色弹窗使用白色表面、深色正文与现有青绿/琥珀语义，夜间模式恢复深色表面；两种主题均未产生深色孤岛或文字低对比。Python 全量 `694` 项、Web 全量 `1014` 项、生产构建、Docker `api + web` 健康检查和真实 Provider 浏览器链路通过。

补充复审：外部 Provider 的单次授权会在请求发起时立即消费，失败、取消或再次生成都必须重新勾选；安全回退候选明确标记为“安全回退 · 仅供对照”，不可人工应用。主动取消造成的客户端断连由 HTTP 层按正常断连收口，不再输出 `BrokenPipeError` traceback；最终全量回归为 Python `695` 项、Web `1016` 项，生产构建与最新 Docker 健康检查通过。

独立标准复审进一步发现：关闭的 RSI/成交量确认项及 SMA 条件仍有会被整体应用的保留参数，原摘要可能把这些变化折叠掉。终态差异表无论参数当前是否启用，都会展示条件周期、条件阈值、确认周期、确认阈值和成交量均线周期；`paperOnly` 也作为执行模式参与差异比较。新增行为测试用候选同时改变五类潜在字段，确认差异行全部出现，人工应用前不再存在不可见覆盖。

同轮复审还锁定“候选与当前草稿完全相同”的边界：无差异候选现在显示“无需应用”，应用按钮禁用，事件处理器也会二次阻断，因此不会因为一次无效应用而清除已有审计或回测证据。

53. 研究开市日历误复核专项：源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-1baa9abc-e3cd-47c7-8e52-b08e9b421899.png`。固定 `2026-07-21 10:00 +08:00` 复现确认市场日历正确返回 `open / morning`，但 A 股静态时段模板会在所有时段附带“未配置交易所节假日日历”警告；前端研究预检和后端 Golden Path 都曾把任何非空警告当成运行复核条件，因此正常开市也会出现“交易日历”确认项。现只把这条已知的静态日历覆盖警告降为开市时的非阻断证据：`open / always_open` 不再因此要求确认，警告原文仍保留在详情和审计证据中；其他警告以及午间休市、收盘、周末和未知状态继续复核。最新 Docker 页面实际点击“运行研究”后仍显示自选、刷新证据、笔记和工作区四项真实复核，但“交易日历”项数量为 `0`，浏览器错误日志为空；Web 相关文件 `438` 项、Python 市场日历 `4` 项、生产构建和 Docker `api + web` 健康检查通过。

54. 研究运行完成提示专项：新版研究工作台原先会更新最近运行和审计证据，但运行结束后没有可见反馈。现复用既有 `runPipeline`、权威运行摘要和策略库刷新结果，仅在研究成功、运行历史和策略库完成回读尝试并核对结果后显示非阻塞完成提示；提示包含标的名称、代码、周期、K 线数量、证据回读状态和 Run ID，支持手动关闭并在 6 秒后自动消失。权威回读正常时显示“审计证据已绑定”，任一列表降级时则如实显示“审计运行已创建 · 列表回读待恢复”；新运行开始、失败、预检阻断和旧请求回写均不会产生成功误报，最终显示前还会再次核对运行代次。提示使用 `role=status` 与 `aria-live=polite`，深浅主题分别复用现有语义变量。最新 Docker 实际运行贵州茅台 `600519 · 1d` 后收到 `run-97b906ee405f` 完成提示，显示 `500` 根 K 线和“审计证据已绑定”，手动关闭后立即消失，自动关闭路径也已验证。Web 全量 `1017` 项测试、生产构建、Docker Web 重建与健康检查通过。

55. 前台动态数据刷新专项：浏览器网络事件复现确认页面首载后持续等待仍为 `0` 个请求，报价、K 线/缓存年龄和交易日历只会在首载、上下文变化或手动操作时更新，因而跨越报价缓存周期、午间休市或收盘后仍可能显示旧状态。现直接复用 `loadTerminalWorkspace`、`loadMarketKlines`、`loadMarketDataReadiness`、`loadMarketCalendarStatus` 和 `workspaceWithSavedWatchlist`，增加唯一的 35 秒前台刷新心跳；页面隐藏时暂停，恢复可见或重新聚焦时立即补刷。自选报价只按市场与代码映射到当前本地列表，保留未保存的成员、删除和顺序；当前选中标的同步采用新报价。K 线与日历在后台刷新时保留上一份成功结果，不再周期性闪空；请求序号和当前市场校验会丢弃迟到响应，缓存展示也改为优先采用刚回读的 readiness。顶部原“实时数据已连接”改为诚实的“行情自动刷新”。最新 Docker 浏览器实测重新聚焦和静置 36 秒后都发出 `/api/workspace`、`/api/market/calendar`、`/api/market/klines`、`/api/market/data-readiness` 四类请求，未出现设置、密钥或审计请求风暴；页面显示“行情自动刷新”，不再声称流式实时连接。市场日历 API 测试同时固定到明确午间休市时刻，不再因测试运行时正处于开盘或休市而漂移。Python 全量 `695` 项、Web 全量 `1018` 项、生产构建、Docker `api + web` 健康检查通过。

56. 回测实验室布局与底部间距专项：最新 Docker 在 `1280 × 720` 深色主题、A 股 `600000 · 1d` 空回测状态下复现确认，后置全局样式把工作区底部内边距覆盖为 `0`，固定 `250px` 的右栏在宽屏比例失衡，左右列又只按内容顶部排列，导致交易明细底部留空而右侧最近运行紧贴固定状态栏。现仅增加回测工作区局部规则：桌面底部恢复 `10px`，标题与回测上下文分两层显示，主栏与右栏改为 `minmax(0, 1fr) + clamp(280px, 24vw, 340px)`，交易明细与最近运行分别占用各列剩余高度。Docker 实测 `1280px` 视口下两列宽度为 `726.805 / 307.195px`，左右末卡底边同为 `648px`，与状态栏之间准确保留 `10px`；`1024 × 900` 下自动改为单主列，右侧信息卡在下方双列排列，工作区 `scrollWidth=clientWidth=816`，无横向溢出。浏览器错误与警告为空；Web 聚焦 `172` 项、全量 `1019` 项、生产构建和 Docker Web 健康检查通过，回测模型、API、运行动作和实盘阻断边界均未改动。

57. AI 评审信息层级与主题布局专项：用户源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-1dcd6838-f2ad-4be1-b49d-fe2186f2934a.png`，Docker 验收截图为 `/tmp/aiqt-ai-review-qa/ai-review-desktop-light.png`、`/tmp/aiqt-ai-review-qa/ai-review-desktop-dark.png` 和 `/tmp/aiqt-ai-review-qa/ai-review-mobile-light.png`。旧页面把证据表、两个固定 `345px` 高的结论卡和五个右侧小面板同时平铺，阅读顺序分散、空白过大，浅色主题内仍沿用深色内部边框与低对比文字。现继续复用既有研究运行、权威 Stage 3 评审、指标、Decision 日志和审计摘要，只重排为“当前评审上下文 → 评审结论 → 实验指标对比 → 评审记录”的主路径，右栏收纳证据与审计、模型披露、评审进度和最近评审；无权威评审时明确显示“等待评审/待运行”，不再根据研究运行硬编码“确定性通过/外部未通过”。结论、摘要、一致性、Provider、model、证据 Hash、记录 Hash 和最近评审均读取真实权威记录；已知评审角色、指标和摘要通过现有中文 i18n 渲染，Decision 仍保持只追加不覆盖，外部失败仍不能覆盖确定性本地基线。内部表面、边框、文字和语义色统一复用主题变量，`1920 × 1080` 深浅主题下主栏/右栏宽度为 `1324 / 350px`，页面与工作区横向溢出均为 `0px`；`1024 × 900` 下审计栏自动变为双列，`375 × 812` 下所有区域单列折叠且横向溢出为 `0px`。Web 聚焦 `192` 项、全量 `1022` 项、生产构建、Docker Web 重建与健康检查通过；评审 API、安全边界和实盘阻断逻辑均未改动。

58. AI 评审外部失败与授权布局专项：用户源图为 `/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-1cd09a32-46ed-4576-b7c3-2a961500f937.png`，Docker 实现截图为 `/Users/wenqingjie/MyProjects/AIQuantificationTools/design-qa-ai-review-implementation.png`，源图与实现并排证据为 `/Users/wenqingjie/MyProjects/AIQuantificationTools/design-qa-ai-review-comparison.png`；浏览器视口 `2048 × 601`、浅色主题。权威评审记录确认外部模型失败原因为 `provider_request_timed_out`（30 秒），旧请求曾发送约 `9,842` 字符的完整候选网格；容器内同一 Provider 使用严格结构化输出的连通性与响应均正常。现复用既有证据包和 Provider，不改变确定性基线：外部提示只投影各实验被选中的候选及其必要证据，实际权威证据包投影降至约 `3,223` 字符、4 个证据项；canonical validator 改为校验“本次实际发送的证据 ID 子集”，仍拒绝未知引用和内容漂移。新策略实验默认启用 `80 / 20 / 60` 的滚动训练、验证和步长，避免正常 500/240 行数据因零验证窗口直接落入“依据不足”；用户主动关闭滚动验证时仍按真实证据提示不足。授权控件改为 `16px` 勾选框加两行紧凑卡片，标题“允许发送证据摘要”和逐次授权说明各自独立，实测卡片 `326 × 46.97px`、列宽 `16 / 280px`、内边距 `9 × 10px`，不再覆盖模型披露文字；超时状态明确显示“外部模型响应超时，请稍后重新运行评审”，不再用笼统失败替代原因。未绕过逐次授权自动重跑真实外部评审，因此旧失败记录保持只读，新评审仍需用户主动勾选授权。Python Stage 3 专项 `142` 项、Web 全量 `1026` 项、生产构建、Docker `api + web` 重建与健康检查通过；最终无 P0/P1/P2 遗留。

final result: passed

### 组合人工审批交互修复

- 复现根因：Stage 4 黄金路径进入“人工审批”后，旧版工作区仍有审批列表，但新版组合风控只把顶部动作映射为一个不存在的旧选择器；点击后既不会定位，也没有批准/拒绝入口，因此表现为完全无响应。
- 新版组合风控现直接复用既有 `PortfolioPaperOrderApprovalRow`、批准/拒绝处理器和 `POST /api/portfolio/paper-order-approvals`，展示当前批次的待审批纸面委托；顶部“查看人工审批”只定位到审批区，不会自动批准。
- 每笔委托明确展示方向、数量、名义金额和中文状态。批准或拒绝必须由人工逐笔点击；已跳过的持有委托明确标记为“无需审批”，不会伪造审批记录。
- 浏览器实际批准 `ui-approval-1784726798-600519-buy` 后，页面立即更新为“已批准，等待模拟成交”，服务端回读 `approved=true`、`reviewer=local-operator`，同批另一笔委托仍保持待审批。
- 审批继续保持 `paperOnly=true`、`liveExecutionBlocked=true`；本次没有接入真实券商、开放真实委托或启用 live route。

## 2026-07-22 组合风控页面专项

- 用户参考图：`/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-4cfdeedd-c27c-4ce1-9746-562d204e1fb6.png`
- Docker 实现图：`/Users/wenqingjie/MyProjects/AIQuantificationTools/design-qa-portfolio-implementation-light.png`
- 补充深色实现图：`/Users/wenqingjie/MyProjects/AIQuantificationTools/design-qa-portfolio-implementation.png`
- 验收视口：`2048 × 1135`
- 核心状态：组合尚未构建，黄金路径当前步骤为“组合构建”；点击主按钮后会展示缺少已审计研究运行的明确反馈。
- 顶部五步进度改为读取真实 Stage 4 黄金路径状态，已完成、当前、待处理和阻断状态统一使用主题语义色，不再硬编码第二步高亮。
- 权益占比改为主题自适应的 SVG 圆头进度环，按 `0–100%` 映射进度；`0%` 时不绘制误导性的进度端点，中心数值和标签重新收敛层级。
- “继续黄金路径”复用现有 Stage 4 主动作构建器和处理器；无可执行动作、阻断或运行中会正确禁用，失败时在页面内显示中文原因，不再表现为点击无效。
- “组合配置概览”和“组合腿位”取消被右栏强制拉高的网格拉伸及固定最小高度；空状态按内容收口，风控指标台账紧邻第一行显示。
- 页面底部保留 `10px` 安全间距；中等和移动断点恢复自然单列布局，不改变纸面模拟和实盘阻断边界。
- 对照结论：信息层级、状态颜色、空状态密度、按钮反馈和页面收尾均通过；最终无 P0/P1/P2 遗留。

final result: passed

### 黄金路径组合腿时间轴一致性修复

- 复现根因：当前 `600519 · A 股 · 1d` 审计运行包含 500 个权益点，而历史 `600000 · A 股 · 1d` 仅包含 240 个权益点；两条权益曲线的时间戳序列不一致，权威组合回测因此按既有安全约束返回 `400 portfolio legs must use aligned equity timestamps`。
- API 客户端现在会先读取服务端错误详情，再按状态处理响应；即使服务端拒绝请求，页面也会显示具体中文原因，不再退化成没有上下文的 `HTTP 400`。
- 组合草稿构建器继续复用既有研究运行与 peer audit，只接受长度和逐点时间戳完全一致的权益曲线；较新的错位运行会被跳过，存在更早的对齐运行时会继续复用。
- “继续黄金路径”在缺少对齐腿位时会从同市场、同周期的历史审计运行中寻找对照标的，即使该标的不在当前自选列表，单次点击也最多只做一次最佳努力的重新审计；补跑后重新回读权威运行历史并再次构建组合草稿。
- 自动补跑同行标的时只替换研究标的，继续复用当前已经审计的策略、仓位与风险约束；不再把策略重置成“等待生成规则”的占位上下文，避免研究服务按安全约束返回 `400`。研究运行客户端同时透传服务端的具体拒绝原因，后续故障不会再只显示裸 `HTTP 400`。
- 同行补跑同时沿用当前权威权益曲线的样本长度与最后一个时间戳。研究 API 会把结束时间传给现有行情适配器：历史 A 股日/周优先复用 AkShare 的结束日查询，美股 Yahoo 使用明确时间窗，加密货币 Binance 使用 `endTime`，并统一剔除结束时间之后的 K 线；不再只保证“行数相同”却留下历史区间错位。
- 历史 A 股分钟线在 Eastmoney 返回的数据全部晚于目标结束时间时，会继续尝试既有 AkShare 适配器；上游若错误声明“完整”却没有任何 K 线，研究层会明确失败关闭，不能把空数据带入回测。
- 加密货币回退链保持既有顺序，但 Coinbase 带结束时间的请求会按每页不超过 300 根分段回读并去重裁剪；CCXT 的 `since` 从 `end - step × (limit - 1)` 开始，确保对齐结束时刻的最后一根 K 线包含在结果内。
- 行情与研究接口对非空但非法的结束时间（包括非日期文本和无限数值）统一返回 `400 invalid_kline_end`，不再静默退回当前时间并产生难以解释的错位组合。
- 补跑期间所有组合入口统一锁定，切换标的或运行后旧请求不能回写新上下文；补跑或组合提交失败时，页面优先显示服务端具体原因。即使反向代理返回空响应或非 JSON 错误页，也会保留真实 HTTP 状态。
- 如果补跑后仍不满足精确对齐，页面会以中文阻断并保留在组合构建步骤，不再提交已知必然失败的组合请求。没有采用日期交集、填充或重采样，Stage 4 的组合收益、风险证据和回放算法保持不变。
- 回归覆盖：错误详情回读、跳过较新错位运行、无对齐腿位时本地阻断、错位 peer 重新审计、非自选历史标的发现、历史分钟线回退、空完整数据拒绝、Coinbase 分页、CCXT 结束蜡烛和非法结束时间。最终全量回归为 Python `708` 项、Web `1044` 项；生产构建、Stage 4 Docker smoke/validate 和真实浏览器黄金路径均通过，浏览器请求为 `POST /api/portfolio/backtest 200`，两条组合腿各 `500` 行，实盘继续阻断。

final result: passed

## 2026-07-22 组合风控密度与首行等高复验

- 用户源图：`/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-356d63c5-9a3d-4655-96f3-6cddefaeb612.png`。
- Docker 实现图：`/Users/wenqingjie/MyProjects/AIQuantificationTools/design-qa-portfolio-spacing.png`；源图与实现并排证据：`/Users/wenqingjie/MyProjects/AIQuantificationTools/design-qa-portfolio-comparison.png`。
- 验收视口与密度：源图、实现图均为 `2048 × 1170`、CSS 像素密度 `1`；深色主题、组合构建步骤、全部委托均为“无需人工审批”的同类状态。
- 修改前 P1：右栏跨越的网格行数少于左侧实际内容行数，额外高度被分摊到首行和审批行，导致“组合配置概览”与“组合腿位”看似不等高，并在“组合委托人工审批”上下形成大段空白。
- 修改前 P2：数量为 `0`、状态为“无需审批”的持有行仍渲染审批区，标题和按钮沿用通用 `16px` 字号，既无可执行动作，也破坏当前页面的 `10–12px` 信息密度。
- 终态：右栏覆盖完整三行网格，首行两张卡片的 `top / bottom / height` 均为 `118 / 414 / 296px`；全部委托已跳过时不再渲染无意义的人工审批区，风控指标台账直接承接首行。真正存在待审批、已批准或已拒绝委托时仍保留既有审批入口，标题收敛为 `12px`、按钮为 `10px`，没有改变审批 API、状态机或纸面交易安全边界。
- 自动化与运行验收：相关 Web 聚焦 `204` 项、Web 全量 `1046` 项、Python 全量 `708` 项、生产构建和 Docker `api + web` 健康检查通过；`git diff --check` 通过，浏览器控制台错误和警告均为 `0`。
- 最终检查：首行等高、信息密度、深色主题、空状态、响应式约束和不可变实盘阻断边界均通过；无 P0/P1/P2 遗留。

final result: passed

## 2026-07-22 组合风控人工审批刷新恢复复验

- 用户源图：`/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-be582ac0-77d0-4492-9ae2-07af26d6791a.png`；Docker 终态图：`/Users/wenqingjie/MyProjects/AIQuantificationTools/design-qa-portfolio-approval-restored.png`。
- 复现根因一：组合风控刷新后，当前 workspace 不再携带研究运行，Stage 4 加载链因 `currentResearchRunId=null` 直接清空委托批次；虽然服务端仍保留审批批次，页面却只能回到“组合构建”。现把组合风控纳入既有“按市场、标的、周期恢复最近已审计研究运行”链路，继续复用运行历史和 `workspaceFromResearchRunAudit`，没有新增 localStorage、URL 状态或第二套 Store。
- 复现根因二：黄金路径在检查服务端已持久化批次之前就因内存中的组合回测结果缺失返回“组合构建”；现先读取当前批次，只在组合结果和批次都不存在时才回退第一步。刷新后可以依据权威纸面委托批次恢复“人工审批”。
- 复现根因三：审批区原先只在存在非 `skipped` 行时渲染，导致黄金路径已经处于人工审批但操作目标不存在。现当前步骤为人工审批时始终保留既有审批区；真正的批准、拒绝仍由用户逐笔触发，顶部按钮只负责定位。
- Docker 浏览器以 `2048 × 1170`、深色主题连续完整刷新两次，均恢复到步骤 `3 / 人工审批`，并展示 2 条审批委托；点击“查看人工审批”后审批区位于可视区内，旧提示“当前步骤的操作区域尚未加载”不再出现。首行“组合配置概览”和“组合腿位”仍保持 `top=118 / bottom=414 / height=296px` 等高。
- 自动化与运行验收：Stage 4、运行上下文、布局和 surface 聚焦回归共 `659` 项、Web 全量 `1048` 项通过；生产构建通过，仅保留既知 chunk-size 提示；Docker `api + web` 均为 healthy；`git diff --check` 通过；浏览器控制台 `0 error / 0 warning`。纸面交易与实盘阻断边界未改变。

final result: passed

## 2026-07-22 组合风控全 skipped 批次推进复验

- 用户反馈：组合批次显示“无需人工审批”时仍停留在人工审批步骤，但委托均为 `hold / skipped / quantity=0`，批准和拒绝按既有安全边界必须禁用。
- 根因：共享 Stage 4 黄金路径使用完整订单 ID 集合检查批准记录，没有把权威批次中全部无需调仓的 no-op 状态作为终态，因此产生了不可完成的 `operator-approval-required`。
- 终态只增加一个共享状态机分支：风险阻断、混批和拒绝证据仍优先 fail-closed；确认当前批次所有订单均为 `skipped` 或 `hold` 后，直接完成本页 no-op 黄金路径，不写入假审批、不生成假模拟成交或假账户回放。真实 `buy/sell + 正数量 + pending_review` 委托仍逐笔显示批准/拒绝按钮。
- Docker 真实写入纸面 QA 批次 `portfolio-paper-batch-7a03ca367ace`，两条生命周期均为 `skipped / routable=false`；`2048 × 1170` 深色页面显示“黄金路径已完成 / 无需人工审批 / 没有需审批委托”，审批操作区不存在，旧 `operator-approval-required` 和操作区加载错误均不存在。实现图：`/Users/wenqingjie/MyProjects/AIQuantificationTools/design-qa-portfolio-noop-complete.png`。
- 聚焦回归 `216` 项、Web 全量 `1049` 项与生产构建通过，Docker `api + web` healthy，浏览器控制台 `0 error / 0 warning`；纸面与实盘阻断边界未改变。

final result: passed

## 2026-07-22 执行中心前置操作与底部间距复验

- 用户源图：`/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-e19c5028-b4a0-4e29-83d2-995e1b4bb933.png`；Docker 实现图：`/Users/wenqingjie/MyProjects/AIQuantificationTools/design-qa-execution-interactions.png`；底部间距证据：`/Users/wenqingjie/MyProjects/AIQuantificationTools/design-qa-execution-bottom-spacing.png`；源图与实现并排证据：`/Users/wenqingjie/MyProjects/AIQuantificationTools/design-qa-execution-comparison.png`。
- 验收视口为 `1679 × 919` CSS 像素、深色主题、A 股 `600519 · 1d`；用户源图为同视口的 `3358 × 1838` Retina 截图，实现图按相同 CSS 视口捕获并在并排证据中归一化到源图密度。
- 修改前 P1：新版执行中心只把顶部主动作绑定到 Stage 9 候选创建，并在缺少 Stage 6 授权时直接禁用；既有 Stage 5/6/7/9 前置操作区仍留在旧工作区渲染分支，新版页面没有入口，因此真实 Docker 中整页只有 1 个按钮且 `enabledButtonCount=0`。
- 终态继续复用既有执行状态、API 客户端和 `ExecutionStage5ShadowSection / ExecutionStage6SandboxSection / ExecutionStage7ProductionReadonlySection / ExecutionStage9ProductionAdmissionSection`。缺少 Stage 6 授权时，顶部显示可点击的“查看执行前置步骤”，点击后在当前执行页展开单一的“生产准入与测试网证据”区域；授权存在时仍调用原 Stage 9 候选创建处理器，没有新增或绕过任何执行算法。
- Docker 实测顶部动作唯一定位且 `disabled=null`；点击后折叠区 `open=true`，当前证据状态下展示 4 个前置操作按钮，其中 2 个可用、2 个按既有闸门禁用。只验证了展开和按钮可达性，没有触发 Sandbox Kill Switch、提交测试网委托或生产只读网络访问。
- 修改前执行时间线在最大滚动位置与固定状态栏没有安全间距；现仅为 `.surface-execution` 恢复 `16px` 底部内边距。最大滚动位置实测 `scrollTop=maxScrollTop=121px`、时间线底边 `840.90px`、状态栏顶边 `857px`，可见间距为 `16.10px`。
- 自动化与运行验收：相关 Web 聚焦 `207` 项、Web 全量 `1051` 项、生产构建和 Docker `api + web` 健康检查通过；`git diff --check` 通过；浏览器控制台 `0 error / 0 warning`。`paperOnly=true`、`liveTradingAllowed=false`、`orderSubmissionEnabled=false`、`routeExecuted=false` 与 `liveBlockedBoundary=true` 均未改变。

final result: passed

## 2026-07-23 执行中心证据区与候选队列间距复验

- 用户源图：`/var/folders/pn/mpj6bdfj1b91_cv0s4b5462m0000gn/T/codex-clipboard-f8ec1a37-fc95-495c-b88b-4c4478458f4a.png`；Docker 实现图：`/Users/wenqingjie/MyProjects/AIQuantificationTools/design-qa-execution-readiness-gap.png`；源图与实现并排证据：`/Users/wenqingjie/MyProjects/AIQuantificationTools/design-qa-execution-readiness-gap-comparison.png`。
- 复现状态为深色主题、A 股 `600519 · 1d`、前置证据区折叠。用户源图按 Retina 密度归一化约为 `1447 × 511` CSS 像素；Docker 复验使用既有 `1679 × 919` 页面视口并截取同一内容区域，宽度为 `1443px`、高度为 `511px`。
- 修改前实测 `.design-execution-readiness` 的 `bottom=304px`，`.design-execution-grid` 的 `top=304px`，两块边界间距为 `0px`。根因是前置证据包装器没有外部间距，后续执行网格直接承接其边界。
- 终态只复用执行中心既有 `10px` 布局节奏，为 `.design-execution-readiness` 增加 `margin-bottom: 10px`；同视口复测证据区仍为 `bottom=304px`，候选队列网格改为 `top=314px`，实际间距为 `10px`。页面 `bodyScrollWidth=bodyClientWidth=1679px`，没有引入横向溢出。
- 自动化与运行验收：布局聚焦回归 `178` 项、Web 全量 `1051` 项通过；生产构建通过，仅保留既知 chunk-size 提示；Docker `api + web` 均为 healthy；`git diff --check` 通过；浏览器控制台 `0 error / 0 warning`。
- 本次没有改动候选创建、前置操作、路由预检或执行状态机；`paperOnly=true`、`liveTradingAllowed=false`、`orderSubmissionEnabled=false`、`routeExecuted=false` 与 `liveBlockedBoundary=true` 均保持不变。

final result: passed
