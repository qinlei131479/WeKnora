"""PostgreSQL 业务数据模型。活跃运行表使用 amp_ 前缀，过渡能力表保留 h_ 前缀。"""

from typing import Any

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    Column,
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    case,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship, synonym
from yuxi.storage.minio.client import normalize_public_minio_url
from yuxi.utils.datetime_utils import format_utc_datetime, utc_now_naive

Base = declarative_base()

JSON_VALUE = JSON().with_variant(JSONB, "postgresql")

MAX_LOGIN_FAILED_ATTEMPTS = 5
LOGIN_LOCK_DURATION_SECONDS = 300
AGENT_RUN_TERMINAL_STATUSES = ("completed", "failed", "cancelled", "interrupted")


class User(Base):
    """WeKnora `users` 表。uid 与 id 同为 UUID；role 由中间件按成员资格写入。"""

    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True)
    username = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    avatar = Column(String(500), nullable=True)
    tenant_id = Column(BigInteger, nullable=True)
    is_active = Column(Boolean, default=True)
    can_access_all_tenants = Column(Boolean, default=False)
    is_system_admin = Column(Boolean, default=False)
    preferences = Column(JSON_VALUE, nullable=True)
    created_at = Column(DateTime, default=utc_now_naive)
    updated_at = Column(DateTime, default=utc_now_naive, onupdate=utc_now_naive)
    deleted_at = Column(DateTime, nullable=True)

    uid = synonym("id")

    def __init__(self, **kwargs: Any):
        uid = kwargs.pop("uid", None)
        if uid is not None and kwargs.get("id") is None:
            kwargs["id"] = uid
        role = kwargs.pop("role", None)
        kwargs.pop("department_id", None)
        kwargs.pop("phone_number", None)
        kwargs.pop("is_deleted", None)
        kwargs.pop("last_login", None)
        kwargs.pop("login_failed_count", None)
        kwargs.pop("last_failed_login", None)
        kwargs.pop("login_locked_until", None)
        kwargs.pop("department", None)
        if not kwargs.get("email"):
            name = str(kwargs.get("username") or "user")
            kwargs["email"] = f"{name}@local.invalid"
        if kwargs.get("password_hash") is None:
            kwargs["password_hash"] = ""
        super().__init__(**kwargs)
        object.__setattr__(self, "_role", role)

    @hybrid_property
    def is_deleted(self) -> int:
        return 1 if self.deleted_at is not None else 0

    @is_deleted.expression
    def is_deleted(cls):
        return case((cls.deleted_at.isnot(None), 1), else_=0)

    @property
    def role(self) -> str:
        stored = getattr(self, "_role", None)
        if stored:
            return str(stored)
        if self.is_system_admin or self.can_access_all_tenants:
            return "superadmin"
        return "user"

    @role.setter
    def role(self, value: str) -> None:
        object.__setattr__(self, "_role", value)

    @property
    def department_id(self) -> None:
        return None

    @property
    def phone_number(self) -> None:
        return None

    def to_dict(self, include_password: bool = False) -> dict[str, Any]:
        result = {
            "id": self.id,
            "username": self.username,
            "uid": self.uid,
            "email": self.email,
            "phone_number": None,
            "avatar": normalize_public_minio_url(self.avatar),
            "role": self.role,
            "department_id": None,
            "created_at": format_utc_datetime(self.created_at),
            "last_login": None,
            "is_deleted": self.is_deleted,
            "deleted_at": format_utc_datetime(self.deleted_at),
        }
        if include_password:
            result["password_hash"] = self.password_hash
        return result


class Agent(Base):
    """用户可管理、可授权、可切换的智能体。"""

    __tablename__ = "amp_agents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String(80), nullable=False, index=True)
    backend_id = Column(String(64), nullable=False, index=True)

    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(255), nullable=True)

    pics = Column(JSON, nullable=False, default=list)
    config_json = Column(JSON, nullable=False, default=dict)
    share_config = Column(JSON_VALUE, nullable=False)

    is_default = Column(Boolean, nullable=False, default=False, index=True)
    is_subagent = Column(Boolean, nullable=False, default=False, index=True)

    created_by = Column(String(64), nullable=True, index=True)
    updated_by = Column(String(64), nullable=True)
    tenant_id = Column(BigInteger, nullable=True, index=True)
    created_at = Column(DateTime, default=utc_now_naive)
    updated_at = Column(DateTime, default=utc_now_naive, onupdate=utc_now_naive)

    __table_args__ = (
        Index("uq_amp_agents_default", "is_default", unique=True, postgresql_where=is_default.is_(True)),
        Index("uq_amp_agents_slug_tenant", "tenant_id", "slug", unique=True, postgresql_where=tenant_id.isnot(None)),
        Index("uq_amp_agents_slug_catalog", "slug", unique=True, postgresql_where=tenant_id.is_(None)),
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "slug": self.slug,
            "agent_id": self.slug,
            "backend_id": self.backend_id,
            "name": self.name,
            "description": self.description,
            "icon": normalize_public_minio_url(self.icon),
            "pics": [normalize_public_minio_url(pic) for pic in (self.pics or [])],
            "config_json": self.config_json or {},
            "share_config": self.share_config or {},
            "is_default": bool(self.is_default),
            "is_subagent": bool(self.is_subagent),
            "created_by": self.created_by,
            "updated_by": self.updated_by,
            "created_at": format_utc_datetime(self.created_at),
            "updated_at": format_utc_datetime(self.updated_at),
        }


class Conversation(Base):
    """Conversation table - 对话表"""

    __tablename__ = "amp_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="Primary key")
    thread_id = Column(String(64), unique=True, index=True, nullable=False, comment="Thread ID (UUID)")
    uid = Column(String(64), index=True, nullable=False, comment="UID")
    tenant_id = Column(BigInteger, nullable=True, index=True, comment="WeKnora tenant_id")
    # 历史字段名，实际保存的是 Agent.slug。
    agent_id = Column(String(64), index=True, nullable=False, comment="Agent slug (legacy column name: agent_id)")
    title = Column(String(255), nullable=True, comment="Conversation title")
    status = Column(String(20), default="active", comment="Status: active/archived/deleted")
    is_pinned = Column(Boolean, default=False, nullable=False, index=True, comment="Is pinned to top")
    created_at = Column(DateTime, default=utc_now_naive, comment="Creation time")
    updated_at = Column(DateTime, default=utc_now_naive, onupdate=utc_now_naive, comment="Update time")
    extra_metadata = Column(JSON, nullable=True, comment="Additional metadata")

    # Relationships
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

    def to_dict(self) -> dict[str, Any]:
        metadata = self.extra_metadata or {}
        return {
            "id": self.id,
            "thread_id": self.thread_id,
            "uid": self.uid,
            "agent_id": self.agent_id,
            "title": self.title,
            "status": self.status,
            "is_pinned": bool(self.is_pinned),
            "created_at": format_utc_datetime(self.created_at),
            "updated_at": format_utc_datetime(self.updated_at),
            "metadata": metadata,
        }


class SubagentThread(Base):
    """SubagentThread table - 子智能体长期线程归属关系表"""

    __tablename__ = "amp_subagent_threads"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="Primary key")
    uid = Column(String(64), index=True, nullable=False, comment="UID")
    tenant_id = Column(BigInteger, nullable=True, index=True)
    parent_conversation_id = Column(
        Integer, ForeignKey("amp_sessions.id"), nullable=False, index=True, comment="Parent conversation ID"
    )
    child_conversation_id = Column(
        Integer,
        ForeignKey("amp_sessions.id"),
        nullable=False,
        unique=True,
        index=True,
        comment="Child conversation ID",
    )
    child_thread_id = Column(String(64), nullable=False, unique=True, index=True, comment="Child thread ID")
    subagent_slug = Column(String(64), nullable=False, index=True, comment="Subagent slug")
    created_by_run_id = Column(String(64), nullable=False, index=True, comment="Run that created this subagent thread")
    created_at = Column(DateTime, default=utc_now_naive, comment="Creation time")
    updated_at = Column(DateTime, default=utc_now_naive, onupdate=utc_now_naive, comment="Update time")

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "uid": self.uid,
            "parent_conversation_id": self.parent_conversation_id,
            "child_conversation_id": self.child_conversation_id,
            "child_thread_id": self.child_thread_id,
            "subagent_slug": self.subagent_slug,
            "created_by_run_id": self.created_by_run_id,
            "created_at": format_utc_datetime(self.created_at),
            "updated_at": format_utc_datetime(self.updated_at),
        }


class BuiltinTool(Base):
    """内置工具只读目录；代码注册表是定义源，数据库只承载统一查询与统计。"""

    __tablename__ = "amp_builtin_tools"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tool_slug = Column(String(128), nullable=False, index=True)
    capability_key = Column(String(191), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False, default="")
    category = Column(String(64), nullable=False, default="general", index=True)
    input_schema = Column(JSON_VALUE, nullable=False, default=dict)
    enabled = Column(Boolean, nullable=False, default=True)
    source = Column(String(32), nullable=False, default="work")
    version = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=utc_now_naive)
    updated_at = Column(DateTime, default=utc_now_naive, onupdate=utc_now_naive)

    __table_args__ = (
        CheckConstraint("source IN ('chat', 'work')", name="ck_amp_builtin_tools_source"),
        Index("uq_amp_builtin_tools_slug_source", "tool_slug", "source", unique=True),
    )


class SkillRuntime:
    """目录行的内存视图。扩展字段已经在 tenant_skill_catalog 上，不再落 amp_skill_runtime。"""

    def __init__(self, **kwargs: Any) -> None:
        defaults: dict[str, Any] = {
            "app_core_skill_id": None,
            "tenant_id": None,
            "slug": "",
            "source_type": "chat",
            "tool_dependencies": [],
            "mcp_dependencies": [],
            "skill_dependencies": [],
            "dir_path": "",
            "share_config": {},
            "enabled": True,
            "created_by": None,
            "updated_by": None,
            "created_at": None,
            "updated_at": None,
        }
        defaults.update(kwargs)
        for key, value in defaults.items():
            setattr(self, key, value)


class TenantSkillCatalog(Base):
    """工作空间技能目录，内置技能 tenant_id 为 0。"""

    __tablename__ = "tenant_skill_catalog"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True)
    tenant_id = Column(BigInteger, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    version = Column(String(64))
    description = Column(Text)
    instructions = Column(Text)
    bundle_ref = Column(String(1024))
    bundle_sha256 = Column(String(64))
    source_type = Column(String(16), nullable=False, default="chat")
    tool_dependencies = Column(JSON_VALUE, nullable=False, default=list)
    mcp_dependencies = Column(JSON_VALUE, nullable=False, default=list)
    skill_dependencies = Column(JSON_VALUE, nullable=False, default=list)
    share_config = Column(JSON_VALUE, nullable=False, default=dict)
    enabled = Column(Boolean, nullable=False, default=True)
    created_by = Column(String(64))
    updated_by = Column(String(64))
    source_mtime = Column(DateTime(timezone=True))
    created_at = Column(DateTime, default=utc_now_naive)
    updated_at = Column(DateTime, default=utc_now_naive, onupdate=utc_now_naive)
    deleted_at = Column(DateTime)


class TenantSandboxConfig(Base):
    """沙箱配置，只读取技能页安装需要的列。"""

    __tablename__ = "tenant_sandbox_configs"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True)
    tenant_id = Column(BigInteger, nullable=False)
    name = Column(String(255))
    sandbox_type = Column(String(64))
    deleted_at = Column(DateTime)


class TenantSkillInstall(Base):
    """技能在某个沙箱上的安装记录。"""

    __tablename__ = "tenant_skills"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True)
    tenant_id = Column(BigInteger, nullable=False)
    sandbox_config_id = Column(String(36), nullable=False)
    catalog_id = Column(String(36))
    name = Column(String(255), nullable=False)
    version = Column(String(64))
    description = Column(Text)
    bundle_sha256 = Column(String(64))
    installed_snapshot_id = Column(String(255))
    install_session_id = Column(String(36))
    install_message_id = Column(String(36))
    envs = Column(JSON)
    enabled = Column(Boolean, nullable=False, default=True)
    status = Column(String(32), nullable=False)
    error = Column(Text)
    installing_since = Column(DateTime(timezone=True))
    created_at = Column(DateTime, default=utc_now_naive)
    updated_at = Column(DateTime, default=utc_now_naive, onupdate=utc_now_naive)
    deleted_at = Column(DateTime)


class Message(Base):
    """Message table - 消息表"""

    __tablename__ = "amp_messages"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="Primary key")
    conversation_id = Column(
        Integer, ForeignKey("amp_sessions.id"), nullable=False, index=True, comment="Conversation ID"
    )
    role = Column(String(20), nullable=False, comment="Message role: user/assistant/system/tool")
    content = Column(Text, nullable=False, comment="Message content")
    message_type = Column(String(30), default="text", comment="Message type: text/tool_call/tool_result")
    created_at = Column(DateTime, default=utc_now_naive, comment="Creation time")
    token_count = Column(Integer, nullable=True, comment="Token count (optional)")
    extra_metadata = Column(JSON, nullable=True, comment="Additional metadata (complete message dump)")
    image_content = Column(Text, nullable=True, comment="Base64 encoded image content for multimodal messages")
    run_id = Column(String(64), ForeignKey("amp_agent_runs.id"), nullable=True, index=True, comment="Agent run ID")
    request_id = Column(String(64), nullable=True, index=True, comment="Request ID for idempotency")
    delivery_status = Column(String(32), nullable=False, default="complete", comment="Message status")

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    tool_calls = relationship("ToolCall", back_populates="message", cascade="all, delete-orphan")

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "conversation_id": self.conversation_id,
            "role": self.role,
            "content": self.content,
            "message_type": self.message_type,
            "created_at": format_utc_datetime(self.created_at),
            "token_count": self.token_count,
            "metadata": self.extra_metadata or {},
            "image_content": self.image_content,
            "run_id": self.run_id,
            "request_id": self.request_id,
            "status": self.delivery_status,
            "tool_calls": [tc.to_dict() for tc in self.tool_calls] if self.tool_calls else [],
        }


class ToolCall(Base):
    """ToolCall table - 工具调用表"""

    __tablename__ = "amp_tool_calls"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="Primary key")
    message_id = Column(Integer, ForeignKey("amp_messages.id"), nullable=False, index=True, comment="Message ID")
    langgraph_tool_call_id = Column(String(100), nullable=True, index=True, comment="LangGraph tool_call_id")
    tool_name = Column(String(100), nullable=False, comment="Tool name")
    tool_input = Column(JSON, nullable=True, comment="Tool input parameters")
    tool_output = Column(Text, nullable=True, comment="Tool execution result")
    status = Column(String(20), default="pending", comment="Status: pending/success/error")
    error_message = Column(Text, nullable=True, comment="Error message if failed")
    created_at = Column(DateTime, default=utc_now_naive, comment="Creation time")

    # Relationships
    message = relationship("Message", back_populates="tool_calls")

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "message_id": self.message_id,
            "langgraph_tool_call_id": self.langgraph_tool_call_id,
            "tool_name": self.tool_name,
            "tool_input": self.tool_input or {},
            "tool_output": self.tool_output,
            "status": self.status,
            "error_message": self.error_message,
            "created_at": format_utc_datetime(self.created_at),
        }


class OperationLog(Base):
    """操作日志模型"""

    __tablename__ = "amp_audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), nullable=True)
    operation = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=utc_now_naive)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "operation": self.operation,
            "details": self.details,
            "ip_address": self.ip_address,
            "timestamp": format_utc_datetime(self.timestamp),
        }


class AgentRun(Base):
    """AgentRun table - 运行任务表"""

    __tablename__ = "amp_agent_runs"

    id = Column(String(64), primary_key=True, comment="Run ID (UUID)")
    conversation_thread_id = Column(String(64), index=True, nullable=False, comment="Conversation thread ID snapshot")
    agent_slug = Column(String(64), index=True, nullable=False, comment="Agent slug")
    uid = Column(String(64), index=True, nullable=False, comment="UID")
    tenant_id = Column(BigInteger, nullable=True, index=True)
    status = Column(
        String(32),
        index=True,
        nullable=False,
        default="pending",
        comment="Run status: pending/running/completed/failed/cancel_requested/cancelled/interrupted",
    )
    request_id = Column(String(64), unique=True, index=True, nullable=False, comment="Idempotency request ID")
    source = Column(String(32), nullable=False, default="chat", comment="Run source snapshot")
    channel = Column(String(32), nullable=False, default="web", comment="Run channel snapshot")
    external_id = Column(String(128), nullable=True, index=True, comment="Source-specific external ID snapshot")
    origin_metadata = Column(JSON, nullable=False, default=dict, comment="Immutable origin metadata snapshot")
    conversation_id = Column(
        Integer, ForeignKey("amp_sessions.id"), nullable=True, index=True, comment="Conversation ID"
    )
    created_by_run_id = Column(String(64), nullable=True, index=True, comment="Run that created this run")
    subagent_thread_relation_id = Column(
        Integer,
        ForeignKey("amp_subagent_threads.id"),
        nullable=True,
        index=True,
        comment="Subagent thread relation record ID",
    )
    run_type = Column(
        String(32),
        nullable=False,
        default="chat",
        comment="Run type: chat/resume/subagent",
    )
    input_message_id = Column(Integer, nullable=True, comment="Input message ID")
    output_message_id = Column(Integer, nullable=True, comment="Output message ID")
    last_event_id = Column(String(64), nullable=True, comment="Last Redis stream event ID")
    input_payload = Column(JSON, nullable=False, default=dict, comment="Original input payload")
    error_type = Column(String(64), nullable=True, comment="Error type")
    error_message = Column(Text, nullable=True, comment="Error message")
    started_at = Column(DateTime, nullable=True, comment="Start time")
    finished_at = Column(DateTime, nullable=True, comment="Finish time")
    created_at = Column(DateTime, default=utc_now_naive, comment="Creation time")
    updated_at = Column(DateTime, default=utc_now_naive, onupdate=utc_now_naive, comment="Update time")

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "conversation_thread_id": self.conversation_thread_id,
            "agent_slug": self.agent_slug,
            "uid": self.uid,
            "status": self.status,
            "request_id": self.request_id,
            "source": self.source,
            "channel": self.channel,
            "external_id": self.external_id,
            "origin_metadata": self.origin_metadata or {},
            "conversation_id": self.conversation_id,
            "created_by_run_id": self.created_by_run_id,
            "subagent_thread_relation_id": self.subagent_thread_relation_id,
            "run_type": self.run_type,
            "input_message_id": self.input_message_id,
            "output_message_id": self.output_message_id,
            "last_event_id": self.last_event_id,
            "input_payload": self.input_payload or {},
            "error_type": self.error_type,
            "error_message": self.error_message,
            "started_at": format_utc_datetime(self.started_at),
            "finished_at": format_utc_datetime(self.finished_at),
            "created_at": format_utc_datetime(self.created_at),
            "updated_at": format_utc_datetime(self.updated_at),
        }


Index(
    "uq_amp_agent_runs_one_active_per_thread",
    AgentRun.uid,
    AgentRun.agent_slug,
    AgentRun.conversation_thread_id,
    unique=True,
    postgresql_where=AgentRun.status.notin_(AGENT_RUN_TERMINAL_STATUSES),
    sqlite_where=AgentRun.status.notin_(AGENT_RUN_TERMINAL_STATUSES),
)


class AgentRunRequest(Base):
    """AgentRunRequest table - 智能体线程请求队列表。

    表示一次用户/外部请求；派发后由对应 AgentRun 表达执行状态。
    外部统一以 request_id 作为幂等键引用；id 为自增主键，仅用于 FIFO 排序。
    """

    __tablename__ = "amp_agent_run_requests"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="Primary key")
    request_id = Column(String(64), unique=True, index=True, nullable=False, comment="幂等请求 ID")
    uid = Column(String(64), nullable=False, comment="UID")
    tenant_id = Column(BigInteger, nullable=True, index=True)
    agent_slug = Column(String(64), nullable=False, comment="Agent slug")
    conversation_thread_id = Column(String(64), nullable=False, comment="Conversation thread ID")
    source = Column(String(32), nullable=False, default="chat", comment="请求来源: chat/agent_call/eval")
    channel = Column(String(32), nullable=False, default="web", comment="请求通道: web/api/im/internal")
    external_id = Column(String(128), nullable=True, index=True, comment="来源侧消息或调用 ID")
    origin_metadata = Column(JSON, nullable=False, default=dict, comment="来源 metadata 快照")
    queue_policy = Column(
        String(16),
        nullable=False,
        default="enqueue",
        comment="排队策略: enqueue/reject/steer",
    )
    status = Column(
        String(32),
        nullable=False,
        default="queued",
        comment="请求状态: queued/dispatched/cancelled/rejected/failed",
    )
    input_message_id = Column(
        Integer,
        ForeignKey("amp_messages.id"),
        nullable=False,
        comment="关联输入消息 ID",
    )
    dispatched_run_id = Column(
        String(64),
        ForeignKey("amp_agent_runs.id"),
        nullable=True,
        comment="已派发的 AgentRun ID",
    )
    input_payload = Column(JSON, nullable=False, default=dict, comment="原始输入载荷快照")
    error_message = Column(Text, nullable=True, comment="rejected/failed 时的错误信息")
    created_at = Column(DateTime, nullable=False, default=utc_now_naive, comment="创建时间")
    dispatched_at = Column(DateTime, nullable=True, comment="派发时间")
    updated_at = Column(
        DateTime,
        nullable=False,
        default=utc_now_naive,
        onupdate=utc_now_naive,
        comment="更新时间",
    )

    # Relationships
    input_message = relationship("Message", foreign_keys=[input_message_id])
    dispatched_run = relationship("AgentRun", foreign_keys=[dispatched_run_id])

    def to_dict(self) -> dict[str, Any]:
        return {
            "request_id": self.request_id,
            "uid": self.uid,
            "agent_slug": self.agent_slug,
            "thread_id": self.conversation_thread_id,
            "source": self.source,
            "channel": self.channel,
            "external_id": self.external_id,
            "origin_metadata": self.origin_metadata or {},
            "queue_policy": self.queue_policy,
            "status": self.status,
            "input_message_id": self.input_message_id,
            "dispatched_run_id": self.dispatched_run_id,
            "error_message": self.error_message,
            "created_at": format_utc_datetime(self.created_at),
            "dispatched_at": format_utc_datetime(self.dispatched_at),
            "updated_at": format_utc_datetime(self.updated_at),
        }


Index(
    "ix_amp_agent_run_requests_queue",
    AgentRunRequest.uid,
    AgentRunRequest.agent_slug,
    AgentRunRequest.conversation_thread_id,
    AgentRunRequest.status,
    AgentRunRequest.created_at,
    AgentRunRequest.id,
)


class MCPService(Base):
    """平台 MCP 服务，对应 mcp_services。"""

    __tablename__ = "mcp_services"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    enabled = Column(Boolean, default=True)
    transport_type = Column(String(50), nullable=False)
    url = Column(String(512), nullable=True)
    headers = Column(JSON_VALUE, nullable=True)
    auth_config = Column(JSON_VALUE, nullable=True)
    advanced_config = Column(JSON_VALUE, nullable=True)
    stdio_config = Column(JSON_VALUE, nullable=True)
    env_vars = Column(JSON_VALUE, nullable=True)
    created_at = Column(DateTime, default=utc_now_naive)
    updated_at = Column(DateTime, default=utc_now_naive, onupdate=utc_now_naive)
    deleted_at = Column(DateTime, nullable=True, index=True)
    is_builtin = Column(Boolean, nullable=False, default=False)
    usage_instructions = Column(Text, nullable=False, default="")


class MCPToolApproval(Base):
    """MCP 工具开关，对应 mcp_tool_approvals。"""

    __tablename__ = "mcp_tool_approvals"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True)
    tenant_id = Column(Integer, nullable=False)
    service_id = Column(String(36), nullable=False, index=True)
    tool_name = Column(String(512), nullable=False)
    require_approval = Column(Boolean, nullable=False, default=False)
    enabled = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=utc_now_naive)
    updated_at = Column(DateTime, default=utc_now_naive, onupdate=utc_now_naive)


class MCPMetadata(Base):
    """MCP 工具目录快照，对应 mcp_metadata。"""

    __tablename__ = "mcp_metadata"
    __table_args__ = {"extend_existing": True}

    tenant_id = Column(BigInteger, primary_key=True)
    service_id = Column(String(36), primary_key=True)
    principal = Column(String(255), primary_key=True, default="")
    config_fingerprint = Column(String(64), nullable=False)
    tools = Column(JSON_VALUE, nullable=False)
    instructions = Column(Text, nullable=False, default="")
    server_name = Column(Text, nullable=False, default="")
    server_version = Column(Text, nullable=False, default="")
    server_description = Column(Text, nullable=False, default="")
    synced_at = Column(DateTime(timezone=True), nullable=False)


class MCPOAuthClient(Base):
    """MCP OAuth 动态注册客户端，对应 mcp_oauth_clients。"""

    __tablename__ = "mcp_oauth_clients"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True)
    tenant_id = Column(Integer, nullable=False)
    service_id = Column(String(36), nullable=False, index=True)
    client_id = Column(String(512), nullable=False)
    client_secret = Column(Text, nullable=True)
    redirect_uri = Column(String(1024), nullable=True)
    created_at = Column(DateTime, default=utc_now_naive)
    updated_at = Column(DateTime, default=utc_now_naive, onupdate=utc_now_naive)


class MCPOAuthToken(Base):
    """MCP OAuth 用户令牌，对应 mcp_oauth_tokens。"""

    __tablename__ = "mcp_oauth_tokens"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True)
    tenant_id = Column(Integer, nullable=False)
    user_id = Column(String(512), nullable=False, index=True)
    service_id = Column(String(36), nullable=False, index=True)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_type = Column(String(32), nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now_naive)
    updated_at = Column(DateTime, default=utc_now_naive, onupdate=utc_now_naive)
    principal_type = Column(String(32), nullable=False)
    principal_id = Column(String(512), nullable=False)
    refresh_lease_id = Column(String(36), nullable=True)
    refresh_lease_until = Column(DateTime(timezone=True), nullable=True)


class AgentUsageEvent(Base):
    """运行生命周期事实。只追加，不回改历史。"""

    __tablename__ = "amp_agent_usage_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(64), nullable=False, unique=True)
    tenant_id = Column(BigInteger, nullable=True, index=True)
    uid = Column(String(64), nullable=False)
    agent_id = Column(String(64), nullable=False)
    run_id = Column(String(64), nullable=True)
    session_id = Column(Integer, nullable=True)
    event_type = Column(String(32), nullable=False)
    run_type = Column(String(32), nullable=False, default="chat")
    is_subagent = Column(Boolean, nullable=False, default=False)
    status = Column(String(32), nullable=False)
    duration_ms = Column(BigInteger, nullable=True)
    retry_count = Column(Integer, nullable=False, default=0)
    error_type = Column(String(64), nullable=True)
    error_message = Column(Text, nullable=True)
    event_metadata = Column(JSON_VALUE, nullable=False, default=dict)
    usage_side = Column(String(16), nullable=False, default="work", server_default="work")
    channel = Column(String(50), nullable=False, default="", server_default="")
    external_session_id = Column(String(64), nullable=True)
    occurred_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now_naive)


class ToolUsageEvent(Base):
    """工具调用事实。capability_type 为 builtin、mcp 或 skill。"""

    __tablename__ = "amp_tool_usage_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(64), nullable=False, unique=True)
    tenant_id = Column(BigInteger, nullable=True, index=True)
    uid = Column(String(64), nullable=False)
    agent_id = Column(String(64), nullable=False)
    run_id = Column(String(64), nullable=True)
    session_id = Column(Integer, nullable=True)
    message_id = Column(Integer, nullable=True)
    tool_call_id = Column(Integer, nullable=True)
    capability_type = Column(String(32), nullable=False, default="builtin")
    tool_name = Column(String(255), nullable=False)
    status = Column(String(32), nullable=False)
    duration_ms = Column(BigInteger, nullable=True)
    error_type = Column(String(64), nullable=True)
    error_code = Column(String(64), nullable=True)
    event_metadata = Column(JSON_VALUE, nullable=False, default=dict)
    usage_side = Column(String(16), nullable=False, default="work", server_default="work")
    channel = Column(String(50), nullable=False, default="", server_default="")
    external_session_id = Column(String(64), nullable=True)
    occurred_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now_naive)


class TokenUsageEvent(Base):
    """模型 token 事实。一次模型返回写一行。"""

    __tablename__ = "amp_token_usage_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(64), nullable=False, unique=True)
    tenant_id = Column(BigInteger, nullable=True, index=True)
    uid = Column(String(64), nullable=False)
    agent_id = Column(String(64), nullable=False)
    run_id = Column(String(64), nullable=True)
    session_id = Column(Integer, nullable=True)
    message_id = Column(Integer, nullable=True)
    model = Column(String(128), nullable=False)
    prompt_tokens = Column(BigInteger, nullable=False, default=0)
    completion_tokens = Column(BigInteger, nullable=False, default=0)
    total_tokens = Column(BigInteger, nullable=False, default=0)
    event_metadata = Column(JSON_VALUE, nullable=False, default=dict)
    usage_side = Column(String(16), nullable=False, default="work", server_default="work")
    channel = Column(String(50), nullable=False, default="", server_default="")
    external_session_id = Column(String(64), nullable=True)
    occurred_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now_naive)


class AgentUsageDaily(Base):
    """按天、租户、智能体聚合。score 供最佳智能体排序。"""

    __tablename__ = "amp_agent_usage_daily"

    id = Column(Integer, primary_key=True, autoincrement=True)
    stat_date = Column(Date, nullable=False)
    tenant_id = Column(BigInteger, nullable=False)
    agent_id = Column(String(64), nullable=False)
    usage_side = Column(String(16), nullable=False, default="work", server_default="work")
    session_count = Column(BigInteger, nullable=False, default=0)
    message_count = Column(BigInteger, nullable=False, default=0)
    run_count = Column(BigInteger, nullable=False, default=0)
    success_count = Column(BigInteger, nullable=False, default=0)
    failure_count = Column(BigInteger, nullable=False, default=0)
    cancelled_count = Column(BigInteger, nullable=False, default=0)
    tool_call_count = Column(BigInteger, nullable=False, default=0)
    tool_success_count = Column(BigInteger, nullable=False, default=0)
    total_duration_ms = Column(BigInteger, nullable=False, default=0)
    max_duration_ms = Column(BigInteger, nullable=False, default=0)
    prompt_tokens = Column(BigInteger, nullable=False, default=0)
    completion_tokens = Column(BigInteger, nullable=False, default=0)
    total_tokens = Column(BigInteger, nullable=False, default=0)
    score = Column(Float, nullable=False, default=0)
    computed_at = Column(DateTime(timezone=True), nullable=False, default=utc_now_naive)

    __table_args__ = (
        Index(
            "uq_amp_agent_usage_daily_dimensions",
            "stat_date",
            "tenant_id",
            "agent_id",
            "usage_side",
            unique=True,
        ),
    )
