"""
对话域持久化 Repository（Async）
"""

import uuid as uuid_lib
from copy import deepcopy

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.orm.attributes import flag_modified

from yuxi.tenancy.context import stamp_tenant_id
from yuxi.tenancy.tenant_query import tenant_clauses, visible_or_none
from yuxi.storage.postgres.models_business import Conversation, Message, ToolCall
from yuxi.utils import logger
from yuxi.utils.datetime_utils import utc_now_naive

MAX_CONVERSATION_TITLE_LENGTH = 255
INVOCATION_CONVERSATION_SOURCES = ("agent_call", "agent_evaluation")


class ConversationRepository:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    def _normalize_title(self, title: str | None) -> str | None:
        if title is None:
            return None
        normalized = str(title).strip()
        if not normalized:
            return ""
        if len(normalized) > MAX_CONVERSATION_TITLE_LENGTH:
            logger.warning(
                f"Conversation title too long ({len(normalized)}), truncate to {MAX_CONVERSATION_TITLE_LENGTH}"
            )
            return normalized[:MAX_CONVERSATION_TITLE_LENGTH]
        return normalized

    def _exclude_source_conditions(self, sources: tuple[str, ...]):
        if not sources:
            return []
        source = Conversation.extra_metadata["source"].as_string()
        return [
            or_(
                Conversation.extra_metadata.is_(None),
                source.is_(None),
                source.notin_(sources),
            )
        ]

    async def add_conversation(
        self,
        *,
        uid: str,
        agent_id: str,
        title: str | None = None,
        thread_id: str | None = None,
        metadata: dict | None = None,
    ) -> Conversation:
        """创建对话和统计记录但只 flush，供外层事务继续绑定关系。"""
        if not thread_id:
            thread_id = str(uuid_lib.uuid4())

        metadata = (metadata or {}).copy()
        metadata.setdefault("attachments", [])

        normalized_title = self._normalize_title(title)

        conversation = Conversation(
            thread_id=thread_id,
            uid=str(uid),
            tenant_id=stamp_tenant_id(),
            agent_id=agent_id,
            title=normalized_title or "New Conversation",
            status="active",
            extra_metadata=metadata,
        )

        self.db.add(conversation)
        await self.db.flush()
        from yuxi.services.usage_telemetry import record_session_created

        await record_session_created(self.db, conversation)

        logger.info(f"Created conversation: {conversation.thread_id} for user {uid}")
        return conversation

    async def create_conversation(
        self,
        uid: str,
        agent_id: str,
        title: str | None = None,
        thread_id: str | None = None,
        metadata: dict | None = None,
    ) -> Conversation:
        """创建并提交一个完整对话，适用于不需要外层事务编排的入口。"""
        conversation = await self.add_conversation(
            uid=uid,
            agent_id=agent_id,
            title=title,
            thread_id=thread_id,
            metadata=metadata,
        )
        await self.db.commit()
        await self.db.refresh(conversation)
        return conversation

    async def get_conversation_by_thread_id(self, thread_id: str) -> Conversation | None:
        result = await self.db.execute(select(Conversation).where(Conversation.thread_id == thread_id))
        return visible_or_none(result.scalar_one_or_none())

    async def lock_conversation_by_thread_id(self, thread_id: str) -> Conversation | None:
        """锁定线程根记录，串行化同一对话的调度决策。

        populate_existing 必须带上：否则会话对象已在 identity map 中时，
        FOR UPDATE 取回的最新 extra_metadata 不会覆盖内存里的陈旧副本。
        """
        result = await self.db.execute(
            select(Conversation)
            .where(Conversation.thread_id == thread_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        return visible_or_none(result.scalar_one_or_none())

    async def get_conversation_by_id(self, conversation_id: int) -> Conversation | None:
        result = await self.db.execute(select(Conversation).where(Conversation.id == conversation_id))
        return visible_or_none(result.scalar_one_or_none())

    def _ensure_metadata(self, conversation: Conversation) -> dict:
        metadata = dict(conversation.extra_metadata or {})
        attachments = metadata.get("attachments", [])
        metadata["attachments"] = [dict(item) for item in attachments if isinstance(item, dict)]
        return metadata

    async def _save_metadata(self, conversation: Conversation, metadata: dict) -> None:
        conversation.extra_metadata = metadata
        flag_modified(conversation, "extra_metadata")
        conversation.updated_at = utc_now_naive()
        await self.db.commit()
        await self.db.refresh(conversation)

    async def add_message(
        self,
        conversation_id: int,
        role: str,
        content: str,
        message_type: str = "text",
        extra_metadata: dict | None = None,
        image_content: str | None = None,
        run_id: str | None = None,
        request_id: str | None = None,
        delivery_status: str = "complete",
    ) -> Message:
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            message_type=message_type,
            extra_metadata=extra_metadata or {},
            image_content=image_content,
            run_id=run_id,
            request_id=request_id,
            delivery_status=delivery_status,
        )

        self.db.add(message)
        conversation = await self.get_conversation_by_id(conversation_id)
        if conversation:
            conversation.updated_at = utc_now_naive()
        await self.db.flush()
        from yuxi.services.usage_telemetry import record_message_activity, record_token_usage

        await record_message_activity(self.db, message)
        await self.db.commit()
        await self.db.refresh(message)
        if conversation is not None:
            await record_token_usage(message, conversation)

        logger.debug(f"Added {role} message to conversation {conversation_id}")
        return message

    async def add_message_by_thread_id(
        self,
        thread_id: str,
        role: str,
        content: str,
        message_type: str = "text",
        extra_metadata: dict | None = None,
        image_content: str | None = None,
        run_id: str | None = None,
        request_id: str | None = None,
        delivery_status: str = "complete",
    ) -> Message | None:
        conversation = await self.get_conversation_by_thread_id(thread_id)
        if not conversation:
            logger.warning(f"Conversation not found for thread_id: {thread_id}")
            return None

        return await self.add_message(
            conversation_id=conversation.id,
            role=role,
            content=content,
            message_type=message_type,
            extra_metadata=extra_metadata,
            image_content=image_content,
            run_id=run_id,
            request_id=request_id,
            delivery_status=delivery_status,
        )

    async def add_tool_call(
        self,
        message_id: int,
        tool_name: str,
        tool_input: dict | None = None,
        tool_output: str | None = None,
        status: str = "pending",
        error_message: str | None = None,
        langgraph_tool_call_id: str | None = None,
    ) -> ToolCall:
        if langgraph_tool_call_id:
            existing = await self.get_tool_call_by_langgraph_id(langgraph_tool_call_id)
            if existing:
                logger.debug(
                    "Tool call already exists for langgraph_tool_call_id=%s, skip insert",
                    langgraph_tool_call_id,
                )
                return existing

        tool_call = ToolCall(
            message_id=message_id,
            tool_name=tool_name,
            tool_input=tool_input or {},
            tool_output=tool_output,
            status=status,
            error_message=error_message,
            langgraph_tool_call_id=langgraph_tool_call_id,
        )

        self.db.add(tool_call)
        await self.db.commit()
        await self.db.refresh(tool_call)

        logger.debug(f"Added tool call {tool_name} to message {message_id}")
        return tool_call

    async def get_messages(self, conversation_id: int, limit: int | None = None, offset: int = 0) -> list[Message]:
        query = (
            select(Message)
            .options(
                selectinload(Message.tool_calls),
            )
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
        )

        if limit:
            query = query.limit(limit).offset(offset)

        result = await self.db.execute(query)
        return list(result.scalars().unique().all())

    async def get_messages_by_thread_id(
        self, thread_id: str, limit: int | None = None, offset: int = 0
    ) -> list[Message]:
        conversation = await self.get_conversation_by_thread_id(thread_id)
        if not conversation:
            logger.warning(f"Conversation not found for thread_id: {thread_id}")
            return []

        return await self.get_messages(conversation.id, limit, offset)

    async def list_conversations(
        self,
        uid: str | None = None,
        agent_id: str | None = None,
        status: str = "active",
        limit: int | None = None,
        offset: int = 0,
        exclude_sources: tuple[str, ...] = (),
    ) -> list[Conversation]:
        """List conversations with pinned conversations always included first.

        The limit applies only to non-pinned conversations to ensure pinned
        conversations are always visible in the list.
        """

        base_conditions = [Conversation.status == status]
        if uid:
            base_conditions.append(Conversation.uid == str(uid))
        if agent_id:
            base_conditions.append(Conversation.agent_id == agent_id)
        base_conditions.extend(self._exclude_source_conditions(exclude_sources))
        base_conditions.extend(tenant_clauses(Conversation.tenant_id))

        # First, get all pinned conversations (no limit)
        pinned_query = (
            select(Conversation)
            .where(*base_conditions)
            .where(Conversation.is_pinned)
            .order_by(Conversation.updated_at.desc())
        )
        result = await self.db.execute(pinned_query)
        pinned_conversations = list(result.scalars().all())

        # Then, get non-pinned conversations with limit/offset
        remaining_limit = None
        remaining_offset = offset

        if limit is not None:
            # Calculate how many slots are taken by pinned conversations
            pinned_count = len(pinned_conversations)
            if pinned_count >= limit:
                # All slots taken by pinned conversations
                return pinned_conversations[:limit]
            remaining_limit = limit - pinned_count

        if remaining_limit is not None and remaining_limit > 0:
            non_pinned_query = (
                select(Conversation)
                .where(*base_conditions)
                .where(~Conversation.is_pinned)
                .order_by(Conversation.updated_at.desc())
                .limit(remaining_limit)
                .offset(remaining_offset)
            )
            result = await self.db.execute(non_pinned_query)
            non_pinned_conversations = list(result.scalars().all())
        else:
            non_pinned_conversations = []

        return pinned_conversations + non_pinned_conversations

    async def list_active_conversations_for_user(self, uid: str) -> list[Conversation]:
        """返回用户全部 active 对话，按最近更新时间排序。"""
        result = await self.db.execute(
            select(Conversation)
            .where(
                Conversation.uid == str(uid),
                Conversation.status == "active",
                *tenant_clauses(Conversation.tenant_id),
            )
            .order_by(Conversation.updated_at.desc())
        )
        return list(result.scalars().all())

    async def update_conversation(
        self,
        thread_id: str,
        title: str | None = None,
        status: str | None = None,
        metadata: dict | None = None,
        is_pinned: bool | None = None,
    ) -> Conversation | None:
        conversation = await self.get_conversation_by_thread_id(thread_id)
        if not conversation:
            return None

        normalized_title = self._normalize_title(title)
        if normalized_title is not None:
            conversation.title = normalized_title
        if status is not None:
            conversation.status = status
        if is_pinned is not None:
            conversation.is_pinned = is_pinned

        if metadata is not None:
            current_metadata = dict(conversation.extra_metadata or {})
            current_metadata.update(metadata)
            conversation.extra_metadata = current_metadata

        conversation.updated_at = utc_now_naive()
        await self.db.commit()
        await self.db.refresh(conversation)

        logger.info(f"Updated conversation {thread_id}")
        return conversation

    async def delete_conversation(self, thread_id: str, soft_delete: bool = True) -> bool:
        conversation = await self.get_conversation_by_thread_id(thread_id)
        if not conversation:
            return False

        if soft_delete:
            conversation.status = "deleted"
            await self.db.commit()
            logger.info(f"Soft deleted conversation {thread_id}")
        else:
            self.db.delete(conversation)
            await self.db.commit()
            logger.info(f"Permanently deleted conversation {thread_id}")

        return True

    async def get_tool_call_by_langgraph_id(self, langgraph_tool_call_id: str) -> ToolCall | None:
        result = await self.db.execute(
            select(ToolCall)
            .where(ToolCall.langgraph_tool_call_id == langgraph_tool_call_id)
            .order_by(ToolCall.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def update_tool_call_output(
        self,
        langgraph_tool_call_id: str,
        tool_output: str,
        status: str = "success",
        error_message: str | None = None,
    ) -> ToolCall | None:
        tool_call = await self.get_tool_call_by_langgraph_id(langgraph_tool_call_id)
        if not tool_call:
            logger.warning(f"Tool call not found for langgraph_tool_call_id: {langgraph_tool_call_id}")
            return None

        tool_call.tool_output = tool_output
        tool_call.status = status
        if error_message:
            tool_call.error_message = error_message

        await self.db.commit()
        await self.db.refresh(tool_call)
        from yuxi.services.usage_telemetry import record_tool_finished

        await record_tool_finished(self.db, tool_call)

        logger.debug(f"Updated tool call {langgraph_tool_call_id} with output")
        return tool_call

    async def get_attachments(self, conversation_id: int) -> list[dict]:
        conversation = await self.get_conversation_by_id(conversation_id)
        if not conversation:
            return []
        metadata = self._ensure_metadata(conversation)
        return list(metadata.get("attachments", []))

    async def add_attachments(self, conversation_id: int, attachment_infos: list[dict]) -> list[dict] | None:
        conversation = await self.get_conversation_by_id(conversation_id)
        if not conversation:
            return None

        locked_conversation = await self.lock_conversation_by_thread_id(conversation.thread_id)
        if not locked_conversation or locked_conversation.id != conversation.id:
            return None

        metadata = self._ensure_metadata(locked_conversation)
        attachments = metadata.get("attachments", [])
        incoming_ids = {item.get("file_id") for item in attachment_infos}
        attachments = [item for item in attachments if item.get("file_id") not in incoming_ids]
        attachments.extend(attachment_infos)
        metadata["attachments"] = attachments
        await self._save_metadata(locked_conversation, metadata)
        return attachment_infos

    async def bind_attachment_request_snapshot(
        self,
        conversation_id: int,
        request_id: str,
        file_ids: list[str],
    ) -> tuple[list[dict], list[str], list[str], list[str]]:
        """以行锁建立请求附件快照；缺失/删除/已归属其他请求时显式返回失败清单。"""
        if not request_id or not file_ids:
            return [], [], list(file_ids), []

        conversation = await self.get_conversation_by_id(conversation_id)
        if not conversation:
            return [], [], list(file_ids), []

        file_id_set = {str(file_id).strip() for file_id in file_ids if str(file_id).strip()}
        if not file_id_set:
            return [], [], list(file_ids), []

        locked_conversation = await self.lock_conversation_by_thread_id(conversation.thread_id)
        if not locked_conversation or locked_conversation.id != conversation.id:
            return [], [], list(file_ids), []

        metadata = self._ensure_metadata(locked_conversation)
        attachments = metadata.get("attachments", [])
        changed = False
        bound: list[dict] = []
        missing_ids: list[str] = []
        conflict_ids: list[str] = []
        attachment_by_id: dict[str, dict] = {}
        position_by_id: dict[str, int] = {}
        for position, item in enumerate(attachments):
            if not isinstance(item, dict):
                continue
            file_key = str(item.get("file_id"))
            attachment_by_id[file_key] = item
            position_by_id[file_key] = position
        touched_originals = {
            file_id: deepcopy(attachment_by_id[file_id]) for file_id in file_id_set if file_id in attachment_by_id
        }

        for file_id in file_id_set:
            item = attachment_by_id.get(file_id)
            if item is None:
                missing_ids.append(file_id)
                continue

            existing_request_id = str(item.get("request_id") or "")
            if existing_request_id and existing_request_id != str(request_id):
                conflict_ids.append(file_id)
                continue

            if not existing_request_id:
                # 快照一旦建立，运行期间不再从可变 attachments 元数据取值。
                item["request_id"] = str(request_id)
                item["thread_id"] = locked_conversation.thread_id
                item["request_snapshot"] = self._build_attachment_snapshot(item)
                item["snapshot_created_at"] = utc_now_naive().isoformat()
                changed = True

            bound.append(item)

        if missing_ids or conflict_ids:
            # 失败路径不产生半快照；只还原本次尝试触达的记录，保留同请求其他附件快照。
            for file_id, original_item in touched_originals.items():
                position = position_by_id.get(file_id)
                if position is None:
                    continue
                attachments[position] = original_item
                changed = True

        if changed:
            metadata["attachments"] = attachments
            await self._save_metadata(locked_conversation, metadata)

        ordered_bound = [dict(item) for item in bound]
        return ordered_bound, missing_ids, conflict_ids, []

    @staticmethod
    def _build_attachment_snapshot(item: dict) -> dict:
        """复制附件运行期需要的完整授权与物证信息。

        不复制 markdown 正文：内容已在附件记录里，重复进快照会撑大会话元数据行。
        """
        keys = (
            "file_id",
            "request_id",
            "file_name",
            "file_type",
            "file_size",
            "status",
            "uploaded_at",
            "thread_id",
            "path",
            "artifact_url",
            "storage_path",
            "original_path",
            "original_artifact_url",
            "original_storage_path",
            "minio_url",
            "source_bucket_name",
            "source_object_name",
            "source_minio_url",
            "file_path",
            "truncated",
            "markdown_storage_path",
            "parse_status",
            "parse_error",
            "table_index_path",
            "table_index_artifact_url",
            "table_index_storage_path",
        )
        snapshot = {key: item.get(key) for key in keys if key in item}
        snapshot["snapshot_version"] = 1
        return snapshot

    async def get_attachments_by_request_id(self, conversation_id: int, request_id: str) -> list[dict]:
        conversation = await self.get_conversation_by_id(conversation_id)
        attachments = await self.get_attachments(conversation_id)
        if not conversation:
            return []
        return [
            {**item, "thread_id": conversation.thread_id}
            for item in attachments
            if item.get("request_id") == request_id
        ]

    async def remove_attachment(self, conversation_id: int, file_id: str) -> bool:
        conversation = await self.get_conversation_by_id(conversation_id)
        if not conversation:
            return False

        locked_conversation = await self.lock_conversation_by_thread_id(conversation.thread_id)
        if not locked_conversation or locked_conversation.id != conversation.id:
            return False

        metadata = self._ensure_metadata(locked_conversation)
        attachments = metadata.get("attachments", [])
        new_attachments = [item for item in attachments if item.get("file_id") != file_id]

        if len(new_attachments) == len(attachments):
            return False

        metadata["attachments"] = new_attachments
        await self._save_metadata(locked_conversation, metadata)
        return True
