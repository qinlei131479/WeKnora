import type { AjaxResult, BaseEntity, PageDomain } from '../common'

export interface BusinessRoleBase {
  id?: number // ID
  roleName: string // 角色名称
  roleKey: string // 角色权限字符串
  roleSort?: number // 显示顺序
  status: string // 角色状态（0正常 1停用）
  relatedDept?: number // 是否关联部门 0 否，1 是
  top?: number // 是否置顶 0否1是
}
// export interface BusinessRoleSaveParams extends BusinessRoleBase {}
export interface BusinessRoleEntity extends BusinessRoleBase, BaseEntity {}

// export interface BusinessRoleQueryParams extends PageDomain {
//   roleName?: string // 角色名称
//   roleKey?: number // 分类ID
// }


