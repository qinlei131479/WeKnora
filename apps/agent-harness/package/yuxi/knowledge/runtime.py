"""知识库运行时单例。只注册 WeKnora 适配器。"""

import os

from yuxi.config import config
from yuxi.knowledge.factory import KnowledgeBaseFactory
from yuxi.knowledge.implementations.weknora import WeKnoraKB
from yuxi.knowledge.manager import KnowledgeBaseManager

KnowledgeBaseFactory.register(WeKnoraKB)

knowledge_base = KnowledgeBaseManager(os.path.join(config.save_dir, "knowledge_base_data"))
