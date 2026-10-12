import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI

from yuxi.agents.mcp.service import ensure_builtin_mcp_servers_in_db
from yuxi.services.run_queue_service import close_queue_clients, get_redis_client
from yuxi.storage.postgres.manager import pg_manager
from yuxi.storage.postgres.migrations import wait_for_kjsc_schema
from yuxi.storage.neo4j import close_shared_neo4j_connection
from yuxi.knowledge.runtime import knowledge_base
from yuxi.utils import logger
from yuxi.agents.backends.sandbox import init_sandbox_provider, shutdown_sandbox_provider
from yuxi import get_version
from yuxi.config import config
from yuxi.config.env import validate_required_runtime_env


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan事件管理器"""
    validate_required_runtime_env()

    # 初始化数据库连接
    try:
        pg_manager.initialize()
        await wait_for_kjsc_schema()
        await pg_manager.run_business_maintenance()
    except Exception as e:
        logger.error(f"Failed to initialize database during startup: {e}")
        raise

    # 确保内置 MCP 服务器定义存在于数据库
    try:
        await ensure_builtin_mcp_servers_in_db()
    except Exception as e:
        logger.error(f"Failed to ensure builtin MCP servers during startup: {e}")

    try:
        from yuxi.agents.skills.service import init_builtin_skills

        async with pg_manager.get_async_session_context() as session:
            await init_builtin_skills(session)
    except Exception as e:
        logger.error(f"Failed to initialize builtin skills during startup: {e}")

    try:
        from yuxi.agents.toolkits.service import sync_builtin_tool_directory

        await sync_builtin_tool_directory()
    except Exception as e:
        logger.error(f"Failed to initialize builtin tool directory during startup: {e}")

    try:
        from yuxi.repositories.agent_repository import AgentRepository

        async with pg_manager.get_async_session_context() as session:
            repository = AgentRepository(session)
            await repository.ensure_default_agent()
            await repository.ensure_general_purpose_subagent()
            await repository.ensure_web_search_subagent()
            await repository.ensure_deep_research_agents()
            await repository.ensure_quote_agent()
    except Exception as e:
        logger.error(f"Failed to ensure default agent during startup: {e}")

    # 初始化知识库管理器
    if os.environ.get("LITE_MODE", "").lower() in ("true", "1"):
        logger.info("LITE_MODE enabled, skipping knowledge base initialization")
    else:
        try:
            await knowledge_base.initialize()
        except Exception as e:
            logger.error(f"Failed to initialize knowledge base manager: {e}")

    from yuxi.weknora.flags import require_weknora_base_url

    logger.info(f"WeKnora KB adapter enabled: {require_weknora_base_url()}")

    # 预热 Redis（run 队列）
    try:
        redis = await get_redis_client()
        await redis.ping()
    except Exception as e:
        logger.warning(f"Run queue redis unavailable on startup: {e}")

    # 启动应用级运行时配置同步线程。
    config.start_runtime_sync()

    try:
        init_sandbox_provider()
    except Exception as e:
        logger.error(f"Failed to initialize sandbox provider during startup: {e}")

    logger.info(f"""

    _                    _     _   _
   / \\   __ _  ___ _ __ | |_  | | | | __ _ _ __ _ __   ___  ___ ___
  / _ \\ / _` |/ _ \\ '_ \\| __| | |_| |/ _` | '__| '_ \\ / _ \\/ __/ __|
 / ___ \\ (_| |  __/ | | | |_  |  _  | (_| | |  | | | |  __/\\__ \\__ \\
/_/   \\_\\__, |\\___|_| |_|\\__| |_| |_|\\__,_|_|  |_| |_|\\___||___/___/
        |___/  Agent Harness  v{get_version()}

    """)
    from yuxi.services.chat_usage_sync import chat_usage_sync_loop

    usage_sync_task = asyncio.create_task(chat_usage_sync_loop())
    logger.info("Agent Harness startup complete")
    yield
    usage_sync_task.cancel()
    try:
        await usage_sync_task
    except asyncio.CancelledError:
        pass
    shutdown_sandbox_provider()
    await close_queue_clients()
    close_shared_neo4j_connection()
    await pg_manager.close()
