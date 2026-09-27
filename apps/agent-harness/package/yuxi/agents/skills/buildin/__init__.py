from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class BuiltinSkillSpec:
    slug: str
    source_dir: Path
    description: str = ""
    version: str = "1.0.0"
    tool_dependencies: tuple[str, ...] = ()
    mcp_dependencies: tuple[str, ...] = ()
    skill_dependencies: tuple[str, ...] = ()
    usage_source: str = "work"


_SKILLS_ROOT = Path(__file__).resolve().parent

# 展示名与描述以各目录 SKILL.md frontmatter 为准；这里只登记 slug、依赖和版本。
BUILTIN_SKILLS: list[BuiltinSkillSpec] = [
    BuiltinSkillSpec(
        slug="image-gen",
        source_dir=_SKILLS_ROOT / "image-gen",
        version="2026.06.02",
        tool_dependencies=("present_artifacts",),
    ),
    BuiltinSkillSpec(
        slug="html-preview",
        source_dir=_SKILLS_ROOT / "html-preview",
        version="2026.07.23",
    ),
    BuiltinSkillSpec(
        slug="deep-research",
        source_dir=_SKILLS_ROOT / "deep-research",
        version="2026.07.29",
        tool_dependencies=("web_search",),
        skill_dependencies=("html-preview",),
    ),
    BuiltinSkillSpec(
        slug="knowledge-base",
        source_dir=_SKILLS_ROOT / "knowledge-base",
        version="2026.06.24",
        tool_dependencies=(
            "list_kbs",
            "query_kb",
            "find_kb_document",
            "open_kb_document",
            "get_mindmap",
            "search_file",
            "download_kb_file",
        ),
    ),
    BuiltinSkillSpec(
        slug="mysql-reporter",
        source_dir=_SKILLS_ROOT / "mysql-reporter",
        version="2026.06.05",
        mcp_dependencies=("mcp-server-chart",),
        usage_source="common",
    ),
    BuiltinSkillSpec(
        slug="quote",
        source_dir=_SKILLS_ROOT / "quote",
        version="2026.09.24",
        usage_source="common",
    ),
    BuiltinSkillSpec(
        slug="pdf",
        source_dir=_SKILLS_ROOT / "pdf",
        version="2026.09.16",
        usage_source="common",
    ),
    BuiltinSkillSpec(
        slug="docx",
        source_dir=_SKILLS_ROOT / "docx",
        version="2026.09.16",
        usage_source="common",
    ),
    BuiltinSkillSpec(
        slug="pptx",
        source_dir=_SKILLS_ROOT / "pptx",
        version="2026.09.16",
        usage_source="common",
    ),
    BuiltinSkillSpec(
        slug="xlsx",
        source_dir=_SKILLS_ROOT / "xlsx",
        version="2026.09.16",
        usage_source="common",
    ),
]
