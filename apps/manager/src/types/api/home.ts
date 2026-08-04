import { AgentBrainBase, DatasourceVO, KnowledgeLibEntity, ModelVO, SkillVO, ToolVO } from '.';

export interface HomeTopData {
  assetCount: number;
  assetCountChange: number;
  assetReuseRate: number;
  assetReuseRateChange: number;
  agenticCount: number;
  agenticActiveCount: number;
  userUseCount: number;
  userUseCountChange: number;
}

export interface HomeTodayData {
  chatCount: number;
  duration: number;
  dataSourceCount: number;
  toolCount: number;
  skillCount: number;
  knowledgeCount: number;
}

export interface HomeErrorItem {
  name: string;
  description: string;
  errorTime: string;
  handleFlag: number;
}

export interface HomeCategory {
  categoryId: number;
  categoryName: string;
  agenticList: AgentBrainBase[];
}

export interface HomeAsset {
  agiModelList: ModelVO[];
  toolList: ToolVO[];
  skillList: SkillVO[];
  knowledgeList: KnowledgeLibEntity[];
  dataSourceList: DatasourceVO[];
  categoryList: HomeCategory[];
}
export interface HomeAgenticStatus {
  normalCount: number;
  abnormalCount: number;
  disabledCount: number;
}
