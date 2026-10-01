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

# 注意：docx / pptx / xlsx 三个内置技能各自带一份内容一致的 scripts/office/
# （OOXML 校验脚本与 schema，约 2900 行 × 3）。技能目录由 skills/service.py 用
# shutil.copytree 整体拷进 save_dir 再挂给沙箱，且含符号链接的目录会被装载逻辑跳过，
# 因此必须保持目录自包含——不要改成共享目录或软链去重。

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
        version="2026.09.30",
        tool_dependencies=(
            "ask_user_question",
            "ocr_parse_file",
            "present_artifacts",
            "list_kbs",
            "query_kb",
            "find_kb_document",
            "open_kb_document",
            "search_file",
            "download_kb_file",
        ),
        skill_dependencies=("xlsx", "knowledge-base"),
        usage_source="work",
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
