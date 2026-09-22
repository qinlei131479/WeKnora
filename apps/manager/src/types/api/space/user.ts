/** 用户新增、修改参数 */
export interface UsersDTO {
  /** 主键 ID */
  id: string;
  /** 用户名 */
  username?: string;
  /** 用户账号（登录凭证） */
  account?: string;
  /** 登录邮箱 */
  email?: string;
  /** 密码 */
  password?: string;
  /** 绑定租户列表 */
  tenants?: BindTenantDTO[];
}

/** 用户分页查询参数 */
export interface UsersPageDTO {
  /** 主键 ID */
  id?: string;
  /** 用户名 */
  name?: string;
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
  /** 是否可访问全部工作空间 */
  canAccessAllTenants?: boolean;
  /** 用户偏好（JSONB，如记忆开关等） */
  preferences?: string;
  /** 是否系统管理员（独立于租户角色） */
  isSystemAdmin?: boolean;
}

/** 用户返回数据 */
export interface UsersVO {
  /** 主键 ID */
  id?: string;
  /** 用户名 */
  username?: string;
  /** 用户账号（登录凭证） */
  account?: string;
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
  /** 用户可访问的工作空间列表信息 */
  tenants?: UserTenantVO[];
}

/** 用户绑定的租户及角色 */
export interface UserTenantVO {
  /** 工作空间 ID */
  tenantId?: number;
  /** 工作空间名称 */
  tenantName?: string;
  /** 角色 */
  role?: string;
  /** 角色名称 */
  roleName?: string;
}

/** 用户绑定租户参数 */
export interface UserBindTenantsDTO {
  /** 用户ID */
  userId: string;
  /** 角色(owner/admin/contributor/viewer) */
  role: string;
  /** 租户ID列表 */
  tenantIds: number[];
}

/** 租户绑定参数 */
export interface BindTenantDTO {
  /** 租户 ID */
  tenantId?: number;
  /** 角色(owner/admin/contributor/viewer) */
  role?: string;
}
