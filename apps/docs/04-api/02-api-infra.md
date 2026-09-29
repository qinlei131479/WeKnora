# API 参考：基础设施

注册和管理向量存储、文件存储与网络搜索服务，提供连接测试。

统一约定：读 Viewer+，写/连接测试 Admin+（凭证探测外部系统）。API key capability：向量库 `manage_vector_stores`、存储后端 `manage_storage_backends`、Web 搜索 `manage_web_search`（均可 full-access）。

当前前端交付范围：

- 向量引擎：Elasticsearch、PostgreSQL、Milvus、Qdrant、Weaviate。
- 存储后端：local、MinIO、OSS、COS。
- 搜索提供商：DuckDuckGo、百度、Tavily、Bing。

接口 schema 可能包含内部扩展类型；当前产品部署不提供对应配置入口。

## 向量存储（/api/v1/vector-stores）

### GET /api/v1/vector-stores/types

用途：可用引擎类型与配置 schema。权限：Viewer+。

响应：200 `{"success":true,"data":[类型定义]}`

```bash
curl $BASE/api/v1/vector-stores/types -H "Authorization: Bearer $TOKEN"
```

### POST /api/v1/vector-stores/test

用途：用原始配置测试连接（不落库）。权限：Admin+。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `engine_type` | string | 是（`binding:"required"`） | 引擎类型 |
| `connection_config` | object | 是（`binding:"required"`） | 连接配置 |

响应：200 `{"success":true|false,"version":"...","error":"..."}`

```bash
curl -X POST $BASE/api/v1/vector-stores/test -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"engine_type":"qdrant","connection_config":{"addr":"qdrant:6334"}}'
```

### POST /api/v1/vector-stores

用途：创建向量库配置。权限：Admin+。字段：`name`（必填）、`engine_type`（必填）、`connection_config`（必填）、`index_config`（可选）。

响应：201 `{"success":true,"data":{VectorStoreResponse}}`（`id,tenant_id,name,engine_type,connection_config,index_config,...`）

```bash
curl -X POST $BASE/api/v1/vector-stores -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"qdrant-main","engine_type":"qdrant","connection_config":{"addr":"qdrant:6334"}}'
```

### GET /api/v1/vector-stores

用途：向量库列表（环境变量注入的 `__env_*` store 在前）。权限：Viewer+。

响应：200 `{"success":true,"data":[VectorStoreResponse]}`

```bash
curl $BASE/api/v1/vector-stores -H "Authorization: Bearer $TOKEN"
```

### GET /api/v1/vector-stores/:id

用途：向量库详情（支持 `__env_*` ID）。权限：Viewer+。

响应：200 `{"success":true,"data":{VectorStoreResponse}}`

```bash
curl $BASE/api/v1/vector-stores/vs-1 -H "Authorization: Bearer $TOKEN"
```

### PUT /api/v1/vector-stores/:id

用途：更新（仅重命名；env store 不可改）。权限：Admin+。请求体：`{"name":"..."}`（`binding:"required"`）。

响应：200 `{"success":true,"data":{VectorStoreResponse}}`

```bash
curl -X PUT $BASE/api/v1/vector-stores/vs-1 -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"qdrant-prod"}'
```

### DELETE /api/v1/vector-stores/:id

用途：删除（env store 不可删）。权限：Admin+。

响应：200 `{"success":true}`

```bash
curl -X DELETE $BASE/api/v1/vector-stores/vs-1 -H "Authorization: Bearer $TOKEN"
```

### POST /api/v1/vector-stores/:id/test

用途：测试已保存/env 向量库。权限：Admin+。

响应：200 `{"success":true|false,"version","error"}`

```bash
curl -X POST $BASE/api/v1/vector-stores/vs-1/test -H "Authorization: Bearer $TOKEN"
```

## 存储后端（/api/v1/storage-backends）

请求体（Create/Update/TestRaw 共用 `storageBackendRequest`）：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `name` | string | 是（`binding:"required"`） | 名称 |
| `provider` | string | 是（`binding:"required"`） | 提供方（minio/cos/tos/s3/oss/ks3/obs…） |
| `config` | object | 否 | 提供方配置（响应中凭证掩码） |
| `status` | string | 否 | 状态 |

### GET /api/v1/storage-backends/types

用途：允许的存储类型。权限：Viewer+。响应：200 `{"success":true,"data":[...]}`

```bash
curl $BASE/api/v1/storage-backends/types -H "Authorization: Bearer $TOKEN"
```

### POST /api/v1/storage-backends/test

用途：原始配置连接测试。权限：Admin+。响应：200 `{"success":bool,"error"}`

```bash
curl -X POST $BASE/api/v1/storage-backends/test -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"t","provider":"minio","config":{"endpoint":"minio:9000"}}'
```

### POST /api/v1/storage-backends

用途：创建存储后端。权限：Admin+。响应：201 `{"success":true,"data":{StorageBackend}}`

```bash
curl -X POST $BASE/api/v1/storage-backends -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"minio-main","provider":"minio","config":{"endpoint":"minio:9000"}}'
```

### GET /api/v1/storage-backends

用途：列表（含 `default_storage_backend_id`）。权限：Viewer+。响应：200 `{"success":true,"data":[...],"default_storage_backend_id":"..."}`

```bash
curl $BASE/api/v1/storage-backends -H "Authorization: Bearer $TOKEN"
```

### GET /api/v1/storage-backends/:id

用途：详情（凭证掩码）。权限：Viewer+。响应：200 `{"success":true,"data":{StorageBackend}}`

```bash
curl $BASE/api/v1/storage-backends/sb-1 -H "Authorization: Bearer $TOKEN"
```

### PUT /api/v1/storage-backends/:id

用途：更新。权限：Admin+。响应：200 `{"success":true,"data":{StorageBackend}}`

```bash
curl -X PUT $BASE/api/v1/storage-backends/sb-1 -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"minio-prod","provider":"minio"}'
```

### DELETE /api/v1/storage-backends/:id

用途：删除。权限：Admin+。响应：200 `{"success":true}`

```bash
curl -X DELETE $BASE/api/v1/storage-backends/sb-1 -H "Authorization: Bearer $TOKEN"
```

### POST /api/v1/storage-backends/:id/test

用途：测试已保存后端。权限：Admin+。响应：200 `{"success":bool,"error"}`

```bash
curl -X POST $BASE/api/v1/storage-backends/sb-1/test -H "Authorization: Bearer $TOKEN"
```

### PUT /api/v1/storage-backends/:id/default

用途：设为默认后端。权限：Admin+。响应：200 `{"success":true}`

```bash
curl -X PUT $BASE/api/v1/storage-backends/sb-1/default -H "Authorization: Bearer $TOKEN"
```

## Web 搜索（/api/v1/web-search 与 /api/v1/web-search-providers）

当前注册 13 个搜索提供商，包括 Metaso、Exa、Bocha、Brave。各自的 api_key 与 extra_config 参数见[联网搜索](../03-features/11-web-search.md)。

### GET /api/v1/web-search/providers

用途：内置搜索提供方目录（只读）。权限：Viewer+，仅 JWT（未声明 API key 策略）。Handler: `internal/handler/web_search.go`

响应：200 `{"success":true,"data":[...]}`

```bash
curl $BASE/api/v1/web-search/providers -H "Authorization: Bearer $TOKEN"
```

### GET /api/v1/web-search-providers/types

用途：提供方类型与参数 schema。权限：Viewer+。Handler: `internal/handler/web_search_provider.go`

响应：200 `{"success":true,"data":[...]}`

```bash
curl $BASE/api/v1/web-search-providers/types -H "Authorization: Bearer $TOKEN"
```

### POST /api/v1/web-search-providers/test

用途：原始凭证测试（不落库）。权限：Admin+。请求体：`provider`（`binding:"required"`）、`parameters`（可选）。

响应：200 `{"success":bool,"error"}`

```bash
curl -X POST $BASE/api/v1/web-search-providers/test -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"provider":"tavily","parameters":{"api_key":"tvly-..."}}'
```

### POST /api/v1/web-search-providers

用途：创建提供方配置。权限：Admin+。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `name` | string | 是（`binding:"required"`） | 名称 |
| `provider` | string | 是（`binding:"required"`） | 类型（bing/tavily/google…） |
| `description` | string | 否 | 描述 |
| `parameters` | object | 否 | 参数（api_key 建议走 credentials 子资源） |
| `is_default` | bool | 否 | 默认提供方 |

响应：201 `{"success":true,"data":{WebSearchProviderResponse}}`

```bash
curl -X POST $BASE/api/v1/web-search-providers -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"tavily-main","provider":"tavily"}'
```

### GET /api/v1/web-search-providers

用途：提供方列表。权限：Viewer+。响应：200 `{"success":true,"data":[...]}`

```bash
curl $BASE/api/v1/web-search-providers -H "Authorization: Bearer $TOKEN"
```

### GET /api/v1/web-search-providers/:id

用途：详情。权限：Viewer+。响应：200 `{"success":true,"data":{...}}`

```bash
curl $BASE/api/v1/web-search-providers/wsp-1 -H "Authorization: Bearer $TOKEN"
```

### PUT /api/v1/web-search-providers/:id

用途：更新（空字段保留原值；APIKey 保留）。权限：Admin+。请求体：`name/description/parameters/is_default`（均可选）。

响应：200 `{"success":true,"data":{...}}`

```bash
curl -X PUT $BASE/api/v1/web-search-providers/wsp-1 -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"is_default":true}'
```

### DELETE /api/v1/web-search-providers/:id

用途：删除。权限：Admin+。响应：200 `{"success":true}`

```bash
curl -X DELETE $BASE/api/v1/web-search-providers/wsp-1 -H "Authorization: Bearer $TOKEN"
```

### PUT /api/v1/web-search-providers/:id/credentials

用途：设置 API key（`{"api_key":"..."}`，省略时返回状态）。权限：Admin+。Handler: `internal/handler/web_search_provider_credentials.go`

响应：200 `{"success":true,"data":{"fields":{"api_key":{"configured":bool}}}}`

```bash
curl -X PUT $BASE/api/v1/web-search-providers/wsp-1/credentials -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"api_key":"tvly-..."}'
```

### DELETE /api/v1/web-search-providers/:id/credentials/:field

用途：删除凭证字段（`field` 仅 `api_key`）。权限：Admin+。响应：204。

```bash
curl -X DELETE $BASE/api/v1/web-search-providers/wsp-1/credentials/api_key -H "Authorization: Bearer $TOKEN"
```

### POST /api/v1/web-search-providers/:id/test

用途：测试已保存提供方。权限：Admin+。响应：200 `{"success":bool,"error"}`

```bash
curl -X POST $BASE/api/v1/web-search-providers/wsp-1/test -H "Authorization: Bearer $TOKEN"
```

## 实现参考

企业入口在 `apps/app-core/router` 注册向量存储、存储后端与 Web 搜索路由；对应 handler 位于 `apps/app-core/handler`。新增接口时先确认当前前端是否提供入口，再同步本页字段、权限与错误形态。
