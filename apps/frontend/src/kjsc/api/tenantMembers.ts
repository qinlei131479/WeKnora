// L2 扩展层：企业独有的「租户成员」API 与类型扩展。
//
// 为什么要外置：apps/frontend/src/api/tenant/members.ts 是上游文件（L0 主干）。
// 企业新增的 addTenantUser / updateTenantUser 原先写在该文件末尾，导致它无法整文件端口，
// 每次同步都要人工重新贴回去。搬到这里之后：
//   · 上游文件恢复为与上游逐字节一致 → 回到「整文件端口」零人工档位
//   · 企业代码独立成文件 → 永不丢失，且不受上游改动影响
//   · 对上游 TenantMember 的字段补充用 TS 模块增强（declare module）完成，不改动上游源码
//
// 同步时的动作：端口 members.ts（脚本自动）→ 本文件不动 → 只复核消费方的 import 重定向。
import { post, put } from '@/utils/request'
import type { AddMemberResponse, TenantRole } from '@/api/tenant/members'

// 模块增强：给上游的 TenantMember 补上企业字段。
// 用相对路径而非 '@/' 别名 —— TS 的 declare module 在部分配置下无法解析路径别名。
declare module '../../api/tenant/members' {
  interface TenantMember {
    /** 登录账号。历史成员可能为空。 */
    account?: string
  }
}

export interface AddTenantUserRequest {
  username: string
  account: string
  email: string
  password: string
  role: TenantRole
}

export interface UpdateTenantUserRequest {
  username: string
  /** 仅当原登录账号为空时提交；已有账号不传。 */
  account?: string
  email: string
  role: TenantRole
}

/** 在当前租户直接创建用户并加入。Backend: POST /api/v1/tenants/:id/add-users */
export async function addTenantUser(
  tenantId: number,
  body: AddTenantUserRequest,
): Promise<AddMemberResponse> {
  return (await post(`/api/v1/tenants/${tenantId}/add-users`, body)) as unknown as AddMemberResponse
}

/** 编辑成员资料。登录账号为空时可补填，补填后不可再改。Backend: PUT /api/v1/tenants/:id/add-users/:user_id */
export async function updateTenantUser(
  tenantId: number,
  userId: string,
  body: UpdateTenantUserRequest,
): Promise<AddMemberResponse> {
  return (await put(
    `/api/v1/tenants/${tenantId}/add-users/${userId}`,
    body,
  )) as unknown as AddMemberResponse
}
