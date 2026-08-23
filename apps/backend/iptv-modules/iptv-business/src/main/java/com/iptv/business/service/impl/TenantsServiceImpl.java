package com.iptv.business.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.StorageBackends;
import com.iptv.business.domain.TenantMembers;
import com.iptv.business.domain.Tenants;
import com.iptv.business.domain.Users;
import com.iptv.business.domain.dto.TenantBindUsersDTO;
import com.iptv.business.domain.dto.TenantsDTO;
import com.iptv.business.domain.dto.page.TenantsPageDTO;
import com.iptv.business.domain.vo.TenantsVO;
import com.iptv.business.domain.vo.UsersVO;
import com.iptv.business.enums.BusinessStatusEnum;
import com.iptv.business.pgmapper.StorageBackendsMapper;
import com.iptv.business.pgmapper.TenantMembersMapper;
import com.iptv.business.pgmapper.TenantsMapper;
import com.iptv.business.pgmapper.UsersMapper;
import com.iptv.business.service.TenantMembersService;
import com.iptv.business.service.TenantsService;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import jakarta.annotation.Nonnull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * <p>
 * 工作空间（租户）主表：配额、检索引擎、存储/解析/对话等全局配置 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
@Slf4j
@Service
public class TenantsServiceImpl extends ServiceImpl<TenantsMapper, Tenants> implements TenantsService {

    @Autowired
    private TenantMembersMapper tenantMembersMapper;

    @Autowired
    private UsersMapper usersMapper;

    @Autowired
    private TenantMembersService tenantMembersService;

    @Autowired
    private StorageBackendsMapper storageBackendsMapper;

    // 默认存储配额：10GB
    private static final Long DEFAULT_STORAGE_QUOTA = 10L * 1024 * 1024 * 1024;

    @Override
    public TableDataInfo<TenantsVO> queryPage(TenantsPageDTO dto, PageDTO pg) {
        Page<TenantsVO> page = PageUtils.toPage(pg);
        List<Tenants> list = this.baseMapper.queryPage(dto, page);
        List<TenantsVO> voList = BeanUtil.copyToList(list, TenantsVO.class);
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public TenantsVO queryById(@Nonnull Integer id) {
        Tenants entity = this.baseMapper.selectById(id);
        return BeanUtil.copyProperties(entity, TenantsVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TenantsVO insert(@Nonnull TenantsDTO dto) {
        log.info("Start creating tenant...");

        Tenants entity = BeanUtil.copyProperties(dto, Tenants.class);
        entity.setStatus("active");
        entity.setBusiness("");

        // 设置默认存储配额（如果未提供）
        if (entity.getStorageQuota() == null || entity.getStorageQuota() <= 0) {
            entity.setStorageQuota(DEFAULT_STORAGE_QUOTA);
        }

        // 设置已用存储为0
        if (entity.getStorageUsed() == null) {
            entity.setStorageUsed(0L);
        }

        // 保存到数据库
        this.baseMapper.insert(entity);
        log.info("Tenant created successfully, ID: {}, name: {}", entity.getId(), entity.getName());

        return BeanUtil.copyProperties(entity, TenantsVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TenantsVO update(@Nonnull TenantsDTO dto) {
        Tenants entity = this.baseMapper.selectById(dto.getId());
        if (BeanUtil.isEmpty(entity)) {
            throw new ServiceException("工作空间（租户）主表：配额、检索引擎、存储/解析/对话等全局配置不存在");
        }
        BeanUtil.copyProperties(dto, entity);
        this.baseMapper.updateById(entity);
        return BeanUtil.copyProperties(entity, TenantsVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(@Nonnull String id) {
        Tenants entity = this.baseMapper.selectById(id);
        if (BeanUtil.isNotEmpty(entity)) {
            this.baseMapper.deleteById(id);
            // 删除存储
            storageBackendsMapper.delete(new LambdaQueryWrapper<StorageBackends>()
                    .eq(StorageBackends::getTenantId, id));
        }
    }

    @Override
    public List<UsersVO> bindUsers(Integer tenantId) {
        List<TenantMembers> tenantMembers = tenantMembersMapper.selectList(new LambdaQueryWrapper<TenantMembers>()
                .eq(TenantMembers::getTenantId, tenantId)
                .eq(TenantMembers::getStatus, BusinessStatusEnum.ACTIVE.getCode()));
        if (CollUtil.isEmpty(tenantMembers)) {
            return Collections.emptyList();
        }
        // 查询用户信息
        List<Users> userList = usersMapper.selectList(new LambdaQueryWrapper<Users>()
                .in(Users::getId, tenantMembers.stream().map(TenantMembers::getUserId).collect(Collectors.toList())));
        if (CollUtil.isEmpty(userList)) {
            return Collections.emptyList();
        }
        return BeanUtil.copyToList(userList, UsersVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void tenantBindUsers(@Nonnull TenantBindUsersDTO dto) {
        // 1. 检查用户是否存在
        Tenants tenant = this.baseMapper.selectById(dto.getTenantId());
        if (BeanUtil.isEmpty(tenant)) {
            throw new ServiceException("租户不存在");
        }
        // 2. 检查租户是否存在
        List<Users> userList = usersMapper.selectList(new LambdaQueryWrapper<Users>()
                .in(Users::getId, dto.getUserIds()));
        if (CollUtil.isEmpty(userList)) {
            throw new ServiceException("用户不存在");
        }

        List<TenantMembers> tenantMembersList = new ArrayList<>();
        userList.forEach(user -> {
            TenantMembers tenantMember = TenantMembers.create(user, tenant, dto.getRole());
            tenantMembersList.add(tenantMember);
        });
        tenantMembersService.saveBatch(tenantMembersList);
    }
}
