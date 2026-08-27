export interface SkillVO {
  /** 技能名称 */
  name?: string;
  /** 技能描述 */
  description?: string;
}

export interface SkillListResult {
  /** 技能列表 */
  data?: SkillVO[];
  /** 技能是否可用 */
  skills_available: boolean;
}