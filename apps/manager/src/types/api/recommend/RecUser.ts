import type { PageDomain, AjaxResult, BaseEntity } from "../common";

/** 推荐用户分页查询参数 */
export interface RecUserQueryParams extends PageDomain {
  /** 推荐用户账号 */
  account?: string;
  /** 兴趣标签 */
  interestLabel?: string;
  /** 订购标签 */
  orderLabel?: string;
  /** 价值标签 */
  valueLabel?: string;
}
/** 推荐用户信息 */
export interface RecUser extends BaseEntity {
  /** 推荐用户ID */
  id?: number;
  /** 推荐用户账号 */
  account?: string;
  /** 兴趣标签 */
  interestLabel?: string;
  /** 订购标签 */
  orderLabel?: string;
  /** 价值标签 */
  valueLabel?: string;
}
