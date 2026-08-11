# 公网自托管认证、PostgreSQL 与 Caddy 部署

## 上线条件

公网模式面向个人多租户，不提供团队、RBAC、计费或 KYC。只有下列门禁全部通过后才可把域名解析到服务器：

- `AIQT_PUBLIC_ORIGIN` 与独立的 `AIQT_AUTH_ORIGIN` 均已配置国内可达的 DNS/TLS。
- 自托管 Keycloak `aiqt` realm 可用，callback 精确为 `${AIQT_PUBLIC_ORIGIN}/api/auth/callback`。
- 若启用公网 MCP，同一 issuer 必须能为 `https://<domain>/mcp` 签发 audience-bound access token，并支持 `aiqt:research:read`。
- PostgreSQL migration、备份恢复和双用户隔离测试通过。
- Caddy 是唯一公网入口；API 和 PostgreSQL 没有宿主公网端口。
- public 模式的用户 AI、Sandbox 和生产凭据只保存在租户加密设置中。
- Stage 10 重认证、急停、账户隔离和 lease 验收通过。

## 1. 配置环境

以仅 owner 可读写的权限创建服务器专用 `.env`，再填写：

```shell
install -m 600 .env.example .env
test "$(stat -c '%a' .env)" = 600
```

至少配置以下值：

```dotenv
AIQT_DEPLOYMENT_MODE=public
AIQT_PUBLIC_ORIGIN=https://research.example.com
AIQT_AUTH_ORIGIN=https://auth.example.com
AIQT_POSTGRES_PASSWORD=replace-with-long-random-password
AIQT_DATABASE_URL=postgresql+psycopg://aiqt:replace-with-long-random-password@postgres:5432/aiqt
AIQT_KEYCLOAK_DATABASE_PASSWORD=replace-with-another-long-random-password
# 仅首次启动使用；建立永久管理员并删除临时账号后从 .env 删除。
AIQT_KEYCLOAK_BOOTSTRAP_ADMIN_USERNAME=aiqt-bootstrap-admin
AIQT_KEYCLOAK_BOOTSTRAP_ADMIN_PASSWORD=replace-with-one-time-bootstrap-password
AIQT_KEYCLOAK_WEB_CLIENT_SECRET=replace-with-random-web-client-secret
AIQT_SETTINGS_MASTER_KEY=replace-with-urlsafe-base64-32-byte-key
AIQT_OUTBOUND_ORIGIN_ALLOWLIST=https://api.openai.com,https://approved-provider.example
AIQT_MCP_PUBLIC_RESOURCE_URL=https://research.example.com/mcp
AIQT_MCP_RATE_LIMIT_REQUESTS_1M=120
```

生成主密钥：

```shell
python3 -c 'import base64,secrets; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())'
```

两个 Origin 都必须是无路径 HTTPS Origin，且不能相同。public Compose 会把 API/MCP 的 issuer 固定为 `${AIQT_AUTH_ORIGIN}/realms/aiqt`，不会读取 Google 或其它第三方 client 配置。不要在 public 环境填写服务器级 OpenAI、OpenAI-compatible、Sandbox 或生产交易凭据；Compose 会显式清空这些变量。`.env` 不得写入 Git、终端输出、CI 日志或工单；每次部署前都要重新验证它仍是 `0600`。

## 2. 准备自托管 Keycloak

public Compose 会启动固定版本的 Keycloak 和独立 `keycloak-postgres`，两者都不发布宿主端口。Caddy 使用第二个 HTTPS Origin 代理公开认证端点，例如：

```text
工作台与 MCP  https://research.example.com
本站认证      https://auth.example.com
OIDC issuer   https://auth.example.com/realms/aiqt
```

提交的 realm bootstrap 固定以下边界：

- `aiqt-web` 是 confidential Web client，只启用 Authorization Code，callback 精确为 `${AIQT_PUBLIC_ORIGIN}/api/auth/callback`，强制 PKCE S256；
- `aiqt-mcp` 是 public client，只启用 Authorization Code + PKCE，Direct Access Grant 与 Implicit Flow 关闭；
- optional scope `aiqt:research:read` 的 Audience mapper 只给 MCP access token 添加 `${AIQT_PUBLIC_ORIGIN}/mcp`；
- 自助注册关闭，账号由后台管理员创建并将邮箱标记为已验证；
- 内建 `admin-cli` 明确禁用，realm 中不存在可用的用户名密码 token grant；
- Caddy 不暴露 Keycloak `/admin`、master realm、health 或 management port。

Keycloak 当前不能完整消费 MCP/RFC 8707 的 `resource` 参数。本部署采用其官方单 resource 兼容方案：客户端请求 `aiqt:research:read`，Audience mapper 固定签出 `aud=${AIQT_PUBLIC_ORIGIN}/mcp`，而本站 MCP 仍精确校验该 audience。它不能被描述为多 resource 的完整 RFC 8707 Authorization Server。

首次启动时，`AIQT_KEYCLOAK_BOOTSTRAP_ADMIN_*` 只创建一次性临时 super-admin。它们只存在于额外的 bootstrap overlay；稳态 Compose 完全不向 Keycloak 传这两个键：

```shell
docker compose -f compose.yaml -f compose.public.yaml \
  -f compose.keycloak-bootstrap.yaml up -d \
  keycloak-postgres keycloak-schema keycloak
```

Keycloak healthy 后，通过服务器终端进入容器，不要开放公网管理控制台：

```shell
docker compose -f compose.yaml -f compose.public.yaml exec keycloak \
  sh -lc 'exec /opt/keycloak/bin/kcadm.sh config credentials \
  --server http://127.0.0.1:8080 --realm master \
  --user "$KC_BOOTSTRAP_ADMIN_USERNAME"'

# 创建永久管理身份；两个 password 命令都在终端安全提示输入，不把密码写进参数。
docker compose -f compose.yaml -f compose.public.yaml exec keycloak \
  /opt/keycloak/bin/kcadm.sh create users -r master \
  -s username=aiqt-admin-ops -s enabled=true

docker compose -f compose.yaml -f compose.public.yaml exec keycloak \
  /opt/keycloak/bin/kcadm.sh set-password -r master \
  --username aiqt-admin-ops

docker compose -f compose.yaml -f compose.public.yaml exec keycloak \
  /opt/keycloak/bin/kcadm.sh add-roles -r master \
  --uusername aiqt-admin-ops --cclientid aiqt-realm \
  --rolename manage-users --rolename query-users --rolename view-users \
  --rolename manage-clients --rolename query-clients --rolename view-clients \
  --rolename view-realm --rolename manage-realm

# 使用独立 CLI 配置重新以永久管理员登录，并验证它可以管理 aiqt realm。
docker compose -f compose.yaml -f compose.public.yaml exec keycloak \
  /opt/keycloak/bin/kcadm.sh config credentials \
  --config /tmp/aiqt-ops-kcadm.config \
  --server http://127.0.0.1:8080 --realm master --user aiqt-admin-ops

docker compose -f compose.yaml -f compose.public.yaml exec keycloak \
  /opt/keycloak/bin/kcadm.sh get users -r aiqt \
  --config /tmp/aiqt-ops-kcadm.config --fields id,username

# 业务账号只由受限的 aiqt realm 管理员创建；密码通过交互提示输入。
docker compose -f compose.yaml -f compose.public.yaml exec keycloak \
  /opt/keycloak/bin/kcadm.sh create users -r aiqt \
  --config /tmp/aiqt-ops-kcadm.config \
  -s username=operator -s email=operator@example.com \
  -s 'firstName=<given-name>' -s 'lastName=<family-name>' \
  -s enabled=true -s emailVerified=true

docker compose -f compose.yaml -f compose.public.yaml exec keycloak \
  /opt/keycloak/bin/kcadm.sh set-password -r aiqt \
  --config /tmp/aiqt-ops-kcadm.config --username operator --temporary

# 默认 CLI 配置仍是临时管理员；用它查询并删除该临时账号。
docker compose -f compose.yaml -f compose.public.yaml exec keycloak \
  sh -lc 'exec /opt/keycloak/bin/kcadm.sh get users -r master \
  -q "username=$KC_BOOTSTRAP_ADMIN_USERNAME" --fields id,username'

docker compose -f compose.yaml -f compose.public.yaml exec keycloak \
  /opt/keycloak/bin/kcadm.sh delete users/<bootstrap-user-uuid> -r master

# 删除临时账号后，从服务器 .env 删除两个 AIQT_KEYCLOAK_BOOTSTRAP_ADMIN_*
# 键，并清除容器内短期 CLI token。后续启动绝不能再加载 bootstrap overlay。
docker compose -f compose.yaml -f compose.public.yaml exec keycloak \
  rm -f /opt/keycloak/.keycloak/kcadm.config /tmp/aiqt-ops-kcadm.config

docker compose -f compose.yaml -f compose.public.yaml up -d \
  --force-recreate keycloak
```

永久管理员只持有 `aiqt-realm` 的用户、客户端和 realm 管理角色，不持有 master 全局 `admin`；它已通过实机命令验证能创建业务用户、更新 `aiqt-mcp` client 和维护 `aiqt` realm 安全策略。永久管理员凭据只进入独立密钥管理系统，不保留在 Compose 环境；临时 bootstrap 管理员不得继续存在。业务用户首次登录必须更换临时密码。任何密码都不得写入 Git、命令历史、Compose 文件或工单。realm import 只用于新数据库 bootstrap；已有 realm 的安全策略和 client secret 变更必须通过受控管理命令应用并备份。

`aiqt-mcp` 的 bootstrap redirect URI 刻意为空：项目不知道你要接入哪一个 AI，不能提交通配 HTTPS callback。接入前先从目标 AI 平台取得精确 OAuth callback，再由管理员更新这个预注册 public client：

```shell
docker compose -f compose.yaml -f compose.public.yaml exec keycloak \
  /opt/keycloak/bin/kcadm.sh config credentials \
  --config /tmp/aiqt-ops-kcadm.config \
  --server http://127.0.0.1:8080 --realm master --user aiqt-admin-ops

docker compose -f compose.yaml -f compose.public.yaml exec keycloak \
  /opt/keycloak/bin/kcadm.sh get clients -r aiqt -q clientId=aiqt-mcp \
  --config /tmp/aiqt-ops-kcadm.config --fields id,clientId,redirectUris

docker compose -f compose.yaml -f compose.public.yaml exec keycloak \
  /opt/keycloak/bin/kcadm.sh update clients/<internal-client-uuid> -r aiqt \
  --config /tmp/aiqt-ops-kcadm.config \
  -s 'redirectUris=["https://ai-platform.example/exact/oauth/callback"]'

docker compose -f compose.yaml -f compose.public.yaml exec keycloak \
  rm -f /tmp/aiqt-ops-kcadm.config
```

桌面/CLI 客户端若使用 loopback callback，也必须登记它实际要求的 URI；不要以 `*` 代替未知域名或开启匿名 Dynamic Client Registration。

## 3. 构建内部服务，暂不启动公网入口

```shell
docker compose -f compose.yaml -f compose.public.yaml config --quiet
docker compose -f compose.yaml -f compose.public.yaml build
docker compose -f compose.yaml -f compose.public.yaml up -d --no-build \
  postgres keycloak-postgres keycloak migrate api web mcp
docker compose -f compose.yaml -f compose.public.yaml ps
```

`migrate` 必须成功退出，Keycloak、API、Web 和 MCP 必须 healthy。Keycloak、API、Web、MCP 与两个 PostgreSQL 都不发布宿主公网端口。此阶段只能完成容器内健康与离线测试；OIDC issuer 和 MCP resource 都是 HTTPS 公网 Origin，完整浏览器/OAuth 验收必须等第 5 节启动 Caddy 后进行，不能在这里声称已经验收。

## 4. 迁移本机数据

迁移必须绑定到明确 OIDC 身份。先停止会产生写入的本机 API，然后按顺序运行：

```shell
docker compose -f compose.yaml -f compose.public.yaml run --rm --no-deps api \
  python tools/migrate_local_to_public.py inventory \
  --issuer https://auth.example.com/realms/aiqt \
  --subject oidc-subject \
  --email user@example.com

docker compose -f compose.yaml -f compose.public.yaml run --rm --no-deps api \
  python tools/migrate_local_to_public.py dry-run \
  --issuer https://auth.example.com/realms/aiqt \
  --subject oidc-subject \
  --email user@example.com

install -d -m 700 /secure/aiqt-migration-backups
docker compose -f compose.yaml -f compose.public.yaml run --rm --no-deps \
  -v /secure/aiqt-migration-backups:/secure/aiqt-migration-backups \
  api python tools/migrate_local_to_public.py apply \
  --issuer https://auth.example.com/realms/aiqt \
  --subject oidc-subject \
  --email user@example.com \
  --backup-root /secure/aiqt-migration-backups
```

apply 前会备份整个 `data/`，并在一个 PostgreSQL 事务内写入、校验数量/hash 和回读。相同源重复运行幂等；源内容变化、目标已有其它数据、未决订单、活动实盘会话或未完成对账会阻断。

`--master-key` 只加密 public 租户数据，不会被当成本机旧设置密钥。仅当旧本机设置曾通过环境变量密钥加密时，额外传入 `--source-master-key`（或 `AIQT_SOURCE_SETTINGS_MASTER_KEY`）。

### 从旧 Google 身份保留原租户

旧 Google `iss + sub` 与 Keycloak 身份完全不同，不能按邮箱合并。若已有 public 数据，必须在维护窗口执行以下顺序：

1. 停止 API/MCP 或至少阻止新登录；
2. 在 Keycloak 创建用户，取得该用户不可变 UUID（它就是 token `sub`），但不要先让用户登录工作台；
3. 查明现有 `public_users.owner_id`、旧 issuer 和旧 subject；
4. 原子重绑并撤销旧应用会话；
5. 再开放 Keycloak 登录，验证相同 `owner_id` 能回读原租户数据。

```shell
docker compose -f compose.yaml -f compose.public.yaml run --rm --no-deps api \
  python tools/manage_public_user.py rebind-identity \
  --owner-id <existing-owner-uuid> \
  --expected-issuer https://accounts.google.com \
  --expected-subject <old-google-sub> \
  --issuer https://auth.example.com/realms/aiqt \
  --subject <keycloak-user-uuid> \
  --email user@example.com
```

该操作以 `owner_id + expected issuer + expected subject` 做失败关闭比较，目标身份冲突时不写入；成功后 `owner_id` 及所有业务外键保持不变，旧会话和短期 OIDC transaction 被撤销。若用户先用 Keycloak 登录，系统会正确地把它当作一个新身份并创建空租户，因此不要颠倒顺序。

旧生产授权只作为历史审计迁移。public 首次启用仍保持生产暂停，必须重新配置租户密钥并重新认证/授权。

## 5. 安全验收

至少完成：

```shell
npm test
npm run build
git diff --check
```

完整 OIDC/MCP 验收必须经过 Caddy 的真实 TLS Origin。安排受控上线窗口，先保持真实业务账号禁用且只创建不含生产数据的验收账号，再将两个 DNS Origin 指向服务器并启动唯一公网入口；80/443 需要能完成 ACME 证书签发：

```shell
docker compose -f compose.yaml -f compose.public.yaml up -d --no-build caddy
docker compose -f compose.yaml -f compose.public.yaml ps
```

此时立即在受控公网环境验证：

- 未登录 API 为 401，跨站 Origin、伪造 Host、缺 CSRF 和非 JSON 修改请求被拒绝。
- 自助注册、Direct Access Grant、Implicit Flow、公开管理 API 和匿名 DCR 不可用。
- 登录 state/nonce/PKCE、退出、禁用用户、12 小时绝对和 30 分钟空闲会话有效；普通登录和重新认证都必须强制登录并拒绝旧 `auth_time`，应用退出必须继续命中 Keycloak `end_session_endpoint` 且旧 SSO Cookie 不能静默恢复账号。
- 两个用户创建相同 run/event ID 后仍只能看到自己的记录。
- 公网 MCP 无 token、坏签名、错 issuer/audience、过期 token 为 401；缺 read scope 为 403；Protected Resource Metadata 无需认证。
- 两个 MCP token 并发读取相同 run ID 仍严格隔离；发现结果只有八个只读工具，且没有任何写入、promotion、绑定或交易工具。
- MCP 伪造 Host 返回 421、伪造 Origin 返回 403；token 中的 owner/email/operator 不影响租户映射。
- 设置、研究包、AI、审计、组合、生产密钥、Stage 10 和后台任务全部隔离。
- 生产敏感动作缺最近 5 分钟重认证时返回 428，并能恢复到原页面。
- 桌面和 390px 页面无横向溢出，浏览器控制台无 error/warning。

任一门禁失败就立即停止 Caddy、回滚 DNS 并保持真实账号禁用；全部通过后才启用真实业务账号并向用户公布入口。

开放后先验证 OAuth challenge 和 metadata：

```shell
curl -i https://research.example.com/.well-known/oauth-protected-resource/mcp
curl -i -X POST https://research.example.com/mcp \
  -H 'Content-Type: application/json' \
  --data '{}'
```

第一条必须返回 resource=`https://research.example.com/mcp`、正确 issuer 和 `aiqt:research:read`；第二条必须返回 401 且 `WWW-Authenticate` 带同一 metadata URL。随后再用支持 OAuth 的官方 MCP Client 完成授权并读取工具列表；不要把 access token 写入命令历史或日志。

## 限流

默认值：登录/回调每 IP 每 15 分钟 10 次；普通修改每用户每分钟 60 次；AI/选股每用户每小时 10 次；研究包导入每用户每小时 5 次。

公网 MCP 的 `initialize` / `tools/call` / `resources/read` 默认每租户每分钟合计 120 次，通过 `AIQT_MCP_RATE_LIMIT_REQUESTS_1M` 只能收紧；工具与 Resource 发现不消耗该额度。公网使用无状态 HTTP，不累积 SDK session。

可用 `AIQT_RATE_LIMIT_LOGIN_15M`、`AIQT_RATE_LIMIT_MUTATIONS_1M`、`AIQT_RATE_LIMIT_AI_1H`、`AIQT_RATE_LIMIT_IMPORT_1H` 收紧。值不能放宽默认值，登录限流不能关闭。

## 用户禁用

```shell
docker compose -f compose.yaml -f compose.public.yaml run --rm --no-deps api \
  python tools/manage_public_user.py disable \
  --owner-id <owner-uuid>
```

禁用后新会话和现有会话访问均失败；已有未决订单仍由后台只读对账收口。

## PostgreSQL 备份与恢复

生产 PostgreSQL 数据目录、WAL/redo 与宿主卷首先必须位于静态加密的块设备或云盘；普通 Compose named volume 本身不提供这项保证，未验收底层加密就不能上线。每日再把应用 PostgreSQL 与 Keycloak PostgreSQL 作为同一个一致性备份集。备份窗口先停止所有写入服务；备份流必须在落盘前加密，接收方私钥、`AIQT_SETTINGS_MASTER_KEY` 与永久 Keycloak 管理凭据分别保存在密钥管理系统。一次性 bootstrap 凭据在临时账号删除后不得继续保存或复用。两份数据库共同定义租户身份，不能只恢复其中一份，也不能从不同时间点拼接：

```shell
set -euo pipefail
: "${AIQT_BACKUP_AGE_RECIPIENT:?set an age recipient stored outside this host}"
command -v age >/dev/null
backup_dir="${AIQT_BACKUP_DIR:-/opt/aiquantificationtools/backups}"
install -d -m 700 "$backup_dir"
backup_set_id="$(date -u +%Y%m%dT%H%M%SZ)"
backup_path="$backup_dir/aiqt-$backup_set_id.dump.age"
keycloak_backup_path="$backup_dir/keycloak-$backup_set_id.dump.age"
partial_path="$backup_path.partial"
keycloak_partial_path="$keycloak_backup_path.partial"
restart_public_services() {
  docker compose -f compose.yaml -f compose.public.yaml up -d --no-build \
    keycloak api web mcp caddy >/dev/null
}
trap 'rm -f -- "$partial_path" "$keycloak_partial_path"; restart_public_services' EXIT INT TERM
umask 077

# 在同一维护窗口冻结两个身份相关数据库的所有写入。
docker compose -f compose.yaml -f compose.public.yaml stop \
  caddy api web mcp keycloak

docker compose -f compose.yaml -f compose.public.yaml exec -T postgres \
  pg_dump -U aiqt -d aiqt -Fc \
  | age -r "$AIQT_BACKUP_AGE_RECIPIENT" > "$partial_path"
chmod 600 "$partial_path"
mv "$partial_path" "$backup_path"

docker compose -f compose.yaml -f compose.public.yaml exec -T keycloak-postgres \
  pg_dump -U keycloak -d keycloak -Fc \
  | age -r "$AIQT_BACKUP_AGE_RECIPIENT" > "$keycloak_partial_path"
chmod 600 "$keycloak_partial_path"
mv "$keycloak_partial_path" "$keycloak_backup_path"

sha256sum "$backup_path" "$keycloak_backup_path" \
  > "$backup_dir/$backup_set_id.sha256"
chmod 600 "$backup_dir/$backup_set_id.sha256"

restart_public_services
trap - EXIT INT TERM
```

加密文件、校验清单与 `backup_set_id` 必须一起复制到独立主机或独立对象存储故障域，并在异机校验 checksum 成功后才算备份完成；生产卷、本机 `/opt` 目录或同一云盘上的副本都不算灾备。禁止在未加密文件系统、对象存储或临时目录留下 `.dump` 明文。恢复私钥文件必须为 `0600`，且不能与备份密文保存在同一主机或同一凭据域。

应用数据库恢复演练必须使用独立临时数据库，不停止或覆盖生产库：

```shell
restore_backup_path="/secure/aiqt-backups/aiqt-YYYYmmddTHHMMSSZ.dump.age"
: "${AIQT_BACKUP_AGE_IDENTITY_FILE:?set the offline restore identity path}"
test "$(stat -c '%a' "$AIQT_BACKUP_AGE_IDENTITY_FILE")" = 600
docker compose -f compose.yaml -f compose.public.yaml exec -T postgres \
  createdb -U aiqt aiqt_restore_verify
age --decrypt -i "$AIQT_BACKUP_AGE_IDENTITY_FILE" "$restore_backup_path" \
  | docker compose -f compose.yaml -f compose.public.yaml exec -T postgres \
    pg_restore -U aiqt -d aiqt_restore_verify --exit-on-error
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

人工确认两组数量、租户归属、hash 与 Alembic revision 一致；暂时保留应用恢复库，后面还要与同一备份集的 Keycloak 用户 UUID 做交叉核对。

同一 `backup_set_id` 的 Keycloak 密文必须恢复到独立数据库，并以当前固定的 Keycloak 26.7 镜像实际启动，不能只做 `pg_restore` 成功断言：

```shell
keycloak_restore_backup_path="/secure/aiqt-backups/keycloak-YYYYmmddTHHMMSSZ.dump.age"
docker compose -f compose.yaml -f compose.public.yaml exec -T keycloak-postgres \
  createdb -U keycloak keycloak_restore_verify
age --decrypt -i "$AIQT_BACKUP_AGE_IDENTITY_FILE" "$keycloak_restore_backup_path" \
  | docker compose -f compose.yaml -f compose.public.yaml exec -T keycloak-postgres \
    pg_restore -U keycloak -d keycloak_restore_verify --exit-on-error

docker compose -f compose.yaml -f compose.public.yaml run -d \
  --name aiqt-keycloak-restore-verify --no-deps \
  -e KC_DB_URL=jdbc:postgresql://keycloak-postgres:5432/keycloak_restore_verify \
  keycloak start --http-port=18080 --hostname-strict=false

# 必须等待该临时容器 healthy，再核对 realm、稳定 user UUID、client 与 mapper。
docker inspect -f '{{.State.Health.Status}}' aiqt-keycloak-restore-verify
docker compose -f compose.yaml -f compose.public.yaml exec -T keycloak-postgres \
  psql -U keycloak -d keycloak_restore_verify -c \
  "select id,name,enabled from keycloak.realm where name='aiqt'"
docker compose -f compose.yaml -f compose.public.yaml exec -T keycloak-postgres \
  psql -U keycloak -d keycloak_restore_verify -c \
  "select client_id,enabled from keycloak.client where realm_id=(select id from keycloak.realm where name='aiqt') and client_id in ('aiqt-web','aiqt-mcp') order by client_id"
docker compose -f compose.yaml -f compose.public.yaml exec -T keycloak-postgres \
  psql -U keycloak -d keycloak_restore_verify -c \
  "select id,username from keycloak.user_entity where realm_id=(select id from keycloak.realm where name='aiqt') order by id"
```

在删除临时容器和数据库前，逐项核对应用恢复库的 Alembic head、用户/记录数量、抽样 canonical hash，以及 Keycloak 用户 UUID 与同一备份集 `public_users.subject` 的对应关系。上面的命令只证明密文可解、schema 可恢复且固定 Keycloak 镜像能启动，不等同于完整 OAuth 验收；完整灾备演练还必须用独立测试 Origin 和隔离 Compose project 同时连接这两份恢复库，再重复第 5 节的 callback、MCP audience mapper 与 RP logout 验收，且绝不能把测试 Caddy 指向生产域名。全部证据保存后再清理：

```shell
docker rm -f aiqt-keycloak-restore-verify
docker compose -f compose.yaml -f compose.public.yaml exec -T postgres \
  dropdb -U aiqt aiqt_restore_verify
docker compose -f compose.yaml -f compose.public.yaml exec -T keycloak-postgres \
  dropdb -U keycloak keycloak_restore_verify
```

真正灾难恢复时还要撤销恢复出的旧会话，并验证生产执行仍暂停。丢失 `AIQT_SETTINGS_MASTER_KEY` 时租户密钥不可恢复；丢失 Keycloak 数据库时稳定 `sub` 不可恢复；数据库备份不能替代主密钥或认证凭据备份。

每次 API 启动会立即运行一次到期复盘，随后按六小时间隔执行。成功周期和失败详情可从 API 日志检查：

```shell
docker compose -f compose.yaml -f compose.public.yaml logs api \
  | rg 'public background selection review cycle|public background task failed'
```

## 回滚

公网发布失败时停止 Caddy，保留应用与 Keycloak PostgreSQL 和备份，不把 public 数据反向覆盖 local，也不要重建 realm/user 造成 `sub` 漂移。修复后重新运行 migration、测试和隔离验收；不要通过放宽 Origin、CSRF、Host、SSRF、租户或 Stage 10 门禁恢复服务。
