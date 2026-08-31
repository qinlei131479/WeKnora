"""P3 WeKnora 知识库适配。默认关闭；关闭后仍走 yuxi 原生 KB。"""

from yuxi.p3.flags import is_weknora_kb_enabled, weknora_base_url

__all__ = ["is_weknora_kb_enabled", "weknora_base_url"]
