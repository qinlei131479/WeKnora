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
import com.iptv.business.domain.dto.UserBindTenantsDTO;
import com.iptv.business.domain.dto.UsersDTO;
import com.iptv.business.domain.dto.page.UsersPageDTO;
import com.iptv.business.domain.vo.UsersVO;
import com.iptv.business.enums.TenantMemberRoleEnum;
import com.iptv.business.pgmapper.TenantMembersMapper;
import com.iptv.business.pgmapper.TenantsMapper;
import com.iptv.business.pgmapper.UsersMapper;
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

import java.util.Date;
import java.util.List;

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

    @Override
    public TableDataInfo<UsersVO> queryPage(UsersPageDTO dto, PageDTO pg) {
        Page<UsersVO> page = PageUtils.toPage(pg);
        List<Users> list = this.baseMapper.queryPage(dto, page);
        List<UsersVO> voList = BeanUtil.copyToList(list, UsersVO.class);
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public UsersVO queryById(@Nonnull String id) {
        Users entity = this.baseMapper.selectById(id);
        return BeanUtil.copyProperties(entity, UsersVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UsersVO insert(@Nonnull UsersDTO dto) {
        // 1. 参数校验
        if (StrUtil.isBlank(dto.getUsername())) {
            throw new ServiceException("用户名不能为空");
        }
        if (StrUtil.isBlank(dto.getEmail())) {
            throw new ServiceException("邮箱不能为空");
        }
        if (StrUtil.isBlank(dto.getPassword())) {
            throw new ServiceException("密码不能为空");
        }

        // 2. 密码策略校验（8-32位，必须包含字母和数字）
        validatePasswordPolicy(dto.getPassword());

        // 3. 检查邮箱唯一性
        Users existingUserByEmail = this.baseMapper.selectOne(
                new LambdaUpdateWrapper<Users>()
                        .eq(Users::getEmail, dto.getEmail())
                        .eq(Users::getIsActive, true)
                        .isNull(Users::getDeletedAt)
        );
        if (existingUserByEmail != null) {
            throw new ServiceException("该邮箱已被注册");
        }

        // 4. 检查用户名唯一性
        Users existingUserByUsername = this.baseMapper.selectOne(
                new LambdaUpdateWrapper<Users>().eq(Users::getUsername, dto.getUsername())
        );
        if (existingUserByUsername != null) {
            throw new ServiceException("该用户名已被使用");
        }

        // 5. 密码加密（使用BCrypt）
        String hashedPassword = BCrypt.hashpw(dto.getPassword(), BCrypt.gensalt());

        Tenants defaultTenant = null;
        if (ObjectUtil.isNull(dto.getTenantId())) {
            // 6. 创建默认工作空间
            defaultTenant = new Tenants();
            defaultTenant.setName(dto.getUsername() + "'s Workspace");
            defaultTenant.setDescription("Default workspace");
            defaultTenant.setStatus("active");
            defaultTenant.setBusiness("");
            defaultTenant.setCreatedAt(new Date());
            defaultTenant.setUpdatedAt(new Date());
            defaultTenant.setStorageQuota(10L * 1024 * 1024 * 1024); // 10GB
            defaultTenant.setStorageUsed(0L);
            tenantsService.save(defaultTenant);
        } else {
            // 6. 检查工作空间是否存在
            defaultTenant = tenantsService.getById(dto.getTenantId());
            if (BeanUtil.isEmpty(defaultTenant)) {
                throw new ServiceException("工作空间不存在");
            }
        }

        // 7. 创建用户记录
        Users entity = new Users();
        entity.setUsername(dto.getUsername());
        entity.setEmail(dto.getEmail());
        entity.setPasswordHash(hashedPassword);
        entity.setTenantId(defaultTenant.getId());
        entity.setIsActive(true);
        entity.setCanAccessAllTenants(false);
        entity.setIsSystemAdmin(false);
        entity.setCreatedAt(new Date());
        entity.setUpdatedAt(new Date());

        this.baseMapper.insert(entity);

        // 8. 创建默认租户成员
        TenantMembers defaultTenantMember = TenantMembers.create(entity, defaultTenant, TenantMemberRoleEnum.OWNER.getCode());
        tenantMembersMapper.insert(defaultTenantMember);

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
            throw new ServiceException("用户账号：登录凭证、系统管理员标志、跨租户访问与个人偏好不存在");
        }
        BeanUtil.copyProperties(dto, entity);
        this.baseMapper.updateById(entity);
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
        tenantList.forEach(tenant -> {
            TenantMembers tenantMember = TenantMembers.create(user, tenant, dto.getRole());
            tenantMembersMapper.insert(tenantMember);
        });
    }
}
