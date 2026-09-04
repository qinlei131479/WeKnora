"""兼容导入。原生知识库 / 图谱 / 评测表已删除，不再注册 ORM。"""

from yuxi.storage.postgres.models_business import Base

__all__ = ["Base"]


class _RemovedTable:
    """占位类型：禁止再映射到已 DROP 的表。"""


KnowledgeBase = _RemovedTable
KnowledgeFile = _RemovedTable
KnowledgeChunk = _RemovedTable
KnowledgeGraphEntity = _RemovedTable
KnowledgeGraphTriple = _RemovedTable
KnowledgeGraphEntityMention = _RemovedTable
KnowledgeGraphTripleMention = _RemovedTable
EvaluationDataset = _RemovedTable
EvaluationDatasetItem = _RemovedTable
EvaluationRun = _RemovedTable
EvaluationRunItem = _RemovedTable
