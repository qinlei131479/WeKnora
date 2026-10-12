"""内置智能体定义加载器。

内置智能体的「数据」放在 `yuxi/config/builtin/agents.yaml` 与 `yuxi/config/builtin/agent_prompts.yaml`，
与本模块（业务代码）分目录存放，不再把提示词写死在 Python 常量里。

解析优先级由 `AgentRepository` 实现：租户覆写行 → 本文件的定义。
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

import yaml

from yuxi.utils import logger

BUILTIN_DIR = Path(__file__).resolve().parent / "builtin"
AGENTS_FILE = Path(os.getenv("YUXI_BUILTIN_AGENTS_FILE") or BUILTIN_DIR / "agents.yaml")
PROMPTS_FILE = Path(os.getenv("YUXI_BUILTIN_AGENT_PROMPTS_FILE") or BUILTIN_DIR / "agent_prompts.yaml")

# context 里以 `_prompt_id` 结尾的键会被解析成同名去掉 `_id` 的提示词字段。
_PROMPT_REF_SUFFIX = "_prompt_id"


@dataclass(frozen=True)
class BuiltinAgentSpec:
    slug: str
    name: str
    description: str
    backend_id: str
    is_subagent: bool
    is_default: bool
    config_json: dict


def _read_yaml(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def _resolve_prompt_refs(context: dict, prompts: dict) -> dict:
    resolved: dict = {}
    missing: list[str] = []
    for key, value in (context or {}).items():
        if key.endswith(_PROMPT_REF_SUFFIX):
            target_key = key[: -len("_id")]
            prompt_id = str(value or "").strip()
            content = prompts.get(prompt_id)
            if content is None:
                missing.append(f"{key}={prompt_id}")
                continue
            resolved[target_key] = content
            continue
        resolved[key] = value
    if missing:
        raise ValueError(f"提示词引用不存在：{', '.join(missing)}")
    return resolved


def load_builtin_agents() -> tuple[BuiltinAgentSpec, ...]:
    """加载内置智能体定义。任一文件缺失或引用断链时返回空元组并记日志，避免半成品定义上线。"""
    try:
        agents_doc = _read_yaml(AGENTS_FILE)
        prompts_doc = _read_yaml(PROMPTS_FILE)
    except FileNotFoundError as exc:
        logger.error(f"内置智能体配置文件缺失：{exc}")
        return ()
    except yaml.YAMLError as exc:
        logger.error(f"内置智能体配置文件不是合法 YAML：{exc}")
        return ()

    prompts = prompts_doc.get("prompts") or {}
    specs: list[BuiltinAgentSpec] = []
    for raw in agents_doc.get("agents") or []:
        slug = str(raw.get("slug") or "").strip()
        if not slug:
            logger.error("内置智能体定义缺少 slug，已跳过")
            continue
        try:
            context = _resolve_prompt_refs(raw.get("context") or {}, prompts)
        except ValueError as exc:
            logger.error(f"内置智能体 {slug} 配置错误，已跳过：{exc}")
            continue
        specs.append(
            BuiltinAgentSpec(
                slug=slug,
                name=str(raw.get("name") or slug),
                description=str(raw.get("description") or ""),
                backend_id=str(raw.get("backend_id") or "ChatbotAgent"),
                is_subagent=bool(raw.get("is_subagent", False)),
                is_default=bool(raw.get("is_default", False)),
                config_json={"context": context},
            )
        )
    return tuple(specs)


BUILTIN_AGENT_SPECS: tuple[BuiltinAgentSpec, ...] = load_builtin_agents()
BUILTIN_AGENTS_BY_SLUG: dict[str, BuiltinAgentSpec] = {spec.slug: spec for spec in BUILTIN_AGENT_SPECS}
# 虚拟内置行的占位主键：用负数避开真实自增 id，保证排序稳定且不会与库行冲突。
BUILTIN_VIRTUAL_IDS: dict[str, int] = {
    spec.slug: -(index + 1) for index, spec in enumerate(BUILTIN_AGENT_SPECS)
}


def get_builtin_agent_spec(slug: str) -> BuiltinAgentSpec | None:
    return BUILTIN_AGENTS_BY_SLUG.get(str(slug or "").strip())


def builtin_agent_slugs() -> set[str]:
    return set(BUILTIN_AGENTS_BY_SLUG)


def is_builtin_agent_slug(slug: str) -> bool:
    return str(slug or "").strip() in BUILTIN_AGENTS_BY_SLUG


def builtin_virtual_id(slug: str) -> int:
    return BUILTIN_VIRTUAL_IDS.get(str(slug or "").strip(), -999999)
