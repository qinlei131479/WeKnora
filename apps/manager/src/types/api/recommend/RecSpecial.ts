import type { PageDomain, AjaxResult, BaseEntity } from "../common";

/** 推荐专题分页查询参数 */
export interface RecSpecialQueryParams extends PageDomain {
  /** 关键词 */
  key?: string;
  /** 专题名称 */
  name?: string;
}
/** 推荐专题信息 */
export interface RecSpecial extends BaseEntity {
  /** 推荐专题ID */
  id?: number;
  /** 关键词 */
  key?: string;
  /** 专题名称 */
  name?: string;
  /** 是否主题 */
  isTheme?: boolean;
  // /** 父ID */
  // parentId?: number;

  // parent?: RecSpecial;

  // children?: RecSpecial[];

  // /** 层级 */
  // level?: number;
}
/** 推荐专题媒资 */
export interface RecSpecialMedia extends BaseEntity {
  // /** 推荐专题媒资ID */
  // id?: number;
  /** 媒资编码 */
  code: string;
  /** 媒资名称 */
  name?: string;

  // parent?: RecSpecialMedia;
  // children?: RecSpecialMedia[];
}

export interface RecSpecialAutoBuildSpecials {
  /** 专题ID */
  id: number|string;
  /** 专题名称，多个专题名称用#隔开 */
  names?: string;
}
export interface RecSpecialAutoBuildMediaData {
  /** 专题列表 */
  specials?: RecSpecialAutoBuildSpecials;
  /** 媒资列表 */
  programs?: RecSpecialMedia[];
}

export interface RecSpecialSaveParams {
  /** 专题名称 */
  name: string;
  /** 专题ID */
  id: number|string;
  /** 媒资编码列表 */
  mediaCodeList: string[];
}
