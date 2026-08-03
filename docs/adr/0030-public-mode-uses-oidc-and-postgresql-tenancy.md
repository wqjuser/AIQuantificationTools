# 公网模式采用 OIDC 与 PostgreSQL 多租户

## 状态

Accepted

## 背景

早期架构默认本机单操作者、SQLite 和无登录。该假设不能安全承载开放公网注册、多个个人账户、用户密钥和多实例后台任务。

## 决策

保留 `local` 模式及既有 SQLite 数据；新增一次性交付的 `public` 模式。public 使用固定单一 OIDC Issuer 的 Authorization Code + PKCE S256、PostgreSQL、应用会话、严格 Origin/Host/CSRF 和 Caddy HTTPS。

服务端从 OIDC `issuer + subject + verified email` 创建 `TenantContext`。所有用户私有记录以 `(owner_id, 原业务 ID)` 唯一，并通过 `TenantStoreBundle` 复用现有领域 Store 接口。`owner_id` 不进入既有规范制品和 hash。公共行情缓存可以共享，用户密钥和私有上下文不能共享。

平台设置和交易密钥使用主密钥派生的租户 AES-GCM 密钥加密。public 模式禁止回退到服务器环境中的用户 AI、Sandbox 或生产交易凭据。后台到期复盘、自动交易和生产控制使用 PostgreSQL lease。

public 缺少 PostgreSQL、OIDC、HTTPS Origin 或主密钥时拒绝启动；全部迁移、隔离和安全门禁通过前不得开放 Caddy 公网入口。

## 结果

- local 行为和制品可移植性保留。
- public 能允许不同用户拥有相同业务 ID，而不发生跨租户读写。
- 运维必须管理 OIDC、PostgreSQL、TLS、主密钥、备份恢复和 Alembic migration。
- 本 ADR 取代早期 ADR 中“本地单操作者足以作为身份和协调边界”的假设；不改变其领域安全结论。
