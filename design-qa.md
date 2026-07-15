# UI 重构设计验收

- 验收日期：2026-07-15
- 设计来源：[Figma 九工作区终端设计](https://www.figma.com/design/qbF7LVyzZ0RL5uYjZzqf06?node-id=3-2)
- 实现入口：`http://127.0.0.1:5173/?workspace=market`（Docker 构建）
- 桌面验收视口：1440 × 1024
- 移动验收视口：375 × 812

## 对照截图

- [行情中心：设计稿与实现并排对照](docs/assets/ui-redesign/market-reference-vs-implementation.jpg)
- [执行中心：设计稿与实现并排对照](docs/assets/ui-redesign/execution-reference-vs-implementation.jpg)
- [375px 移动布局实现](docs/assets/ui-redesign/mobile-375-implementation.png)

## 验收结论

九个既有工作区全部复用原有模型、store、API 与组件，只替换统一终端外壳、导航组织、视觉 tokens 和响应式布局。设计稿中的示例行情与订单不作为实现数据源；实现继续展示真实 API/readback 状态，在本地核心不可用时明确显示离线快照或 HTTP 错误，不伪造成功数据。

- P0：已修复。左侧九工作区不再以大卡片常驻挤压主内容；Stage 5/6/7/9 组件不再占用同一网格区域互相覆盖；实盘阻断状态在所有工作区持续可见。
- P1：已修复。低频 P0/Golden Path 证据收进可展开的“工作区上下文”；执行准入与测试网证据收进独立展开区；默认视图优先呈现当前工作区主任务。
- P2：已修复。应用选定 Logo、统一边框/圆角/色彩/密度，补齐 375px 横向图标导航和移动状态条。
- 浏览器：九个 `workspace` 路由均唯一渲染；Docker 最终回读确认 Logo、工作区、状态条存在，标题不换行，控制台错误为 0。
- 桌面包：`AIQuantificationTools_0.1.0_x64.dmg` 已重新生成并通过 `hdiutil verify`，SHA-256 为 `edd2cbe82237013398eed51cd7cc5cf4905573f86c968918b568a501679c3401`。
- 安全边界：`liveTradingAllowed=false`、`orderSubmissionEnabled=false`、真实委托持续阻断；本轮没有新增券商或下单路径。

final result: passed
