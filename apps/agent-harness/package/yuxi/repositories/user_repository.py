"""用户数据访问层 - Repository"""

from datetime import UTC
from datetime import datetime as dt
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from yuxi.storage.postgres.manager import pg_manager
from yuxi.storage.postgres.models_business import User


def _utc_now() -> dt:
    # 使用 naive datetime 以匹配 PostgreSQL TIMESTAMP WITHOUT TIME ZONE 列
    return dt.now(UTC).replace(tzinfo=None)


class UserRepository:
    """用户数据访问层"""

    async def get_by_id_with_db(self, db: AsyncSession, id: int) -> User | None:
        """使用指定的 db 根据 ID 获取用户"""
        result = await db.execute(select(User).where(User.id == id))
        return result.scalar_one_or_none()

    async def get_by_uid(self, uid: str) -> User | None:
        """根据 uid 获取用户"""
        async with pg_manager.get_async_session_context() as session:
            return await self.get_by_uid_with_db(session, uid)

    async def get_by_uid_with_db(self, db: AsyncSession, uid: str) -> User | None:
        """使用指定的 db 获取用户"""
        result = await db.execute(select(User).where(User.uid == uid))
        return result.scalar_one_or_none()

    async def list_by_uids(self, uids: list[str]) -> list[User]:
        """批量获取指定 uid 的用户。"""
        normalized_uids = sorted({str(uid).strip() for uid in uids if str(uid).strip()})
        if not normalized_uids:
            return []

        async with pg_manager.get_async_session_context() as session:
            result = await session.execute(select(User).where(User.uid.in_(normalized_uids)))
            return list(result.scalars().all())

    async def create(self, data: dict[str, Any]) -> User:
        """创建用户"""
        async with pg_manager.get_async_session_context() as session:
            user = User(**data)
            session.add(user)
            await session.commit()
            await session.refresh(user)
        return user

    async def update(self, id: int, data: dict[str, Any]) -> User | None:
        """更新用户"""
        async with pg_manager.get_async_session_context() as session:
            result = await session.execute(select(User).where(User.id == id, User.is_deleted == 0))
            user = result.scalar_one_or_none()
            if user is None:
                return None
            for key, value in data.items():
                if key != "id":
                    setattr(user, key, value)
        return user

    async def soft_delete(self, id: int, username: str | None = None) -> bool:
        """软删除用户"""
        async with pg_manager.get_async_session_context() as session:
            result = await session.execute(select(User).where(User.id == id, User.is_deleted == 0))
            user = result.scalar_one_or_none()
            if user is None:
                return False
            user.is_deleted = 1

            user.deleted_at = _utc_now()
            if username:
                import hashlib

                hash_suffix = hashlib.sha256(user.uid.encode()).hexdigest()[:4]
                user.username = f"已注销用户-{hash_suffix}"
        return True

    async def count(self) -> int:
        """统计用户数量"""
        async with pg_manager.get_async_session_context() as session:
            query = select(func.count(User.id)).where(User.is_deleted == 0)
            result = await session.execute(query)
            return result.scalar() or 0

