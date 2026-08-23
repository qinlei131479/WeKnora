

export interface TenantMemberBase {
  /** 主键 ID */
  id?: string;
  /** 用户名 */
  username?: string;
  /** 登录邮箱 */
  email?: string;
  /** 密码哈希 */
  passwordHash?: string;
  /** 头像/图标 */
  avatar?: string;
  /** 用户默认/归属工作空间 ID */
  tenantId?: number;
  /** 是否激活 */
  isActive?: boolean;
  /** 创建时间 */
  createdAt?: string;
  /** 最后更新时间 */
  updatedAt?: string;
  /** 软删除时间；非空表示已删除 */
  deletedAt?: string;
  /** 是否可访问全部工作空间 */
  canAccessAllTenants?: boolean;
  /** 用户偏好（JSONB，如记忆开关等） */
  preferences?: string;
  /** 是否系统管理员（独立于租户角色） */
  isSystemAdmin?: boolean;

  /** 绑定的工作空间角色列表 */
  tenants?: TenantMemberTenantIdAndRole[];
}

export interface TenantMemberListReq {
  name?: string
}

export interface TenantMemberEntity extends TenantMemberBase {
}

export type TenantMemberRole = 'owner' | 'admin' | 'contributor' | 'viewer';
export interface TenantMemberTenantIdAndRole {
  tenantId?: number|null;
  tenantName?: string;// 空间名称
  role?: TenantMemberRole;// 角色
  roleName?: string;// 角色名称
}
export interface TenantMemberSaveReq {
  id?: string,
  username?: string,
  email?: string,
  password?: string,
  bindTenants?: TenantMemberTenantIdAndRole[]
}
