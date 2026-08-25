export interface UsersPageDTO {
  id?: string;
  name?: string;
  email?: string;
  passwordHash?: string;
  avatar?: string;
  tenantId?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  canAccessAllTenants?: boolean;
  preferences?: string;
  isSystemAdmin?: boolean;
}

export interface UserTenantVO {
  tenantId?: number;
  tenantName?: string;
  role?: string;
  roleName?: string;
}

export interface UsersVO {
  id?: string;
  username?: string;
  email?: string;
  passwordHash?: string;
  avatar?: string;
  tenantId?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  canAccessAllTenants?: boolean;
  preferences?: string;
  isSystemAdmin?: boolean;
  tenants?: UserTenantVO[];
}
