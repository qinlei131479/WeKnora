import { KnowledgeAuthEntity } from "@/types"

export interface CardConfig {
  type: string,
  title: string,
  description: string,
  icon: any,
}

export interface CardPermissions {
  deptPermissions: KnowledgeAuthEntity[]
  positionPermissions: KnowledgeAuthEntity[]
  groupPermissions: KnowledgeAuthEntity[]
}