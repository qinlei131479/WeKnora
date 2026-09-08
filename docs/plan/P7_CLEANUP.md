# P7 最终清理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在测试环境已升到 KJSC 6 且冒烟通过的前提下，删掉 P7 留下的 remap 脚本、未挂载路由、以及原生 KB / 图谱 / 评测 / 部门 / OIDC / CLI 死代码，不改正在跑的 WeKnora 登录与 WeKnora 知识库路径。

**Architecture:** 按「叶子 → 引用 → 运行时」三波清理。第一波只删一次性脚本；第二波删未 `include_router` 的模块及其测试；第三波先把仍被 `knowledge_router` / 前端挂住的死接口拆掉，再删实现。禁止 `migrate down`，回滚只靠升级前的 `agent-middle` dump。

**Tech Stack:** agent-harness（FastAPI / SQLAlchemy）、apps/frontend harness Vue、pytest、已落地的 KJSC `000006`。

**前置（不要动）：**

- 测试库 `agent-middle` 已是 `schema_migrations_kjsc.version = 6`，服务正常。
- 登录：WeKnora `POST /api/v1/auth/login`；harness `POST /api/auth/login`、`POST /api/auth/token` 保留。
- JWT 只用 `JWT_SECRET`。用户 UUID：`98e324c7-8d86-4550-a4c2-cfca9e0d42b6`。
- 长期保留：`apps/agent-harness/scripts/docker-env.py`。
- 不要删 Go 侧租户 API Key / WeKnora 官方图谱设置（`apps/frontend/src/views/knowledge/settings/GraphSettings.vue` 等）。那是另一套产品，不是 harness 原生 KB。

**对应规格：** `docs/plan/P7_TEST_ENV_UPGRADE.md` 第 8 节。本文件是升级完成后的执行计划。

---

## File map

| 波次 | 删 / 改 | 职责 |
| --- | --- | --- |
| 1 | `apps/agent-harness/scripts/p1_*.py` / `p1_*.sql` | 升级一次性 remap，运行时不引用 |
| 2 | `auth_dept_router.py`、`knowledge_eval_router.py`、`graph_router.py`、`external_kb_router.py` | 未挂载路由 |
| 2 | `oidc_service.py`、`auth_service.py`、`department_repository.py` | 无调用方或仅被未挂载路由引用 |
| 3 | `knowledge_router.py` 的 `graph-build` / `POST /databases` | 仍挂在 `/api` 上的死接口，挡住删 `knowledge/graphs/` |
| 3 | `package/yuxi/knowledge/graphs/`、`eval/`、`implementations/{milvus,dify,notion}.py` | 原生 KB / 图谱 / 评测实现 |
| 3 | harness 前端 Graph / RAG eval / department / OIDC 入口 | 页面还在调已 404 的接口 |
| 4 | `auth_utils.py` 的 `JWT_SECRET_KEY`、`system_router` CLI discovery | 身份已统一后的残留配置 |
| 5 | yuxi OCR parser + `config/options.py` OCR 项 | `is_weknora_kb_enabled()` 已写死 True，解析走 WeKnora；本波最后做 |

---

### Task 1: 删除 uid remap 一次性脚本

**Files:**
- Delete: `apps/agent-harness/scripts/p1_identity_candidates.py`
- Delete: `apps/agent-harness/scripts/p1_uid_remap.sql`
- Delete: `apps/agent-harness/scripts/p1_uid_remap_reverse.sql`
- Modify: `docs/plan/P7_TEST_ENV_UPGRADE.md`（脚本路径改为「已删除，回滚用 dump」）

仓库内除 P7 文档外，没有 Python/Go 引用这三个文件。

- [ ] **Step 1: 确认测试环境不再需要 remap**

测试库已跑过 `000006`。`h_users` / `h_user_identity_map` 不存在，整份 `p1_uid_remap.sql` 不可再执行。回滚只用 dump，不用 reverse SQL。

Run:

```bash
ls apps/agent-harness/scripts/p1_identity_candidates.py \
   apps/agent-harness/scripts/p1_uid_remap.sql \
   apps/agent-harness/scripts/p1_uid_remap_reverse.sql
```

Expected: 三个文件都在。

- [ ] **Step 2: 删除三个脚本**

```bash
rm apps/agent-harness/scripts/p1_identity_candidates.py \
   apps/agent-harness/scripts/p1_uid_remap.sql \
   apps/agent-harness/scripts/p1_uid_remap_reverse.sql
```

- [ ] **Step 3: 改 P7 文档里的脚本路径**

把 `docs/plan/P7_TEST_ENV_UPGRADE.md` 第 2.1 / 第 6 / 第 8 节中「执行 `p1_uid_remap.sql`」改成：脚本已删除；历史 remap 不可重复；回滚只用第 1 节 dump。第 8 节「等升级完成后再执行」三行脚本改为「已纳入 `docs/plan/P7_CLEANUP.md`」。

- [ ] **Step 4: 确认仓库不再引用文件名**

```bash
rg -n "p1_uid_remap|p1_identity_candidates" --glob '!docs/plan/P7_CLEANUP.md' --glob '!docs/plan/P7_TEST_ENV_UPGRADE.md'
```

Expected: 无匹配（P7 升级文档里允许保留「已删除」说明）。

- [ ] **Step 5: Commit**

```bash
git add apps/agent-harness/scripts docs/plan/P7_TEST_ENV_UPGRADE.md
git commit -m "$(cat <<'EOF'
chore: remove P7 uid remap one-shot scripts

Test env is already on KJSC 6; remap SQL cannot run after DROP, and rollback is dump-only.
EOF
)"
```

---

### Task 2: 先锁「未挂载路由必须 404」，再删路由文件

**Files:**
- Modify: `apps/agent-harness/test/unit/p1/test_local_login.py`（已有 OIDC/CLI 404，补部门 / eval / graph / external）
- Create: `apps/agent-harness/test/unit/routers/test_p7_removed_routes.py`
- Delete: `apps/agent-harness/server/routers/auth_dept_router.py`
- Delete: `apps/agent-harness/server/routers/knowledge_eval_router.py`
- Delete: `apps/agent-harness/server/routers/graph_router.py`
- Delete: `apps/agent-harness/server/routers/external_kb_router.py`
- Modify: `apps/agent-harness/test/unit/server/test_auth_password_validation.py`
- Modify: `apps/agent-harness/test/integration/api/test_knowledge_external_router.py`（改为断言 404，或删除该文件）
- Modify: `apps/agent-harness/test/integration/conftest.py`（去掉 `check-first-run` bootstrap，若仍在调用）

`server/routers/__init__.py` 已经不 `include_router` 这四个文件。删文件前必须先改还在 `import` 它们的测试。

- [ ] **Step 1: 写失败测试（路由文件还在时，测试应断言完整 app 上这些路径 404）**

Create `apps/agent-harness/test/unit/routers/test_p7_removed_routes.py`:

```python
from __future__ import annotations

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from server.routers import router

pytestmark = [pytest.mark.unit, pytest.mark.asyncio]


REMOVED = [
    ("GET", "/api/auth/check-first-run"),
    ("POST", "/api/auth/initialize"),
    ("GET", "/api/auth/oidc/config"),
    ("POST", "/api/auth/cli/sessions"),
    ("GET", "/api/departments"),
    ("GET", "/api/user/apikey/"),
    ("GET", "/api/evaluation/databases/kb_1/datasets"),
    ("GET", "/api/graph/kb_1"),
    ("GET", "/api/knowledge/databases/external"),
]


@pytest.mark.parametrize("method,path", REMOVED)
async def test_p7_removed_capability_routes_are_404(method: str, path: str):
    app = FastAPI()
    app.include_router(router, prefix="/api")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.request(method, path)
    assert response.status_code == 404, (path, response.status_code, response.text)
```

- [ ] **Step 2: 跑新测试，确认未挂载路径已经是 404**

Run:

```bash
cd apps/agent-harness && python -m pytest test/unit/routers/test_p7_removed_routes.py -q
```

Expected: PASS（路由本来就没挂）。若 `GET /api/knowledge/databases/external` 不是 404，说明它被别的 router 挂了——先查 `knowledge_router.py` 再决定是改测试路径还是先做 Task 4。

- [ ] **Step 3: 改掉仍 import 死路由的测试**

`test/unit/server/test_auth_password_validation.py` 现在 import `DepartmentCreate`、`InitializeAdmin`、`UserCreate`、`UserUpdate`，后三个在 `auth_router.py` 里已经不存在。整文件改成只测还活着的 `LoginBody` 密码长度：

```python
import pytest
from pydantic import ValidationError

from server.routers.auth_router import LoginBody


def test_login_body_rejects_short_password():
    with pytest.raises(ValidationError) as exc_info:
        LoginBody.model_validate({"email": "a@b.c", "password": "short"})
    assert exc_info.value.errors()[0]["type"] == "string_too_short"


def test_login_body_accepts_eight_char_password():
    body = LoginBody.model_validate({"email": "a@b.c", "password": "12345678"})
    assert body.password == "12345678"
```

`test/integration/api/test_knowledge_external_router.py`：把「创建 native KB 再打 external」改成对 `/api/knowledge/databases/external` 断言 404；不要再 `POST /api/knowledge/databases`。

- [ ] **Step 4: 删除四个未挂载路由文件**

```bash
rm apps/agent-harness/server/routers/auth_dept_router.py \
   apps/agent-harness/server/routers/knowledge_eval_router.py \
   apps/agent-harness/server/routers/graph_router.py \
   apps/agent-harness/server/routers/external_kb_router.py
```

不要改 `server/routers/__init__.py`（本来就没引用它们）。

- [ ] **Step 5: 跑相关单测**

```bash
cd apps/agent-harness && python -m pytest \
  test/unit/routers/test_p7_removed_routes.py \
  test/unit/server/test_auth_password_validation.py \
  test/unit/p1/test_local_login.py -q
```

Expected: PASS。

- [ ] **Step 6: Commit**

```bash
git add apps/agent-harness/server/routers apps/agent-harness/test
git commit -m "$(cat <<'EOF'
chore: delete unmounted P7 department/eval/graph/external routers

These files were already not included in server.routers; tests now lock 404s.
EOF
)"
```

---

### Task 3: 删除无调用方的身份 / 评测仓库

**Files:**
- Delete: `apps/agent-harness/package/yuxi/services/oidc_service.py`（无 `import oidc_service`）
- Delete: `apps/agent-harness/package/yuxi/services/auth_service.py`（无调用方；仍 import 已不存在的 `APIKey` / `CLIAuthSession` / `Department`）
- Delete: `apps/agent-harness/package/yuxi/repositories/department_repository.py`
- Delete: `apps/agent-harness/package/yuxi/repositories/evaluation_repository.py`
- Delete: `apps/agent-harness/package/yuxi/repositories/knowledge_graph_repository.py`
- Delete: `apps/agent-harness/package/yuxi/repositories/knowledge_chunk_repository.py`
- Delete: `apps/agent-harness/package/yuxi/repositories/knowledge_file_repository.py`
- Modify: `apps/agent-harness/package/yuxi/repositories/user_repository.py`（去掉 `Department` / `APIKey` / `department_id` 分支）
- Keep: `knowledge_base_repository.py`（已是空实现 stub，Task 4 删 native 路径时再评估是否内联）

- [ ] **Step 1: 写保护测试，禁止再 import 已删模块**

Add to `apps/agent-harness/test/unit/routers/test_p7_removed_routes.py`:

```python
import importlib
import pytest


@pytest.mark.parametrize(
    "mod",
    [
        "yuxi.services.oidc_service",
        "yuxi.services.auth_service",
        "yuxi.repositories.department_repository",
        "yuxi.repositories.evaluation_repository",
        "yuxi.repositories.knowledge_graph_repository",
        "yuxi.repositories.knowledge_chunk_repository",
        "yuxi.repositories.knowledge_file_repository",
        "server.routers.auth_dept_router",
        "server.routers.knowledge_eval_router",
        "server.routers.graph_router",
        "server.routers.external_kb_router",
    ],
)
def test_removed_modules_are_gone(mod: str):
    with pytest.raises(ModuleNotFoundError):
        importlib.import_module(mod)
```

- [ ] **Step 2: 跑测试，确认现在 FAIL（模块还在）**

```bash
cd apps/agent-harness && python -m pytest test/unit/routers/test_p7_removed_routes.py::test_removed_modules_are_gone -q
```

Expected: FAIL，因为模块还在，不会抛 `ModuleNotFoundError`。

- [ ] **Step 3: 删文件，并剪掉 `user_repository.py` 里已失效的部门代码**

`list_with_department` / `get_by_phone`（`User.phone_number` 已是始终 `None` 的 property）若无外部调用则整段删除。`list_users` 去掉 `department_id` 过滤。保留 `get_by_uid` / `get_by_uid_with_db` / `list_by_uids`（`yuxi.agents.context` 仍用）。

`user_repository.py` 顶部 import 保持：

```python
from yuxi.storage.postgres.models_business import User
```

不要再 `from yuxi.storage.postgres.models_business import Department`。

- [ ] **Step 4: 再跑测试**

```bash
cd apps/agent-harness && python -m pytest \
  test/unit/routers/test_p7_removed_routes.py \
  test/unit/middlewares/test_subagent_task_middleware.py \
  test/unit/agents/test_context_auth.py -q
```

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add apps/agent-harness/package/yuxi apps/agent-harness/test
git commit -m "$(cat <<'EOF'
chore: delete unreferenced OIDC/CLI/department/eval repositories

P7 dropped the tables; leftover modules imported removed ORM types.
EOF
)"
```

---

### Task 4: 先拆 `knowledge_router` 死接口，再删 graphs / eval / milvus

**Files:**
- Modify: `apps/agent-harness/server/routers/knowledge_router.py`
- Delete: `apps/agent-harness/package/yuxi/knowledge/graphs/`（整目录）
- Delete: `apps/agent-harness/package/yuxi/knowledge/eval/`（整目录）
- Delete: `apps/agent-harness/package/yuxi/knowledge/implementations/milvus.py`
- Delete: `apps/agent-harness/package/yuxi/knowledge/implementations/dify.py`
- Delete: `apps/agent-harness/package/yuxi/knowledge/implementations/notion.py`
- Modify: `apps/agent-harness/package/yuxi/knowledge/implementations/__init__.py`（已只导出 `WeKnoraKB`，确认无需改）
- Delete: `apps/agent-harness/test/unit/knowledge/test_milvus_retrieval_config.py`
- Delete: `apps/agent-harness/test/integration/api/test_graph_build_status.py`
- Modify: `apps/agent-harness/test/unit/routers/test_knowledge_router_cleanup.py`（去掉 milvus/graph 假设，只留 WeKnora 列表/mindmap 相关）
- Keep: `package/yuxi/knowledge/implementations/weknora.py`、`runtime.py`（只注册 `WeKnoraKB`）、mindmap 路由

**为什么不能直接 rm graphs：** `knowledge_router.py:15` 仍 `from yuxi.knowledge.graphs.milvus_graph_service import GRAPH_TASK_TYPE, MilvusGraphService`，且 `/databases/{kb_id}/graph-build/*` 已挂在活 router 上。`runtime.py` 已不注册 milvus，但 `POST /databases` 默认 `kb_type="milvus"` 仍会进工厂然后失败。

- [ ] **Step 1: 扩展 404 测试，锁死 graph-build 与 native 创建**

Append to `test_p7_removed_routes.py`:

```python
MOUNTED_DEAD = [
    ("POST", "/api/knowledge/databases"),
    ("GET", "/api/knowledge/databases/kb_1/graph-build/status"),
    ("POST", "/api/knowledge/databases/kb_1/graph-build/index"),
    ("POST", "/api/knowledge/databases/kb_1/graph-build/reset"),
]


@pytest.mark.parametrize("method,path", MOUNTED_DEAD)
async def test_native_kb_write_and_graph_build_are_404(method: str, path: str):
    app = FastAPI()
    app.include_router(router, prefix="/api")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.request(method, path, json={})
    assert response.status_code == 404
```

- [ ] **Step 2: 跑测试，确认 FAIL（这些路径现在不是 404）**

```bash
cd apps/agent-harness && python -m pytest \
  test/unit/routers/test_p7_removed_routes.py::test_native_kb_write_and_graph_build_are_404 -q
```

Expected: FAIL（200/401/422/500 都算失败；目标是 404）。

- [ ] **Step 3: 从 `knowledge_router.py` 删除死处理函数**

删除 import：

```python
from yuxi.knowledge.graphs.milvus_graph_service import GRAPH_TASK_TYPE, MilvusGraphService
```

删除函数（当前约 L206–216、L232–270、L451–620）：

- `_has_running_graph_build_task`
- `create_database`（`POST /databases`）
- `get_graph_build_status`
- `configure_graph_build`
- `index_graph_build`
- `get_graph_build_failed_chunks`
- `reset_graph_build`
- `reconcile_graph_build`

保留：

- `GET /databases`、`GET /databases/accessible`
- 全部 mindmap 路由
- WeKnora 可读的 document/query（若 `WeKnoraKB` 仍实现）；若某写接口对 WeKnora UUID 会落到已删表，一并改 404，不要留半残成功路径

文档内容读取里的 `internal_graph_fields = {"ent_id", "ent_ids", "extraction_result"}` 过滤可留（只是 dict 清洗），不要再 import graph service。

- [ ] **Step 4: 再跑 404 测试，确认 PASS**

```bash
cd apps/agent-harness && python -m pytest test/unit/routers/test_p7_removed_routes.py -q
```

Expected: PASS。

- [ ] **Step 5: 删除实现与只测 milvus/graph 的测试**

```bash
rm -rf apps/agent-harness/package/yuxi/knowledge/graphs \
       apps/agent-harness/package/yuxi/knowledge/eval
rm apps/agent-harness/package/yuxi/knowledge/implementations/milvus.py \
   apps/agent-harness/package/yuxi/knowledge/implementations/dify.py \
   apps/agent-harness/package/yuxi/knowledge/implementations/notion.py \
   apps/agent-harness/test/unit/knowledge/test_milvus_retrieval_config.py \
   apps/agent-harness/test/integration/api/test_graph_build_status.py
```

`read_only_connectors.py` 若只被 milvus/dify/notion 使用则一并删；先：

```bash
rg -n "read_only_connectors" apps/agent-harness --glob '!**/implementations/milvus.py'
```

无其它引用再删。

- [ ] **Step 6: 全量知识库相关单测**

```bash
cd apps/agent-harness && python -m pytest \
  test/unit/routers/test_p7_removed_routes.py \
  test/unit/routers/test_knowledge_router_cleanup.py \
  test/unit/p6/test_p6_mindmap.py \
  test/unit/knowledge -q --ignore=test/unit/knowledge/test_milvus_retrieval_config.py
```

Expected: PASS。失败的测试若只覆盖 milvus 创建/图谱，改为 404 或删除，不要为了保测试而把 milvus 加回来。

- [ ] **Step 7: Commit**

```bash
git add apps/agent-harness
git commit -m "$(cat <<'EOF'
chore: drop native KB graph/eval/milvus after unmounting live routes

Graph-build and native create were still on knowledge_router; WeKnora list/mindmap stay.
EOF
)"
```

---

### Task 5: 清理 harness 前端已砍能力入口

**Files:**
- Delete: `apps/frontend/src/harness/components/RAGEvaluationTab.vue`
- Delete: `apps/frontend/src/harness/components/EvaluationBenchmarks.vue`
- Delete: `apps/frontend/src/harness/components/KnowledgeGraphSection.vue`
- Delete: `apps/frontend/src/harness/components/GraphCanvas.vue`
- Delete: `apps/frontend/src/harness/components/GraphDetailPanel.vue`
- Delete: `apps/frontend/src/harness/composables/useGraph.js`
- Delete: `apps/frontend/src/harness/apis/graph_api.js`
- Delete: `apps/frontend/src/harness/apis/department_api.js`
- Delete: `apps/frontend/src/harness/components/modals/BenchmarkUploadModal.vue`
- Delete: `apps/frontend/src/harness/components/modals/BenchmarkGenerateModal.vue`
- Modify: `apps/frontend/src/harness/views/DataBaseInfoView.vue`（去掉 Graph / RAG eval 组件与 `loadDepartments`）
- Modify: `apps/frontend/src/harness/apis/knowledge_api.js`（删除 `graph-build` URL helper）
- Modify: `apps/frontend/src/harness/apis/auth_api.js`（删除 `getOIDCConfig` / `getOIDCLoginUrl` / `exchangeOIDCCode`）
- Modify: `apps/frontend/src/harness/stores/user.js`（删除 `check-first-run`）
- Modify: `apps/frontend/src/harness/components/ShareConfigForm.vue`（部门选择改为只保留 user/global；不要再调 `departmentApi`）
- Keep: `apps/frontend/src/harness/components/MindMapSection.vue`
- Keep: WeKnora 官方 `views/knowledge/settings/GraphSettings.vue`、`views/system/PlatformAPIKeys.vue`、`App.vue` 里 Go OIDC（不是 harness Token Gate）

- [ ] **Step 1: 从 `DataBaseInfoView.vue` 去掉死组件引用**

删除：

```javascript
import KnowledgeGraphSection from '@harness/components/KnowledgeGraphSection.vue'
import RAGEvaluationTab from '@harness/components/RAGEvaluationTab.vue'
```

以及模板里 `<KnowledgeGraphSection>`、`<RAGEvaluationTab>`、`loadDepartments` / `getDepartmentName`。保留 mindmap 区块。

- [ ] **Step 2: 删前端文件，修剩余 import**

```bash
rg -n "department_api|graph_api|KnowledgeGraphSection|RAGEvaluationTab|useGraph|BenchmarkGenerate|BenchmarkUpload" \
  apps/frontend/src/harness
```

Expected: 清零后再 `rm` 上表文件。`ShareConfigForm.vue` 里 `department_ids` 可继续作为空数组字段序列化（后端 share_config JSON 仍有该 key），但 UI 不再拉部门列表。

- [ ] **Step 3: 确认 harness 无 token gate / OIDC 登录页调用**

```bash
rg -n "check-first-run|/api/auth/oidc|Token Gate|getOIDCConfig" apps/frontend/src/harness
```

Expected: 无匹配。`apps/frontend/src/App.vue` 的 WeKnora OIDC 不要动。

- [ ] **Step 4: 前端构建（或至少 harness 相关 lint）**

```bash
cd apps/frontend && npx vue-tsc --noEmit
```

若仓库惯用 `npm run build`，改用项目脚本。Expected: 无因删除组件产生的缺失 import。

浏览器（有前端工具时）：登录 WeKnora → 打开工作区知识库列表 → 打开旧会话 → 思维导图。不要再看到「知识图谱构建 / RAG 评测 / 部门」入口。无 token 应回 `/login`。

- [ ] **Step 5: Commit**

```bash
git add apps/frontend
git commit -m "$(cat <<'EOF'
chore: remove harness UI for dropped graph/eval/department/OIDC

Keep WeKnora mindmap and official tenant API keys; only harness native surfaces go away.
EOF
)"
```

---

### Task 6: JWT 与 CLI discovery 对齐 P7 配置

**Files:**
- Modify: `apps/agent-harness/package/yuxi/utils/auth_utils.py`
- Modify: `apps/agent-harness/test/unit/test_auth_utils.py`
- Modify: `apps/agent-harness/server/routers/system_router.py`
- Modify: `apps/agent-harness/test/unit/routers/test_system_router.py`
- Modify: `apps/agent-harness/README.md`（认证列改为只写 `JWT_SECRET`）
- Modify: `apps/agent-harness/package/yuxi/p1/flags.py`（可选：删 `is_legacy_jwt_enabled` 若已无引用）

`auth_router.py` 登录已走 `create_weknora_access_token`。`AuthUtils.create_access_token` 只被已删的 OIDC 使用。`verify_password` 必须保留（bcrypt 校验 WeKnora `users.password_hash`）。

- [ ] **Step 1: 改 `test_auth_utils.py`，先锁新行为**

删除所有 `JWT_SECRET_KEY` / `create_access_token` / `verify_access_token` 用例。保留：

```python
from yuxi.utils.auth_utils import AuthUtils


def test_verify_password_accepts_bcrypt_and_rejects_wrong():
    hashed = AuthUtils.hash_password("secret-password")
    assert AuthUtils.verify_password(hashed, "secret-password") is True
    assert AuthUtils.verify_password(hashed, "wrong-password") is False
```

若 `generate_api_key` 已无调用方，连同测试一起删。

- [ ] **Step 2: 跑测试，确认 FAIL（旧 JWT 测试还在或新测试因 JWT 函数还在而无关）**

```bash
cd apps/agent-harness && python -m pytest test/unit/test_auth_utils.py -q
```

Expected: 按 Step 1 改完后，若实现仍导出 JWT 函数，先让测试不再依赖它们；然后删实现。

- [ ] **Step 3: 精简 `auth_utils.py`**

最终文件只保留密码哈希（登录仍需要）：

```python
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHash, VerificationError, VerifyMismatchError

PASSWORD_HASHER = PasswordHasher()


class AuthUtils:
    @staticmethod
    def hash_password(password: str) -> str:
        return PASSWORD_HASHER.hash(password)

    @staticmethod
    def verify_password(stored_password: str, provided_password: str) -> bool:
        if not stored_password:
            return False
        if stored_password.startswith("$2"):
            try:
                import bcrypt

                return bcrypt.checkpw(provided_password.encode("utf-8"), stored_password.encode("utf-8"))
            except (ValueError, TypeError, ImportError):
                return False
        if not stored_password.startswith("$argon2"):
            return False
        try:
            return PASSWORD_HASHER.verify(stored_password, provided_password)
        except (InvalidHash, VerifyMismatchError, VerificationError):
            return False
```

不要再读 `JWT_SECRET_KEY`。不要改 `yuxi/utils/weknora_auth.py`（它读 `JWT_SECRET`）。

- [ ] **Step 4: `system_router.py` discovery 去掉 CLI**

`GET /api/system/discovery` 的 `capabilities.cli` 改为 `False` 或不返回 cli 块；删除 `endpoints.cli_auth_sessions`。

`test_system_router.py` 改为：

```python
assert payload["capabilities"].get("cli", {}).get("api_key_auth") in (None, False)
assert "cli_auth_sessions" not in payload.get("endpoints", {})
```

- [ ] **Step 5: 全仓扫旧环境变量名**

```bash
rg -n "JWT_SECRET_KEY|HARNESS_LEGACY_JWT|HARNESS_LOCAL_LOGIN|HARNESS_WEKNORA_IDENTITY" \
  --glob '!docs/plan/**'
```

Expected: 代码与 `.env.kjsc.example` 无这些键。文档历史叙述可留在 `docs/plan/`。

- [ ] **Step 6: 跑单测并 Commit**

```bash
cd apps/agent-harness && python -m pytest \
  test/unit/test_auth_utils.py \
  test/unit/p1 \
  test/unit/routers/test_system_router.py -q
```

```bash
git add apps/agent-harness
git commit -m "$(cat <<'EOF'
chore: drop JWT_SECRET_KEY and CLI discovery after WeKnora JWT-only auth

Login still verifies bcrypt via AuthUtils and signs tokens with JWT_SECRET.
EOF
)"
```

---

### Task 7: yuxi OCR parser（最后一波，有门禁）

**Files:**
- Modify: `apps/agent-harness/package/yuxi/services/ocr_service.py`（WeKnora 分支已是唯一路径；删 native fallback）
- Modify: `apps/agent-harness/package/yuxi/knowledge/parser/registry.py`
- Delete（确认无 WeKnora 代理依赖后）: `rapid_ocr.py`、`mineru.py`、`mineru_official.py`、`pp_structure_v3.py`、`deepseek_ocr.py`、`paddleocr_api.py`
- Keep: `parser/unified.py` 里非 OCR 的 txt/docx/xlsx 解析，**仅当** `parse_source_via_weknora` 失败时不再走它们。P7 后 `is_weknora_kb_enabled()` 恒为 True，`parse_document` 在 L105 就 return WeKnora，native parser 是死分支。
- Modify: `apps/agent-harness/package/yuxi/config/options.py`（删 `mineru_*` / `paddleocr_*` / `pp_structure_*` Option）
- Modify: `apps/agent-harness/package/yuxi/config/app.py`（`DEFAULT_OCR_ENGINE` 可删或改为 `"weknora"`）
- Modify: harness `OCRSelector.vue`（选项已空时删组件）
- Modify/Delete tests: `test/unit/services/test_ocr_service.py`、`test/unit/knowledge/test_parser_facade.py`、`test/unit/knowledge/test_paddleocr_api_parser.py`、`test/unit/config/test_options.py`（OCR 项）、`test/integration/api/test_system_router_api.py`（OCR 配置）

**门禁：** 先在测试环境确认附件解析、对话里传 PDF/图片仍成功（走 WeKnora docreader）。失败则停止本 Task，保留 parser，不要为了「清单完整」拆解析。

- [ ] **Step 1: 确认运行时门禁**

```bash
cd apps/agent-harness && python - <<'PY'
from yuxi.weknora.flags import is_weknora_kb_enabled
from yuxi.services.ocr_service import get_ocr_options
assert is_weknora_kb_enabled() is True
assert get_ocr_options()["weknora_managed"] is True
assert get_ocr_options()["engines"] == []
print("ok")
PY
```

Expected: `ok`。

- [ ] **Step 2: 把 `ocr_service.parse_document` 的 native fallback 删掉，失败测试先锁 WeKnora-only**

`parse_document` 在 WeKnora 分支之后不要再调用 `parse_resolved_document`。`get_ocr_options` 只返回 weknora_managed。删除 `resolve_ocr_engine_id` 对 `PROCESSOR_TYPES` 的依赖（若无调用方则整函数删）。

保留并加强 `test/unit/p6/test_p6_parse.py`。把 `test_ocr_service.py` 里「列出 rapid_ocr 引擎」的用例改成 `engines == []`。

- [ ] **Step 3: 跑 p6 parse + ocr 单测，应 PASS 后再删 parser 文件**

```bash
cd apps/agent-harness && python -m pytest test/unit/p6/test_p6_parse.py test/unit/services/test_ocr_service.py -q
```

Expected: PASS。

- [ ] **Step 4: 删除多余 parser 与 OCR 配置项，修编译失败的测试**

`unified.py` 若仍被 docx/txt 单测直接调用：那些测试改为 mock `parse_source_via_weknora`，或删除（生产路径已不走 unified OCR）。不要保留一套「关 HARNESS_WEKNORA_KB 回到 yuxi OCR」的路径——`p3/flags.py` 已写死 True。

- [ ] **Step 5: Commit**

```bash
git add apps/agent-harness apps/frontend
git commit -m "$(cat <<'EOF'
chore: remove unused yuxi OCR engines now that parse always proxies WeKnora

Attachment parsing stays on weknora_proxy; native mineru/rapid/paddle options go away.
EOF
)"
```

---

### Task 8: 文档收尾与回归

**Files:**
- Modify: `docs/plan/P7_TEST_ENV_UPGRADE.md` 第 8 节全部勾成已执行，并指向本文件
- Modify: `docs/plan/WEKNORA_YUXI_INTEGRATION_PLAN.md`（P7 段改为「代码清理见 P7_CLEANUP」；按该手册自己的门禁，清完后可删手册——**本 Task 只加指针，不擅自删整本集成手册，除非用户确认**）
- Modify: `apps/agent-harness/README.md` 认证表

- [ ] **Step 1: 回归命令**

```bash
cd apps/agent-harness && python -m pytest test/unit/p1 test/unit/p6 test/unit/routers/test_p7_removed_routes.py -q
```

Expected: PASS。

- [ ] **Step 2: 冒烟对照（测试环境，人工）**

与 `P7_TEST_ENV_UPGRADE.md` 第 5 节相同：WeKnora 登录、harness `/api/auth/login`、旧会话、知识库列表、检索、出话、附件、思维导图、Skill/MCP/智能体/数据总览。404：initialize / CLI / OIDC / 部门 / 原生 KB 创建 / graph-build / eval。

- [ ] **Step 3: 更新第 8 节状态**

`P7_TEST_ENV_UPGRADE.md` 第 8 节表格每行改为「已删除（见 P7_CLEANUP Task N）」。

- [ ] **Step 4: Commit**

```bash
git add docs/plan apps/agent-harness/README.md
git commit -m "$(cat <<'EOF'
docs: mark P7 leftover cleanup complete

Upgrade runbook now points at P7_CLEANUP for the post-cutover deletions.
EOF
)"
```

---

## 明确不做

- `migrate down`、执行 `000006` down、跑已删的 remap SQL。
- 删除 `scripts/docker-env.py`。
- 删除 harness `POST /api/auth/login` / `/token` / `/me`。
- 删除 `WeKnoraKB`、mindmap、LangGraph checkpoint 四表。
- 改测试库数据、改 `JWT_SECRET`、动生产库。
- 删除 WeKnora Go 的租户/平台 API Key 与官方 OIDC（`frontend` 非 harness 目录里的那些）。

## Self-review

1. **Spec coverage:** P7 第 8 节五项均有 Task（脚本=1，未挂载路由=2，oidc/dept/milvus/graphs/eval/OCR=3/4/7）。额外覆盖了仍挂在 `knowledge_router` 上的 graph-build、前端入口、`JWT_SECRET_KEY`，否则第 8 节「删 graphs」会破坏 import。
2. **Placeholder scan:** 无 TBD；OCR Task 用运行时门禁代替「以后再说」。
3. **Type consistency:** 登录继续 `AuthUtils.verify_password` + `create_weknora_access_token`；KB 运行时继续只注册 `WeKnoraKB`。
