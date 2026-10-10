from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from deepagents.backends.composite import (
    CompositeBackend,
    _remap_file_info_path,
    _remap_grep_path,
    _route_for_path,
    _strip_route_from_pattern,
)
from deepagents.backends import FilesystemBackend
from deepagents.backends.protocol import (
    EditResult,
    FileInfo,
    FileUploadResponse,
    GlobResult,
    GrepMatch,
    GrepResult,
    WriteResult,
)
from deepagents.middleware.filesystem import FilesystemMiddleware

from yuxi.agents.backends.sandbox import existing_global_saved_artifacts_dir
from yuxi.agents.skills.service import (
    get_thread_skills_root_dir,
    normalize_string_list,
    sync_thread_readable_skills_async,
)
from yuxi.utils.paths import (
    SAVED_ARTIFACTS_DIR_NAME,
    VIRTUAL_PATH_CONVERSATION_HISTORY,
    VIRTUAL_PATH_LARGE_TOOL_RESULTS,
    VIRTUAL_PATH_OUTPUTS,
    VIRTUAL_PATH_WORKSPACE,
)

from .sandbox import ProvisionerSandboxBackend
from .skills_backend import SelectedSkillsReadonlyBackend

_TOOL_RESULT_EVICTION_EXEMPT_TOOLS = frozenset({"read_file", "open_kb_document"})


def _coerce_glob_result(result) -> GlobResult:
    if isinstance(result, GlobResult):
        return result
    return GlobResult(matches=result or [])


class CustomCompositeBackend(CompositeBackend):
    """修复 glob 路由逻辑的 CompositeBackend。"""

    def _routes_under_path(self, path: str | None) -> list[tuple[str, object]]:
        """返回位于搜索目录下的路由，避免父目录检索遗漏本地映射子树。"""
        normalized_path = "/" if path is None else "/" + str(path).strip("/")
        if normalized_path == "/":
            return list(self.routes.items())
        return [
            (route_prefix, backend)
            for route_prefix, backend in self.routes.items()
            if route_prefix.startswith(f"{normalized_path.rstrip('/')}/")
        ]

    def grep(self, pattern: str, path: str | None = None, glob: str | None = None) -> GrepResult:
        backend, backend_path, route_prefix = _route_for_path(
            default=self.default,
            sorted_routes=self.sorted_routes,
            path=path or "/",
        )
        if route_prefix is not None:
            result = backend.grep(pattern, backend_path, glob)
            if isinstance(result, str):
                return GrepResult(error=result)
            if result.error:
                return result
            return GrepResult(matches=[_remap_grep_path(match, route_prefix) for match in (result.matches or [])])

        all_matches: list[GrepMatch] = []
        default_result = backend.grep(pattern, path, glob)
        if isinstance(default_result, str):
            return GrepResult(error=default_result)
        if default_result.error:
            return default_result
        all_matches.extend(default_result.matches or [])

        for child_prefix, child_backend in self._routes_under_path(path):
            result = child_backend.grep(pattern, "/", glob)
            if isinstance(result, str):
                return GrepResult(error=result)
            if result.error:
                return result
            all_matches.extend(_remap_grep_path(match, child_prefix) for match in (result.matches or []))
        return GrepResult(matches=all_matches)

    async def agrep(self, pattern: str, path: str | None = None, glob: str | None = None) -> GrepResult:
        backend, backend_path, route_prefix = _route_for_path(
            default=self.default,
            sorted_routes=self.sorted_routes,
            path=path or "/",
        )
        if route_prefix is not None:
            result = await backend.agrep(pattern, backend_path, glob)
            if isinstance(result, str):
                return GrepResult(error=result)
            if result.error:
                return result
            return GrepResult(matches=[_remap_grep_path(match, route_prefix) for match in (result.matches or [])])

        all_matches: list[GrepMatch] = []
        default_result = await backend.agrep(pattern, path, glob)
        if isinstance(default_result, str):
            return GrepResult(error=default_result)
        if default_result.error:
            return default_result
        all_matches.extend(default_result.matches or [])

        for child_prefix, child_backend in self._routes_under_path(path):
            result = await child_backend.agrep(pattern, "/", glob)
            if isinstance(result, str):
                return GrepResult(error=result)
            if result.error:
                return result
            all_matches.extend(_remap_grep_path(match, child_prefix) for match in (result.matches or []))
        return GrepResult(matches=all_matches)

    def glob(self, pattern: str, path: str = "/") -> GlobResult:
        backend, backend_path, route_prefix = _route_for_path(
            default=self.default,
            sorted_routes=self.sorted_routes,
            path=path,
        )
        if route_prefix is not None:
            result = _coerce_glob_result(backend.glob(pattern, backend_path))
            if result.error:
                return result
            return GlobResult(matches=[_remap_file_info_path(fi, route_prefix) for fi in (result.matches or [])])

        results: list[FileInfo] = []
        default_result = _coerce_glob_result(self.default.glob(pattern, path))
        if default_result.error:
            return default_result
        results.extend(default_result.matches or [])
        for route_prefix, backend in self._routes_under_path(path):
            route_pattern = _strip_route_from_pattern(pattern, route_prefix)
            result = _coerce_glob_result(backend.glob(route_pattern, "/"))
            if result.error:
                return result
            results.extend(_remap_file_info_path(fi, route_prefix) for fi in (result.matches or []))
        results.sort(key=lambda x: x.get("path", ""))
        return GlobResult(matches=results)

    async def aglob(self, pattern: str, path: str = "/") -> GlobResult:
        backend, backend_path, route_prefix = _route_for_path(
            default=self.default,
            sorted_routes=self.sorted_routes,
            path=path,
        )
        if route_prefix is not None:
            result = _coerce_glob_result(await backend.aglob(pattern, backend_path))
            if result.error:
                return result
            return GlobResult(matches=[_remap_file_info_path(fi, route_prefix) for fi in (result.matches or [])])

        results: list[FileInfo] = []
        default_result = _coerce_glob_result(await self.default.aglob(pattern, path))
        if default_result.error:
            return default_result
        results.extend(default_result.matches or [])
        for route_prefix, backend in self._routes_under_path(path):
            route_pattern = _strip_route_from_pattern(pattern, route_prefix)
            result = _coerce_glob_result(await backend.aglob(route_pattern, "/"))
            if result.error:
                return result
            results.extend(_remap_file_info_path(fi, route_prefix) for fi in (result.matches or []))
        results.sort(key=lambda x: x.get("path", ""))
        return GlobResult(matches=results)


class YuxiFilesystemMiddleware(FilesystemMiddleware):
    """Filesystem middleware that budgets large tool outputs before they hit model context."""

    def wrap_tool_call(self, request, handler):
        tool_result = handler(request)

        if self._tool_token_limit_before_evict is None:
            return tool_result
        if request.tool_call["name"] in _TOOL_RESULT_EVICTION_EXEMPT_TOOLS:
            return tool_result

        return self._intercept_large_tool_result(tool_result, request.runtime)

    async def awrap_tool_call(self, request, handler):
        tool_result = await handler(request)

        if self._tool_token_limit_before_evict is None:
            return tool_result
        if request.tool_call["name"] in _TOOL_RESULT_EVICTION_EXEMPT_TOOLS:
            return tool_result

        return await self._aintercept_large_tool_result(tool_result, request.runtime)


class SavedArtifactsReadonlyBackend(FilesystemBackend):
    """用户级保存产物只读路由；Agent 不得修改用户在工作区维护的文件。"""

    def __init__(self, root_dir: Path):
        super().__init__(root_dir=root_dir, virtual_mode=True)

    def write(self, file_path: str, content: str) -> WriteResult:
        return WriteResult(error="Saved artifacts path is read-only.")

    def edit(
        self,
        file_path: str,
        old_string: str,
        new_string: str,
        replace_all: bool = False,  # noqa: FBT001, FBT002
    ) -> EditResult:
        return EditResult(error="Saved artifacts path is read-only.")

    def upload_files(self, files: list[tuple[str, bytes]]) -> list[FileUploadResponse]:
        return [FileUploadResponse(path=path, error="permission_denied") for path, _content in files]


@dataclass(frozen=True)
class _BackendScope:
    thread_id: str
    uid: str
    skill_sources: dict[str, str]
    file_thread_id: str
    skills_thread_id: str
    attachment_allowlist: frozenset[str]

    @classmethod
    def from_runtime(cls, runtime) -> _BackendScope:
        config = getattr(runtime, "config", None)
        configurable = config.get("configurable", {}) if isinstance(config, dict) else {}
        context = getattr(runtime, "context", None)
        state = getattr(runtime, "state", None)
        return cls.from_sources(
            configurable if isinstance(configurable, dict) else {},
            context,
            state if isinstance(state, dict) else {},
            readable_skills_source=context,
            error_context="runtime configurable context",
        )

    @classmethod
    def from_sources(cls, *sources, readable_skills_source, error_context: str) -> _BackendScope:
        def string_value(key: str) -> str | None:
            for source in sources:
                value = source.get(key) if isinstance(source, dict) else getattr(source, key, None)
                if isinstance(value, str) and value.strip():
                    return value.strip()
            return None

        thread_id = string_value("thread_id")
        if not thread_id:
            raise ValueError(f"thread_id is required in {error_context}")

        uid = string_value("uid")
        if not uid:
            raise ValueError(f"uid is required in {error_context}")

        selected = getattr(readable_skills_source, "_readable_skills", [])
        readable_skills = normalize_string_list(selected if isinstance(selected, list) else [])
        raw_sources = getattr(readable_skills_source, "_runtime_skill_sources", {})
        skill_sources = {
            slug: str(path)
            for slug, path in (raw_sources.items() if isinstance(raw_sources, dict) else [])
            if slug in readable_skills and isinstance(path, str) and path
        }
        raw_attachment_paths = getattr(readable_skills_source, "runtime_attachment_paths", [])
        attachment_allowlist = frozenset(
            "/" + str(path).strip().lstrip("/")
            for path in (raw_attachment_paths if isinstance(raw_attachment_paths, list) else [])
            if isinstance(path, str) and path.strip()
        )
        return cls(
            thread_id=thread_id,
            uid=uid,
            skill_sources=skill_sources,
            file_thread_id=string_value("file_thread_id") or thread_id,
            skills_thread_id=string_value("skills_thread_id") or thread_id,
            attachment_allowlist=attachment_allowlist,
        )

    def create_backend(self) -> CompositeBackend:
        thread_skills_root = get_thread_skills_root_dir(self.skills_thread_id)
        saved_artifacts_root = existing_global_saved_artifacts_dir(self.uid)
        routes = {
            "/skills/": SelectedSkillsReadonlyBackend(
                selected_slugs=list(self.skill_sources),
                root_dir=thread_skills_root,
            ),
        }
        if saved_artifacts_root is not None:
            routes[f"{VIRTUAL_PATH_WORKSPACE}/{SAVED_ARTIFACTS_DIR_NAME}/"] = SavedArtifactsReadonlyBackend(
                root_dir=saved_artifacts_root
            )
        return CustomCompositeBackend(
            default=ProvisionerSandboxBackend(
                thread_id=self.thread_id,
                uid=self.uid,
                readable_skills=list(self.skill_sources),
                skill_sources=self.skill_sources,
                file_thread_id=self.file_thread_id,
                skills_thread_id=self.skills_thread_id,
                attachment_allowlist=list(self.attachment_allowlist),
            ),
            routes=routes,
            artifacts_root=VIRTUAL_PATH_OUTPUTS,
        )


async def sync_agent_context_skills(context) -> None:
    """在 Agent Run 初始化时同步当前上下文的共享 Skill 投影。"""
    scope = _BackendScope.from_sources(
        context,
        readable_skills_source=context,
        error_context="runtime context",
    )
    await sync_thread_readable_skills_async(
        scope.skills_thread_id,
        list(scope.skill_sources),
        scope.skill_sources,
    )


def create_agent_composite_backend(runtime) -> CompositeBackend:
    return _BackendScope.from_runtime(runtime).create_backend()


def create_agent_filesystem_middleware(
    tool_token_limit_before_evict: int | None = None,
    *,
    context=None,
) -> FilesystemMiddleware:
    backend = create_agent_composite_backend
    if context is not None:

        def build_context_backend(_runtime):
            """按可变运行上下文重建文件作用域，读取已同步的 Skill 投影。"""
            return _BackendScope.from_sources(
                context,
                readable_skills_source=context,
                error_context="runtime context",
            ).create_backend()

        backend = build_context_backend
    middleware = YuxiFilesystemMiddleware(
        backend=backend,
        tool_token_limit_before_evict=tool_token_limit_before_evict,
    )
    middleware._large_tool_results_prefix = VIRTUAL_PATH_LARGE_TOOL_RESULTS
    middleware._conversation_history_prefix = VIRTUAL_PATH_CONVERSATION_HISTORY
    return middleware
