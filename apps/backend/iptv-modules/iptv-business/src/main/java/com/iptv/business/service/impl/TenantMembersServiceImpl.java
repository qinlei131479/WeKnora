package com.iptv.business.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.TenantMembers;
import com.iptv.business.pgmapper.TenantMembersMapper;
import com.iptv.business.service.TenantMembersService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 工作空间（租户）成员表 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
@Slf4j
@Service
public class TenantMembersServiceImpl extends ServiceImpl<TenantMembersMapper, TenantMembers> implements TenantMembersService {

}
