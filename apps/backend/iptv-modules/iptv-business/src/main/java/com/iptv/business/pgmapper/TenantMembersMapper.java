package com.iptv.business.pgmapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.iptv.business.domain.TenantMembers;

/**
 * <p>
 * 用户在租户内的成员关系与角色（RBAC） Mapper 接口（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-21
 */
public interface TenantMembersMapper extends BaseMapper<TenantMembers> {

    /**
     * 根据user_id物理删除用户-租户关联关系
     * @param userId
     */
    void deleteByUserId(String userId);

    void deleteByTenantId(Integer tenantId);
}
