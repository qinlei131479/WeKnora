from __future__ import annotations

import httpx
import pytest

import live_api_cleanup
from live_api_cleanup import cleanup_e2e_chat_resources
from live_api_cleanup import remove_e2e_thread_storage

pytestmark = pytest.mark.asyncio


async def test_cleanup_deletes_e2e_threads_before_temporary_agents(tmp_path, monkeypatch):
    """只删除 E2E 标记的对话和智能体，并允许资源已经不存在。"""

    deleted_paths: list[str] = []
    monkeypatch.setattr(live_api_cleanup.conf, "save_dir", str(tmp_path))
    (tmp_path / "threads" / "thread-viewer").mkdir(parents=True)
    (tmp_path / "threads" / "thread-marked").mkdir(parents=True)
    responses: dict[str, object] = {
        "/api/chat/threads": [
            {
                "id": "thread-viewer",
                "title": "viewer-fs-e2e-deadbeef",
                "agent_id": "default-chatbot",
                "metadata": {"_yuxi_e2e": True, "test": "viewer-fs-e2e"},
            },
            {
                "id": "thread-user",
                "title": "用户自己的对话",
                "agent_id": "default-chatbot",
                "metadata": {},
            },
            {
                "id": "thread-marked",
                "title": "未使用固定前缀",
                "agent_id": "e2e-main-deadbeef",
                "metadata": {"_yuxi_e2e": True, "marker": "YUXI_SUBAGENT_STREAM_E2E_deadbeef"},
            },
        ],
        "/api/agent": {
            "agents": [
                {"slug": "e2e-main-deadbeef", "created_by": "test-user"},
                {"slug": "e2e-main-other-user", "created_by": "other-user"},
                {"slug": "default-chatbot", "created_by": "test-user"},
            ]
        },
    }

    def handle_request(request: httpx.Request) -> httpx.Response:
        """返回对话与智能体清理 API 的最小响应。"""

        if request.method == "DELETE":
            deleted_paths.append(request.url.path)
            return httpx.Response(200, json={})
        return httpx.Response(200, json=responses[request.url.path])

    async with httpx.AsyncClient(transport=httpx.MockTransport(handle_request), base_url="http://test") as client:
        await cleanup_e2e_chat_resources(
            client,
            {"Authorization": "test"},
            owner_uid="test-user",
            thread_storage_statuses={},
        )

    assert deleted_paths == [
        "/api/chat/thread/thread-viewer",
        "/api/chat/thread/thread-marked",
        "/api/agent/e2e-main-deadbeef",
    ]
    assert not (tmp_path / "threads" / "thread-viewer").exists()
    assert not (tmp_path / "threads" / "thread-marked").exists()


async def test_cleanup_paginates_active_threads(tmp_path, monkeypatch):
    """活动线程超过单页上限时仍需清理后续页面的 E2E 对话。"""

    deleted_paths: list[str] = []
    offsets: list[str] = []
    monkeypatch.setattr(live_api_cleanup.conf, "save_dir", str(tmp_path))

    def handle_request(request: httpx.Request) -> httpx.Response:
        """模拟分两页返回线程的清理 API。"""

        if request.method == "DELETE":
            deleted_paths.append(request.url.path)
            return httpx.Response(200, json={})
        if request.url.path == "/api/chat/threads":
            offset = request.url.params.get("offset") or "0"
            offsets.append(offset)
            if offset == "0":
                return httpx.Response(
                    200,
                    json=[{"id": f"thread-{index}", "is_pinned": False} for index in range(500)],
                )
            return httpx.Response(
                200,
                json=[
                    {
                        "id": "thread-page-2",
                        "title": "任意标题",
                        "metadata": {"_yuxi_e2e": True, "test": "viewer-fs-e2e"},
                    }
                ],
            )
        if request.url.path == "/api/agent":
            return httpx.Response(200, json={"agents": []})
        raise AssertionError(f"unexpected request: {request.method} {request.url}")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handle_request), base_url="http://test") as client:
        await cleanup_e2e_chat_resources(
            client,
            {"Authorization": "test"},
            owner_uid="test-user",
            thread_storage_statuses={},
        )

    assert offsets == ["0", "500"]
    assert deleted_paths == ["/api/chat/thread/thread-page-2"]


async def test_cleanup_removes_deleted_and_subagent_thread_storage(tmp_path, monkeypatch):
    """已软删除和 subagent 状态的线程也必须回收本地沙盒目录。"""

    deleted_paths: list[str] = []
    monkeypatch.setattr(live_api_cleanup.conf, "save_dir", str(tmp_path))
    for thread_id in ("thread-deleted", "thread-child"):
        (tmp_path / "threads" / thread_id).mkdir(parents=True)

    def handle_request(request: httpx.Request) -> httpx.Response:
        """模拟无 active 线程但存在持久化线程的清理 API。"""

        if request.method == "DELETE":
            deleted_paths.append(request.url.path)
            return httpx.Response(200, json={})
        if request.url.path == "/api/chat/threads":
            return httpx.Response(200, json=[])
        if request.url.path == "/api/agent":
            return httpx.Response(200, json={"agents": []})
        raise AssertionError(f"unexpected request: {request.method} {request.url}")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handle_request), base_url="http://test") as client:
        await cleanup_e2e_chat_resources(
            client,
            {"Authorization": "test"},
            owner_uid="test-user",
            thread_storage_statuses={"thread-deleted": "deleted", "thread-child": "subagent"},
        )

    assert deleted_paths == ["/api/chat/thread/thread-child"]
    assert not (tmp_path / "threads" / "thread-deleted").exists()
    assert not (tmp_path / "threads" / "thread-child").exists()


async def test_remove_e2e_thread_storage_rejects_symlink(tmp_path, monkeypatch):
    """沙盒目录是符号链接时必须拒绝删除，避免解析后误删用户目录。"""

    monkeypatch.setattr(live_api_cleanup.conf, "save_dir", str(tmp_path))
    threads_root = tmp_path / "threads"
    threads_root.mkdir()
    user_dir = threads_root / "user-data"
    user_dir.mkdir()
    (threads_root / "thread-e2e").symlink_to(user_dir, target_is_directory=True)

    with pytest.raises(RuntimeError, match="symlink"):
        remove_e2e_thread_storage("thread-e2e")

    assert user_dir.exists()
