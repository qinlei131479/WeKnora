package com.iptv.business.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.TenantMembers;
import com.iptv.business.domain.Tenants;
import com.iptv.business.domain.Users;
import com.iptv.business.domain.dto.TenantsDTO;
import com.iptv.business.domain.dto.UserBindTenantsDTO;
import com.iptv.business.domain.dto.UsersDTO;
import com.iptv.business.domain.dto.page.UsersPageDTO;
import com.iptv.business.domain.vo.TenantsVO;
import com.iptv.business.domain.vo.UsersVO;
import com.iptv.business.enums.BusinessStatusEnum;
import com.iptv.business.enums.TenantMemberRoleEnum;
import com.iptv.business.pgmapper.TenantMembersMapper;
import com.iptv.business.pgmapper.TenantsMapper;
import com.iptv.business.pgmapper.UsersMapper;
import com.iptv.business.service.TenantMembersService;
import com.iptv.business.service.TenantsService;
import com.iptv.business.service.UsersService;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import jakarta.annotation.Nonnull;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

/**
 * <p>
 * 用户账号：登录凭证、系统管理员标志、跨租户访问与个人偏好 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
@Service
@RequiredArgsConstructor
public class UsersServiceImpl extends ServiceImpl<UsersMapper, Users> implements UsersService {

    private final TenantsService tenantsService;
    private final TenantsMapper tenantsMapper;

    private final TenantMembersMapper tenantMembersMapper;

    private final TenantMembersService tenantMembersService;

    @Override
    public TableDataInfo<UsersVO> queryPage(UsersPageDTO dto, PageDTO pg) {
        Page<UsersVO> page = PageUtils.toPage(pg);
        List<Users> list = this.baseMapper.queryPage(dto, page);
        List<UsersVO> voList = BeanUtil.copyToList(list, UsersVO.class);
        if (CollUtil.isEmpty(voList)) {
            return PageUtils.getDataTable(voList, page);
        }
        queryTenants(voList);
        return PageUtils.getDataTable(voList, page);
    }

    private void queryTenants(List<UsersVO> voList) {
        // 查询用户可访问的工作空间
        List<TenantMembers> tenantMembersList = tenantMembersMapper.selectList(
                new LambdaQueryWrapper<TenantMembers>()
                        .in(TenantMembers::getUserId, voList.stream().map(UsersVO::getId).collect(Collectors.toSet()))
                        .eq(TenantMembers::getStatus, BusinessStatusEnum.ACTIVE.getCode())
                        .isNull(TenantMembers::getDeletedAt)
        );

        if (CollUtil.isEmpty(tenantMembersList)) {
            return;
        }

        // 查询用户可访问的工作空间
        List<Tenants> tenantsList = tenantsMapper.selectList(
                new LambdaQueryWrapper<Tenants>()
                        .in(Tenants::getId, tenantMembersList.stream().map(TenantMembers::getTenantId).collect(Collectors.toSet()))
                        .isNull(Tenants::getDeletedAt)
                        .eq(Tenants::getStatus, BusinessStatusEnum.ACTIVE.getCode())
        );
        if (CollUtil.isEmpty(tenantsList)) {
            return;
        }
        voList.forEach(vo -> {
            List<UsersVO.UserTenantVO> userTenantVOList = new ArrayList<>();
            tenantMembersList
                    .stream()
                    .filter(t -> StrUtil.equals(t.getUserId(), vo.getId()))
                    .forEach(t2 -> {
                        UsersVO.UserTenantVO userTenantVO = new UsersVO.UserTenantVO();
                        userTenantVO.setTenantId(t2.getTenantId());
                        userTenantVO.setTenantName(
                                tenantsList.stream()
                                        .filter(tenant2 -> ObjectUtil.equals(tenant2.getId(), t2.getTenantId()))
                                        .map(Tenants::getName)
                                        .findFirst()
                                        .orElse(null)
                        );
                        userTenantVO.setRole(t2.getRole());
                        userTenantVO.setRoleName(TenantMemberRoleEnum.getDesc(t2.getRole()));
                        userTenantVOList.add(userTenantVO);
                    });
            vo.setTenants(userTenantVOList);
        });
    }

    @Override
    public UsersVO queryById(@Nonnull String id) {
        Users entity = this.baseMapper.selectById(id);
        UsersVO usersVO = BeanUtil.copyProperties(entity, UsersVO.class);
        queryTenants(Collections.singletonList(usersVO));
        return usersVO;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UsersVO insert(@Nonnull UsersDTO dto) {

        // 密码策略校验（8-32位，必须包含字母和数字）
        validatePasswordPolicy(dto.getPassword());

        // 检查邮箱唯一性
        Users existingUserByEmail = this.baseMapper.selectOne(
                new LambdaUpdateWrapper<Users>()
                        .eq(Users::getEmail, dto.getEmail())
                        .eq(Users::getIsActive, true)
                        .isNull(Users::getDeletedAt)
        );
        if (existingUserByEmail != null) {
            throw new ServiceException("该邮箱已被注册");
        }

        // 检查用户名唯一性
        Users existingUserByUsername = this.baseMapper.selectOne(
                new LambdaUpdateWrapper<Users>().eq(Users::getUsername, dto.getUsername())
        );
        if (existingUserByUsername != null) {
            throw new ServiceException("该用户名已被使用");
        }

        // 密码加密（使用BCrypt）
        String hashedPassword = BCrypt.hashpw(dto.getPassword(), BCrypt.gensalt());

        List<Tenants> defaultTenantsList = new ArrayList<>();
        if (CollUtil.isEmpty(dto.getTenants())) {
            // 创建默认工作空间
            TenantsDTO defaultTenant = new TenantsDTO();
            defaultTenant.setName(dto.getUsername() + "'s Workspace");
            defaultTenant.setDescription("Default workspace");
            TenantsVO insert = tenantsService.insert(defaultTenant);
            defaultTenantsList.add(BeanUtil.copyProperties(insert, Tenants.class));
        } else {
            // 检查工作空间是否存在
            defaultTenantsList = tenantsMapper.selectList(new LambdaQueryWrapper<Tenants>()
                    .in(Tenants::getId, dto.getTenants()
                            .stream()
                            .map(UsersDTO.BindTenantDTO::getTenantId)
                            .collect(Collectors.toList()))
            );
            if (CollUtil.isEmpty(defaultTenantsList)) {
                throw new ServiceException("工作空间不存在");
            }
        }

        // 7. 创建用户记录
        Users entity = new Users();
        entity.setUsername(dto.getUsername());
        entity.setEmail(dto.getEmail());
        entity.setPasswordHash(hashedPassword);
        entity.setTenantId(defaultTenantsList.get(0).getId());
        entity.setIsActive(true);
        entity.setCanAccessAllTenants(false);
        entity.setIsSystemAdmin(false);
        entity.setCreatedAt(new Date());
        entity.setUpdatedAt(new Date());

        this.baseMapper.insert(entity);

        // 8. 创建默认租户成员
        List<TenantMembers> tenantMembersList = new ArrayList<>();
        defaultTenantsList.forEach(tenant -> {
            String role = TenantMemberRoleEnum.OWNER.getCode();
            if(CollUtil.isNotEmpty(dto.getTenants())){
                role = dto.getTenants().stream()
                        .filter(b -> ObjectUtil.equal(b.getTenantId(), tenant.getId()))
                        .map(UsersDTO.BindTenantDTO::getRole)
                        .findFirst()
                        .orElse(TenantMemberRoleEnum.OWNER.getCode());
            }
            TenantMembers defaultTenantMember = TenantMembers.create(entity, tenant, role);
            tenantMembersList.add(defaultTenantMember);
        });
        tenantMembersService.saveBatch(tenantMembersList);
        return BeanUtil.copyProperties(entity, UsersVO.class);
    }

    /**
     * 密码策略校验：8-32位，必须包含字母和数字
     */
    private void validatePasswordPolicy(String password) {
        if (password == null) {
            throw new ServiceException("密码不能为空");
        }
        int length = password.length();
        if (length < 8 || length > 32) {
            throw new ServiceException("密码长度必须在8-32位之间");
        }

        boolean hasLetter = false;
        boolean hasNumber = false;
        for (char c : password.toCharArray()) {
            if (Character.isLetter(c)) {
                hasLetter = true;
            } else if (Character.isDigit(c)) {
                hasNumber = true;
            }
        }

        if (!hasLetter || !hasNumber) {
            throw new ServiceException("密码必须包含字母和数字");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UsersVO update(@Nonnull UsersDTO dto) {
        Users entity = this.baseMapper.selectById(dto.getId());
        if (BeanUtil.isEmpty(entity)) {
            throw new ServiceException("用户不存在");
        }
        if (CollUtil.isNotEmpty(dto.getTenants())) {
            // 先删除以前的租户成员关系
            tenantMembersMapper.deleteByUserId(dto.getId());
            // 加入新的
            List<Tenants> defaultTenantsList = tenantsMapper.selectList(new LambdaQueryWrapper<Tenants>()
                    .in(Tenants::getId, dto.getTenants()
                            .stream()
                            .map(UsersDTO.BindTenantDTO::getTenantId)
                            .collect(Collectors.toSet())));
            if (CollUtil.isNotEmpty(defaultTenantsList)) {
                List<TenantMembers> tenantMembersList = new ArrayList<>();
                defaultTenantsList.forEach(b -> {
                    String role = dto.getTenants().stream()
                            .filter(t -> ObjectUtil.equal(t.getTenantId(), b.getId()))
                            .map(UsersDTO.BindTenantDTO::getRole)
                            .findFirst()
                            .orElse(TenantMemberRoleEnum.OWNER.getCode());
                    TenantMembers defaultTenantMember = TenantMembers.create(entity, b, role);
                    tenantMembersList.add(defaultTenantMember);
                });
                tenantMembersService.saveBatch(tenantMembersList);
            }
        }
        return BeanUtil.copyProperties(entity, UsersVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(@Nonnull String id) {
        Users entity = this.baseMapper.selectById(id);
        if (BeanUtil.isNotEmpty(entity)) {
            this.baseMapper.deleteById(id);
        }
    }

    @Override
    public List<TenantsVO> bindTenants(String userId) {
        List<TenantMembers> tenantMembers = tenantMembersMapper.selectList(new LambdaQueryWrapper<TenantMembers>()
                .eq(TenantMembers::getUserId, userId)
                .eq(TenantMembers::getStatus, BusinessStatusEnum.ACTIVE.getCode()));
        if (CollUtil.isEmpty(tenantMembers)) {
            return Collections.emptyList();
        }
        List<Tenants> tenantList = tenantsMapper.selectList(new LambdaQueryWrapper<Tenants>()
                .in(Tenants::getId, tenantMembers.stream().map(TenantMembers::getTenantId).collect(Collectors.toList())));
        if (CollUtil.isEmpty(tenantList)) {
            return Collections.emptyList();
        }
        return BeanUtil.copyToList(tenantList, TenantsVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void userBindTenants(@Nonnull UserBindTenantsDTO dto) {

        // 1. 检查用户是否存在
        Users user = this.baseMapper.selectById(dto.getUserId());
        if (BeanUtil.isEmpty(user)) {
            throw new ServiceException("用户不存在");
        }
        // 2. 检查租户是否存在
        List<Tenants> tenantList = tenantsMapper.selectList(new LambdaQueryWrapper<Tenants>()
                .in(Tenants::getId, dto.getTenantIds()));
        if (CollUtil.isEmpty(tenantList)) {
            throw new ServiceException("租户不存在");
        }

        List<TenantMembers> tenantMembersList = new ArrayList<>();
        tenantList.forEach(tenant -> {
            TenantMembers tenantMember = TenantMembers.create(user, tenant, dto.getRole());
            tenantMembersList.add(tenantMember);
        });
        tenantMembersService.saveBatch(tenantMembersList);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void enable(String userId) {
        Users user = this.baseMapper.selectById(userId);
        if (BeanUtil.isEmpty(user)) {
            throw new ServiceException("用户不存在");
        }
        this.baseMapper.update(null, new LambdaUpdateWrapper<Users>()
                .set(Users::getIsActive, true)
                .eq(Users::getId, userId));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void disable(String userId) {
        Users user = this.baseMapper.selectById(userId);
        if (BeanUtil.isEmpty(user)) {
            throw new ServiceException("用户不存在");
        }
        this.baseMapper.update(null, new LambdaUpdateWrapper<Users>()
                .set(Users::getIsActive, false)
                .eq(Users::getId, userId));
    }
}
