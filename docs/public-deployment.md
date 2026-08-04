# 公网 OIDC、PostgreSQL 与 Caddy 部署

## 上线条件

公网模式面向个人多租户，不提供团队、RBAC、计费或 KYC。只有下列门禁全部通过后才可把域名解析到服务器：

- 固定 OIDC Issuer 可用，callback 精确配置为 `https://<domain>/api/auth/callback`。
- PostgreSQL migration、备份恢复和双用户隔离测试通过。
- Caddy 是唯一公网入口；API 和 PostgreSQL 没有宿主公网端口。
- public 模式的用户 AI、Sandbox 和生产凭据只保存在租户加密设置中。
- Stage 10 重认证、急停、账户隔离和 lease 验收通过。

## 1. 准备 OIDC

在支持标准 OIDC Authorization Code 的身份服务创建 confidential Web Client：

- Redirect URI：`https://research.example.com/api/auth/callback`
- Grant：Authorization Code
- PKCE：S256
- Scope：`openid email profile`

Issuer 必须提供 discovery 和 JWKS。用户首次登录时必须返回稳定 `iss + sub`、邮箱和 `email_verified=true`。

## 2. 配置环境

复制 `.env.example` 为服务器专用 `.env`，至少填写：

```dotenv
AIQT_DEPLOYMENT_MODE=public
AIQT_PUBLIC_ORIGIN=https://research.example.com
AIQT_POSTGRES_PASSWORD=replace-with-long-random-password
AIQT_DATABASE_URL=postgresql+psycopg://aiqt:replace-with-long-random-password@postgres:5432/aiqt
AIQT_OIDC_ISSUER=https://identity.example.com
AIQT_OIDC_CLIENT_ID=aiqt
AIQT_OIDC_CLIENT_SECRET=replace-with-oidc-secret
AIQT_SETTINGS_MASTER_KEY=replace-with-urlsafe-base64-32-byte-key
AIQT_OUTBOUND_ORIGIN_ALLOWLIST=https://api.openai.com,https://approved-provider.example
```

生成主密钥：

```shell
python3 -c 'import base64,secrets; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())'
```

`AIQT_PUBLIC_ORIGIN` 必须是无路径的 HTTPS Origin。不要在 public 环境填写服务器级 OpenAI、OpenAI-compatible、Sandbox 或生产交易凭据；Compose 会显式清空这些变量。

## 3. 构建但暂不开放 DNS

```shell
docker compose -f compose.yaml -f compose.public.yaml config
docker compose -f compose.yaml -f compose.public.yaml build
docker compose -f compose.yaml -f compose.public.yaml up -d --no-build postgres migrate api web
docker compose -f compose.yaml -f compose.public.yaml ps
```

`migrate` 必须成功退出，API 和 Web 必须 healthy。此时先用隔离网络或 hosts 文件验收；不要提前开放防火墙 80/443。

## 4. 迁移本机数据

迁移必须绑定到明确 OIDC 身份。先停止会产生写入的本机 API，然后按顺序运行：

```shell
node tools/run_python.mjs tools/migrate_local_to_public.py inventory \
  --issuer https://identity.example.com \
  --subject oidc-subject \
  --email user@example.com

node tools/run_python.mjs tools/migrate_local_to_public.py dry-run \
  --issuer https://identity.example.com \
  --subject oidc-subject \
  --email user@example.com

node tools/run_python.mjs tools/migrate_local_to_public.py apply \
  --issuer https://identity.example.com \
  --subject oidc-subject \
  --email user@example.com \
  --backup-root /secure/aiqt-backups
```

apply 前会备份整个 `data/`，并在一个 PostgreSQL 事务内写入、校验数量/hash 和回读。相同源重复运行幂等；源内容变化、目标已有其它数据、未决订单、活动实盘会话或未完成对账会阻断。

`--master-key` 只加密 public 租户数据，不会被当成本机旧设置密钥。仅当旧本机设置曾通过环境变量密钥加密时，额外传入 `--source-master-key`（或 `AIQT_SOURCE_SETTINGS_MASTER_KEY`）。

旧生产授权只作为历史审计迁移。public 首次启用仍保持生产暂停，必须重新配置租户密钥并重新认证/授权。

## 5. 安全验收

至少完成：

```shell
npm test
npm run build
git diff --check
```

并在隔离 public 环境验证：

- 未登录 API 为 401，跨站 Origin、伪造 Host、缺 CSRF 和非 JSON 修改请求被拒绝。
- 登录 state/nonce/PKCE、退出、禁用用户、12 小时绝对和 30 分钟空闲会话有效。
- 两个用户创建相同 run/event ID 后仍只能看到自己的记录。
- 设置、研究包、AI、审计、组合、生产密钥、Stage 10 和后台任务全部隔离。
- 生产敏感动作缺最近 5 分钟重认证时返回 428，并能恢复到原页面。
- 桌面和 390px 页面无横向溢出，浏览器控制台无 error/warning。

确认完成后再启动 Caddy 并开放 DNS：

```shell
docker compose -f compose.yaml -f compose.public.yaml up -d --no-build caddy
```

## 限流

默认值：登录/回调每 IP 每 15 分钟 10 次；普通修改每用户每分钟 60 次；AI/选股每用户每小时 10 次；研究包导入每用户每小时 5 次。

可用 `AIQT_RATE_LIMIT_LOGIN_15M`、`AIQT_RATE_LIMIT_MUTATIONS_1M`、`AIQT_RATE_LIMIT_AI_1H`、`AIQT_RATE_LIMIT_IMPORT_1H` 收紧。值不能放宽默认值，登录限流不能关闭。

## 用户禁用

```shell
node tools/run_python.mjs tools/manage_public_user.py disable \
  --owner-id <owner-uuid> \
  --database-url "$AIQT_DATABASE_URL"
```

禁用后新会话和现有会话访问均失败；已有未决订单仍由后台只读对账收口。

## PostgreSQL 备份与恢复

每日执行逻辑备份并将主密钥单独保存在密钥管理系统：

```shell
set -eu
backup_dir="${AIQT_BACKUP_DIR:-/opt/aiquantificationtools/backups}"
install -d -m 700 "$backup_dir"
backup_path="$backup_dir/aiqt-$(date -u +%Y%m%dT%H%M%SZ).dump"
partial_path="$backup_path.partial"
trap 'rm -f -- "$partial_path"' EXIT
umask 077
docker compose -f compose.yaml -f compose.public.yaml exec -T postgres \
  pg_dump -U aiqt -d aiqt -Fc > "$partial_path"
chmod 600 "$partial_path"
mv "$partial_path" "$backup_path"
trap - EXIT
sha256sum "$backup_path"
```

恢复演练必须使用独立临时数据库，不停止或覆盖生产库：

```shell
restore_backup_path="/secure/aiqt-backups/aiqt-YYYYmmddTHHMMSSZ.dump"
docker compose -f compose.yaml -f compose.public.yaml exec -T postgres \
  createdb -U aiqt aiqt_restore_verify
docker compose -f compose.yaml -f compose.public.yaml exec -T postgres \
  pg_restore -U aiqt -d aiqt_restore_verify --exit-on-error < "$restore_backup_path"
docker compose -f compose.yaml -f compose.public.yaml exec -T postgres \
  psql -U aiqt -d aiqt_restore_verify -c 'select version_num from alembic_version'
docker compose -f compose.yaml -f compose.public.yaml exec -T postgres \
  psql -U aiqt -d aiqt -c "select 'public_users' as item, count(*) from public_users union all select 'tenant_records', count(*) from tenant_records union all select 'tenant_settings', count(*) from tenant_settings union all select 'public_sessions', count(*) from public_sessions order by item"
docker compose -f compose.yaml -f compose.public.yaml exec -T postgres \
  psql -U aiqt -d aiqt_restore_verify -c "select 'public_users' as item, count(*) from public_users union all select 'tenant_records', count(*) from tenant_records union all select 'tenant_settings', count(*) from tenant_settings union all select 'public_sessions', count(*) from public_sessions order by item"
docker compose -f compose.yaml -f compose.public.yaml exec -T postgres \
  psql -U aiqt -d aiqt -c "select owner_id, record_kind, record_id, canonical_hash from tenant_records where canonical_hash is not null order by owner_id, record_kind, record_id limit 10"
docker compose -f compose.yaml -f compose.public.yaml exec -T postgres \
  psql -U aiqt -d aiqt_restore_verify -c "select owner_id, record_kind, record_id, canonical_hash from tenant_records where canonical_hash is not null order by owner_id, record_kind, record_id limit 10"
```

人工确认两组数量、租户归属、hash 与 Alembic revision 一致后，再单独删除临时库：

```shell
docker compose -f compose.yaml -f compose.public.yaml exec -T postgres \
  dropdb -U aiqt aiqt_restore_verify
```

删除临时库前校验 Alembic head、用户/记录数量和抽样 canonical hash；真正灾难恢复时还要验证会话失效策略和生产暂停状态。丢失 `AIQT_SETTINGS_MASTER_KEY` 时租户密钥不可恢复；数据库备份不能替代主密钥备份。

每次 API 启动会立即运行一次到期复盘，随后按六小时间隔执行。成功周期和失败详情可从 API 日志检查：

```shell
docker compose -f compose.yaml -f compose.public.yaml logs api \
  | rg 'public background selection review cycle|public background task failed'
```

## 回滚

公网发布失败时停止 Caddy，保留 PostgreSQL 和备份，不把 public 数据反向覆盖 local。修复后重新运行 migration、测试和隔离验收；不要通过放宽 Origin、CSRF、Host、SSRF、租户或 Stage 10 门禁恢复服务。
