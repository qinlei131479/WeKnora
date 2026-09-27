"""PostgreSQL 数据库管理器 - 支持知识库和业务数据"""

import json
import os
from contextlib import asynccontextmanager

from psycopg_pool import AsyncConnectionPool
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from yuxi.storage.postgres.models_business import AGENT_RUN_TERMINAL_STATUSES
from yuxi.storage.postgres.models_business import Base as BusinessBase
from yuxi.storage.postgres.models_knowledge import Base as KnowledgeBase
from yuxi.utils import logger
from yuxi.utils.singleton import SingletonMeta

# 合并两个 Base
CombinedBase = declarative_base()
AGENT_RUN_TERMINAL_STATUS_SQL = ", ".join(f"'{status}'" for status in AGENT_RUN_TERMINAL_STATUSES)

# 继承所有表
for module in [KnowledgeBase, BusinessBase]:
    for table_name in dir(module):
        table = getattr(module, table_name)
        if isinstance(table, type) and hasattr(table, "__tablename__"):
            setattr(CombinedBase, table_name, table)


class PostgresManager(metaclass=SingletonMeta):
    """PostgreSQL 数据库管理器 - 支持知识库和业务数据"""

    # 知识库 PostgreSQL URL 环境变量名
    KB_DATABASE_URL_ENV = "POSTGRES_URL"

    def __init__(self):
        self.async_engine = None
        self.AsyncSession = None
        self.langgraph_pool = None
        self._initialized = False

    def initialize(self):
        """初始化数据库连接"""
        if self._initialized:
            return

        db_url = os.getenv(self.KB_DATABASE_URL_ENV)
        if not db_url:
            logger.error(
                f"环境变量 {self.KB_DATABASE_URL_ENV} 未设置，"
                "请在 docker-compose.yml 或 .env 中配置 PostgreSQL 连接字符串"
            )
            return

        try:
            # 创建异步 SQLAlchemy 引擎
            self.async_engine = create_async_engine(
                db_url,
                json_serializer=lambda obj: json.dumps(obj, ensure_ascii=False),
                json_deserializer=json.loads,
                pool_pre_ping=True,
                pool_recycle=1800,
                pool_size=10,
                max_overflow=20,
            )

            # 创建异步会话工厂
            self.AsyncSession = async_sessionmaker(
                bind=self.async_engine,
                class_=AsyncSession,
                expire_on_commit=False,
            )

            # ==========================================
            # 2. 为 LangGraph 专门初始化一个原生 psycopg_pool
            # ==========================================
            # ⚠️ 注意：psycopg 不认识 "+asyncpg" 这样的 SQLAlchemy 方言标识。
            # 如果你的 db_url 是 "postgresql+asyncpg://user:pwd@host/db"，
            # 需要把它清洗成标准的 "postgresql://user:pwd@host/db"
            langgraph_db_url = db_url.replace("+asyncpg", "").replace("+psycopg", "")

            # 创建 LangGraph 专属连接池
            self.langgraph_pool = AsyncConnectionPool(
                conninfo=langgraph_db_url,
                max_size=10,  # 根据你的 Agent 并发情况设置，通常 5-10 足够了
                kwargs={"autocommit": True},  # LangGraph Checkpoint 强依赖 autocommit
            )

            self._initialized = True
            logger.info(f"PostgreSQL manager initialized for knowledge base: {db_url.split('@')[0]}://***")
        except Exception as e:
            logger.error(f"Failed to initialize PostgreSQL manager: {e}")
            # 不抛出异常，允许应用启动，但在使用时会报错

    def _check_initialized(self):
        """检查是否已初始化"""
        if not self._initialized:
            raise RuntimeError("PostgreSQL manager not initialized. Please check configuration.")

    async def create_tables(self):
        """创建业务表（知识库原生表已删除）。"""
        self._check_initialized()
        async with self.async_engine.begin() as conn:
            await conn.run_sync(BusinessBase.metadata.create_all)
        logger.info("PostgreSQL tables created/checked (business)")

    async def create_business_tables(self):
        """创建所有业务数据表"""
        self._check_initialized()
        async with self.async_engine.begin() as conn:
            await conn.run_sync(BusinessBase.metadata.create_all)
        logger.info("PostgreSQL business tables created/checked")

    async def ensure_knowledge_schema(self):
        """原生知识库 / 图谱 / 评测表已删除。"""
        self._check_initialized()
        logger.info("Knowledge schema skipped (native KB tables removed)")

    async def ensure_business_schema(self):
        """确保业务 schema 包含后续新增字段（运行时 schema 演进）。"""
        self._check_initialized()
        stmts = [
            "ALTER TABLE IF EXISTS amp_sessions ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE",
            """
            CREATE TABLE IF NOT EXISTS amp_agents (
                id SERIAL PRIMARY KEY,
                slug VARCHAR(80) NOT NULL UNIQUE,
                backend_id VARCHAR(64) NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                icon VARCHAR(255),
                pics JSONB NOT NULL DEFAULT '[]'::jsonb,
                config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
                share_config JSONB NOT NULL DEFAULT '{}'::jsonb,
                is_default BOOLEAN NOT NULL DEFAULT FALSE,
                is_subagent BOOLEAN NOT NULL DEFAULT FALSE,
                created_by VARCHAR(64),
                updated_by VARCHAR(64),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
            """,
            "ALTER TABLE IF EXISTS amp_agents ADD COLUMN IF NOT EXISTS backend_id VARCHAR(64)",
            "ALTER TABLE IF EXISTS amp_agents ADD COLUMN IF NOT EXISTS share_config JSONB NOT NULL DEFAULT '{}'::jsonb",
            "ALTER TABLE IF EXISTS amp_agents ALTER COLUMN share_config TYPE JSONB USING share_config::jsonb",
            (
                "UPDATE amp_agents SET share_config = jsonb_build_object("
                "'version', 2, 'read_scope', CASE WHEN share_config = '{}'::jsonb THEN "
                '\'{"access_level": "global", "department_ids": [], "user_uids": []}\'::jsonb '
                "ELSE share_config END, 'manage_scope', NULL) "
                "WHERE share_config IS NOT NULL AND share_config->>'version' IS DISTINCT FROM '2'"
            ),
            "ALTER TABLE IF EXISTS amp_agents ALTER COLUMN share_config DROP DEFAULT",
            "ALTER TABLE IF EXISTS amp_agents ADD COLUMN IF NOT EXISTS is_subagent BOOLEAN NOT NULL DEFAULT FALSE",
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_amp_agents_slug ON amp_agents(slug)",
            "CREATE INDEX IF NOT EXISTS ix_amp_agents_backend_id ON amp_agents(backend_id)",
            "CREATE INDEX IF NOT EXISTS ix_amp_agents_is_subagent ON amp_agents(is_subagent)",
            "CREATE INDEX IF NOT EXISTS ix_amp_agents_created_by ON amp_agents(created_by)",
            """
            CREATE UNIQUE INDEX IF NOT EXISTS uq_amp_agents_default
            ON amp_agents(is_default)
            WHERE is_default IS TRUE
            """,
            """
            CREATE TABLE IF NOT EXISTS amp_subagent_threads (
                id SERIAL PRIMARY KEY,
                uid VARCHAR(64) NOT NULL,
                parent_conversation_id INTEGER NOT NULL REFERENCES amp_sessions(id) ON DELETE CASCADE,
                child_conversation_id INTEGER NOT NULL UNIQUE REFERENCES amp_sessions(id) ON DELETE CASCADE,
                child_thread_id VARCHAR(64) NOT NULL UNIQUE,
                subagent_slug VARCHAR(64) NOT NULL,
                created_by_run_id VARCHAR(64) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
            """,
            "ALTER TABLE IF EXISTS amp_agent_runs ADD COLUMN IF NOT EXISTS agent_slug VARCHAR(64)",
            "ALTER TABLE IF EXISTS amp_agent_runs ADD COLUMN IF NOT EXISTS conversation_thread_id VARCHAR(64)",
            "ALTER TABLE IF EXISTS amp_agent_runs ADD COLUMN IF NOT EXISTS created_by_run_id VARCHAR(64)",
            "ALTER TABLE IF EXISTS amp_agent_runs ADD COLUMN IF NOT EXISTS subagent_thread_relation_id INTEGER",
            "ALTER TABLE IF EXISTS amp_agent_runs ADD COLUMN IF NOT EXISTS source VARCHAR(32) NOT NULL DEFAULT 'chat'",
            "ALTER TABLE IF EXISTS amp_agent_runs ADD COLUMN IF NOT EXISTS channel VARCHAR(32) NOT NULL DEFAULT 'web'",
            "ALTER TABLE IF EXISTS amp_agent_runs ADD COLUMN IF NOT EXISTS external_id VARCHAR(128)",
            (
                "ALTER TABLE IF EXISTS amp_agent_runs ADD COLUMN IF NOT EXISTS "
                "origin_metadata JSONB NOT NULL DEFAULT '{}'::jsonb"
            ),
            (
                "ALTER TABLE IF EXISTS amp_agent_run_requests ADD COLUMN IF NOT EXISTS "
                "channel VARCHAR(32) NOT NULL DEFAULT 'web'"
            ),
            "ALTER TABLE IF EXISTS amp_agent_run_requests ADD COLUMN IF NOT EXISTS external_id VARCHAR(128)",
            (
                "ALTER TABLE IF EXISTS amp_agent_run_requests ADD COLUMN IF NOT EXISTS "
                "origin_metadata JSONB NOT NULL DEFAULT '{}'::jsonb"
            ),
            "ALTER TABLE IF EXISTS amp_subagent_threads ADD COLUMN IF NOT EXISTS subagent_slug VARCHAR(64)",
            "ALTER TABLE IF EXISTS amp_subagent_threads ADD COLUMN IF NOT EXISTS created_by_run_id VARCHAR(64)",
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'amp_agent_runs'
                      AND column_name = 'agent_id'
                ) THEN
                    EXECUTE '
                        UPDATE amp_agent_runs
                        SET agent_slug = agent_id
                        WHERE agent_slug IS NULL
                          AND agent_id IS NOT NULL
                    ';
                END IF;

                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'amp_agent_runs'
                      AND column_name = 'thread_id'
                ) THEN
                    EXECUTE '
                        UPDATE amp_agent_runs
                        SET conversation_thread_id = thread_id
                        WHERE conversation_thread_id IS NULL
                          AND thread_id IS NOT NULL
                    ';
                END IF;

                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'amp_agent_runs'
                      AND column_name = 'parent_agent_run_id'
                ) OR EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'amp_agent_runs'
                      AND column_name = 'parent_run_id'
                ) THEN
                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_name = 'amp_agent_runs'
                          AND column_name = 'parent_agent_run_id'
                    ) AND EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_name = 'amp_agent_runs'
                          AND column_name = 'parent_run_id'
                    ) THEN
                        EXECUTE '
                            UPDATE amp_agent_runs
                            SET created_by_run_id = COALESCE(parent_agent_run_id, parent_run_id)
                            WHERE created_by_run_id IS NULL
                              AND COALESCE(parent_agent_run_id, parent_run_id) IS NOT NULL
                        ';
                    ELSIF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_name = 'amp_agent_runs'
                          AND column_name = 'parent_agent_run_id'
                    ) THEN
                        EXECUTE '
                            UPDATE amp_agent_runs
                            SET created_by_run_id = parent_agent_run_id
                            WHERE created_by_run_id IS NULL
                              AND parent_agent_run_id IS NOT NULL
                        ';
                    ELSE
                        EXECUTE '
                            UPDATE amp_agent_runs
                            SET created_by_run_id = parent_run_id
                            WHERE created_by_run_id IS NULL
                              AND parent_run_id IS NOT NULL
                        ';
                    END IF;
                END IF;
            END $$;
            """,
            """
            UPDATE amp_subagent_threads st
            SET subagent_slug = c.agent_id
            FROM amp_sessions c
            WHERE st.subagent_slug IS NULL
              AND c.id = st.child_conversation_id
              AND c.agent_id IS NOT NULL
            """,
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'amp_subagent_threads'
                      AND column_name = 'created_by_parent_run_id'
                ) THEN
                    EXECUTE '
                        UPDATE amp_subagent_threads
                        SET created_by_run_id = created_by_parent_run_id::VARCHAR
                        WHERE created_by_run_id IS NULL
                          AND created_by_parent_run_id IS NOT NULL
                    ';
                END IF;
            END $$;
            """,
            """
            UPDATE amp_subagent_threads st
            SET created_by_run_id = child_run.created_by_run_id
            FROM (
                SELECT DISTINCT ON (subagent_thread_relation_id)
                    subagent_thread_relation_id,
                    created_by_run_id
                FROM amp_agent_runs
                WHERE run_type = 'subagent'
                  AND subagent_thread_relation_id IS NOT NULL
                  AND created_by_run_id IS NOT NULL
                ORDER BY subagent_thread_relation_id, created_at ASC, id ASC
            ) child_run
            WHERE st.created_by_run_id IS NULL
              AND child_run.subagent_thread_relation_id = st.id
            """,
            """
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM amp_subagent_threads WHERE subagent_slug IS NULL) THEN
                    ALTER TABLE amp_subagent_threads ALTER COLUMN subagent_slug SET NOT NULL;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM amp_subagent_threads WHERE created_by_run_id IS NULL) THEN
                    ALTER TABLE amp_subagent_threads ALTER COLUMN created_by_run_id SET NOT NULL;
                END IF;
            END $$;
            """,
            "ALTER TABLE IF EXISTS amp_agent_runs DROP COLUMN IF EXISTS agent_id",
            "ALTER TABLE IF EXISTS amp_agent_runs DROP COLUMN IF EXISTS thread_id",
            "ALTER TABLE IF EXISTS amp_agent_runs DROP COLUMN IF EXISTS parent_run_id",
            "ALTER TABLE IF EXISTS amp_agent_runs DROP COLUMN IF EXISTS parent_agent_run_id",
            "ALTER TABLE IF EXISTS amp_agent_runs DROP COLUMN IF EXISTS resumed_from_run_id",
            "ALTER TABLE IF EXISTS amp_agent_runs DROP COLUMN IF EXISTS invoked_by_run_id",
            "ALTER TABLE IF EXISTS amp_agent_runs DROP COLUMN IF EXISTS subagent_thread_id",
            "ALTER TABLE IF EXISTS amp_agent_runs DROP COLUMN IF EXISTS resume_request_id",
            "ALTER TABLE IF EXISTS amp_agent_runs DROP COLUMN IF EXISTS resume_idempotency_key",
            "ALTER TABLE IF EXISTS amp_agent_runs DROP COLUMN IF EXISTS checkpoint_thread_id",
            "ALTER TABLE IF EXISTS amp_agent_runs DROP COLUMN IF EXISTS execution_scope_id",
            "ALTER TABLE IF EXISTS amp_subagent_threads DROP COLUMN IF EXISTS subagent_agent_id",
            "ALTER TABLE IF EXISTS amp_subagent_threads DROP COLUMN IF EXISTS created_by_parent_run_id",
            "ALTER TABLE IF EXISTS amp_subagent_threads DROP COLUMN IF EXISTS created_by_tool_call_id",
            "CREATE INDEX IF NOT EXISTS idx_amp_agent_runs_uid_created ON amp_agent_runs(uid, created_at DESC)",
            """
            CREATE INDEX IF NOT EXISTS idx_amp_agent_runs_conversation_thread_created
            ON amp_agent_runs(conversation_thread_id, created_at DESC)
            """,
            "CREATE INDEX IF NOT EXISTS idx_amp_agent_runs_status_updated ON amp_agent_runs(status, updated_at)",
            """
            CREATE INDEX IF NOT EXISTS ix_amp_agent_runs_subagent_thread_relation_id
            ON amp_agent_runs(subagent_thread_relation_id)
            """,
            "CREATE INDEX IF NOT EXISTS ix_amp_subagent_threads_uid ON amp_subagent_threads(uid)",
            """
            CREATE INDEX IF NOT EXISTS ix_amp_subagent_threads_parent_conversation
            ON amp_subagent_threads(parent_conversation_id)
            """,
            """
            CREATE INDEX IF NOT EXISTS ix_amp_subagent_threads_subagent_slug
            ON amp_subagent_threads(subagent_slug)
            """,
            """
            CREATE INDEX IF NOT EXISTS ix_amp_subagent_threads_created_by_run_id
            ON amp_subagent_threads(created_by_run_id)
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_amp_agent_runs_created_by_run_created
            ON amp_agent_runs(created_by_run_id, created_at DESC)
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_amp_agent_runs_subagent_lookup
            ON amp_agent_runs(uid, conversation_thread_id, run_type, created_at DESC)
            """,
            f"""
            WITH duplicated_active_runs AS (
                SELECT
                    id,
                    ROW_NUMBER() OVER (
                        PARTITION BY uid, agent_slug, conversation_thread_id
                        ORDER BY created_at DESC NULLS LAST, id DESC
                    ) AS active_rank
                FROM amp_agent_runs
                WHERE status NOT IN ({AGENT_RUN_TERMINAL_STATUS_SQL})
                  AND uid IS NOT NULL
                  AND agent_slug IS NOT NULL
                  AND conversation_thread_id IS NOT NULL
            )
            UPDATE amp_agent_runs ar
            SET status = 'failed',
                error_type = COALESCE(ar.error_type, 'active_run_migration_conflict'),
                error_message = COALESCE(
                    ar.error_message,
                    '旧库存在同一用户、智能体和线程的重复活跃 AgentRun，迁移时已保留最新一条并终结本记录。'
                ),
                finished_at = COALESCE(ar.finished_at, NOW()),
                updated_at = NOW()
            FROM duplicated_active_runs dup
            WHERE ar.id = dup.id
              AND dup.active_rank > 1
            """,
            f"""
            CREATE UNIQUE INDEX IF NOT EXISTS uq_amp_agent_runs_one_active_per_thread
            ON amp_agent_runs(uid, agent_slug, conversation_thread_id)
            WHERE status NOT IN ({AGENT_RUN_TERMINAL_STATUS_SQL})
            """,
            "CREATE INDEX IF NOT EXISTS ix_amp_sessions_is_pinned ON amp_sessions(is_pinned)",
            """
            CREATE TABLE IF NOT EXISTS amp_agent_run_requests (
                id SERIAL PRIMARY KEY,
                request_id VARCHAR(64) NOT NULL,
                uid VARCHAR(64) NOT NULL,
                agent_slug VARCHAR(64) NOT NULL,
                conversation_thread_id VARCHAR(64) NOT NULL,
                source VARCHAR(32) NOT NULL DEFAULT 'chat',
                queue_policy VARCHAR(16) NOT NULL DEFAULT 'enqueue',
                status VARCHAR(32) NOT NULL DEFAULT 'queued',
                input_message_id INTEGER NOT NULL REFERENCES amp_messages(id),
                dispatched_run_id VARCHAR(64) REFERENCES amp_agent_runs(id),
                input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
                error_message TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                dispatched_at TIMESTAMPTZ,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """,
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_amp_agent_run_requests_request_id "
            "ON amp_agent_run_requests(request_id)",
            """
            CREATE INDEX IF NOT EXISTS ix_amp_agent_run_requests_queue
            ON amp_agent_run_requests(uid, agent_slug, conversation_thread_id, status, created_at, id)
            """,
            "CREATE INDEX IF NOT EXISTS ix_amp_agent_run_requests_dispatched_run_id "
            "ON amp_agent_run_requests(dispatched_run_id)",
        ]
        from yuxi.tenancy.schema import tenant_scope_ddl_statements

        stmts.extend(tenant_scope_ddl_statements())
        async with self.async_engine.begin() as conn:
            for stmt in stmts:
                await conn.execute(text(stmt))
            try:
                from yuxi.tenancy.schema import backfill_tenant_scope

                await backfill_tenant_scope(conn)
            except Exception as exc:
                from yuxi.tenancy.integrity import TenantBackfillIncomplete

                if isinstance(exc, TenantBackfillIncomplete):
                    raise
                logger.warning(f"tenant backfill skipped: {exc}")

    @property
    def is_postgresql(self) -> bool:
        """检查是否是 PostgreSQL 数据库"""
        if not self._initialized:
            return False
        return self.async_engine.dialect.name == "postgresql"

    @asynccontextmanager
    async def get_async_session_context(self):
        """获取异步数据库会话的上下文管理器"""
        self.initialize()  # 确保已初始化
        session = self.AsyncSession()
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            status_code = getattr(e, "status_code", None)
            if not isinstance(status_code, int) or status_code >= 500:
                logger.error(f"PostgreSQL async operation failed: {e}")
            raise
        finally:
            await session.close()

    async def close(self):
        """关闭引擎"""
        if self.async_engine:
            await self.async_engine.dispose()

        if self.langgraph_pool:
            await self.langgraph_pool.close()

    async def commit(self):
        """提交当前会话"""
        self._check_initialized()
        async with self.get_async_session_context():
            pass  # commit is automatic in context manager


# 创建全局 PostgreSQL 管理器实例
pg_manager = PostgresManager()
