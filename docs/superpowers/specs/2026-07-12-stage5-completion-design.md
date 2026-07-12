# Stage 5 整体完成设计

## 状态

已确认，进入实施。

## 目标

一次性完成 Stage 5 的产品退出，不再把剩余工作拆成新的编号阶段。系统应把 Stage 3、Stage 4 与 Stage 5 已有发布证据收束为一份可离线复核的顶层退出验收清单，通过 API 和 Execution 工作区回读同一结论，并把 Stage 5 从 `current` 转为 `maintenance`。

完成只表示“实盘前安全基础已交付并可持续维护”，不表示测试网或真实资金交易获准。`authorizationEffective=false`、`sandboxOrderSubmissionAllowed=false`、`liveTradingAllowed=false`、`orderSubmissionEnabled=false`、`routeExecuted=false` 与 `liveBlockedBoundary=true` 继续是不可变边界。

## 当前事实与缺口

Stage 5 已有链路包括 Shadow 执行、幂等订单身份、状态机、限额、急停、超时重试、故障注入、对账、重启恢复、导出导入、Sandbox 准入、权威只读探针、授权预检、不可变授权复核和 CI 发布门禁。现有七份发布 manifest 能分别证明这些能力，但仍存在一个产品级缺口：

- 没有权威顶层结论声明七份证据共同满足 Stage 5 退出标准。
- 没有运行时 API 对顶层结论及上游文件漂移进行回读。
- Execution 工作区无法展示 Stage 5 已退出或解释阻断边界。
- README、产品规划与架构仍把 Stage 5 描述为持续开发中的 `current` 阶段。

## 核心设计

### 1. 顶层退出验收清单

新增 `data/stage5-exit-acceptance.json`，kind 为 `aiqt.stage5ExitAcceptance`。它只聚合既有证据，不创建第二套执行、风控或授权算法。固定引用并按顺序记录七个源文件：

1. Stage 3 deterministic AI review。
2. Stage 4 authoritative portfolio paper workflow。
3. Stage 5 shadow execution。
4. Stage 5 sandbox readiness。
5. Stage 5 authoritative readonly probe。
6. Stage 5 authorization preflight。
7. Stage 5 immutable authorization review。

每个引用包含稳定 id、仓库相对路径和源文件 SHA-256。清单还记录七项已通过检查、Stage 5 base run id、生成时间、固定安全边界和自身 `exitHash`。状态仅允许 `accepted_for_maintenance`。

### 2. 权威生成与离线复核

继续复用 `tools/docker_smoke.py`：只有七份既有 validator 全部通过、Stage 4 与 Stage 5 的 base run 身份一致后，才生成顶层清单。完整 `docker:smoke:stage5` 在原有链路末尾写出该文件，`docker:smoke:stage5:validate` 最后复核它。

生产模块只负责顶层清单的规范化、hash、精确结构验证和源文件 SHA-256 回读，不复制上游业务 validator。这样业务真相仍由现有模型和构建器产生，顶层模块只回答“已验证的证据是否仍是同一批文件”。

### 3. 运行时回读

新增 `GET /api/stage5/exit-acceptance/latest`，返回：

- `accepted`：清单结构、hash、安全边界及七个源文件 hash 全部一致。
- `missing`：顶层清单尚未生成。
- `invalid`：清单或任一源文件缺失、漂移、篡改或违反安全边界。

响应不读取环境密钥、不连接交易所、不执行订单。源文件变化后必须立即 fail closed，不能继续显示历史通过状态。

### 4. 产品状态与界面

Execution 继续复用现有 Stage 5 区块，增加顶层退出回读摘要，不建立第二个仪表盘。界面显示状态、七份证据覆盖、退出 hash 与安全边界；无效或缺失时明确提示重新运行完整验收。

产品阶段定义把 Stage 5 改为 `maintenance`。本次不虚构 Stage 6，也不自动指定新的 `current`：下一产品阶段需要单独路线决策；真实券商与订单路由需要单独设计、人工授权和验收。

### 5. CI 与发布证据

CI 继续执行现有 Stage 3/4/5 smoke 与 validator；Stage 5 完整 smoke 生成顶层清单，离线 validate 将它纳入同一门禁，artifact 从七份扩展为八份。任何源证据无效或顶层聚合失败都使发布门禁失败。

## 失败与安全语义

- 顶层清单缺失不影响平台 paper/shadow 功能，但 Stage 5 退出状态为 `missing`。
- 清单 hash、字段、顺序、路径、源文件 hash 或安全边界任一不一致即为 `invalid`。
- 默认无凭据环境中只读探针、预检和授权复核按设计 fail closed；成功 preflight/review 数量为 0 仍可证明安全门禁有效。
- `approved` 复核也不生效；本次没有激活、提交、撤销、查询订单或真实资金连接动作。

## 完成定义

- 顶层退出清单可生成、离线验证，能拒绝自洽重算后的结构/安全边界篡改，并能检测清单生成后的源文件漂移。
- API 与 Web 能回读 accepted/missing/invalid，刷新后不依赖临时前端状态。
- CI 上传并验证八份发布证据。
- README、产品规划、架构和运维文档统一标记 Stage 5 为 maintenance。
- Python/Web 全量测试、生产构建、Docker Stage 3/5 smoke 与 Stage 4/5 validate 全部通过。
- 独立 Standards/Spec 审查无未解决的重要问题，变更提交到独立分支。

## 不做

- 不接真实券商、测试网订单或真实资金账户。
- 不开启 Sandbox 或 live 下单能力。
- 不新增凭据输入、密钥持久化或浏览器密钥暴露。
- 不创建新的执行 store、风险引擎、订单状态机或推测性 Stage 6。
- 不把拥有本地文件系统写权限的人视为独立攻击者；其若同时替换源文件、清单和应用代码，需要外部签名/发布基础设施作为信任根，不在本次本地完整性回读范围内。
