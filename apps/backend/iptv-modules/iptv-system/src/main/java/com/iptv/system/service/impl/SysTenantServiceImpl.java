package com.iptv.system.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.common.core.constant.TenantConstant;
import com.iptv.common.core.constant.UserConstants;
import com.iptv.common.core.domain.R;
import com.iptv.common.core.enums.FlagEnum;
import com.iptv.common.core.enums.UserStatus;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.domain.vo.SelectVO;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.security.service.TokenService;
import com.iptv.common.security.utils.SecurityUtils;
import com.iptv.system.api.domain.SysRole;
import com.iptv.system.api.domain.SysTenant;
import com.iptv.system.api.domain.SysUser;
import com.iptv.system.api.domain.dto.SysTenantFilterDTO;
import com.iptv.system.api.domain.dto.SysTenantReqDTO;
import com.iptv.system.api.domain.dto.SysTenantSaveDTO;
import com.iptv.system.api.domain.vo.*;
import com.iptv.system.api.model.LoginUser;
import com.iptv.system.mapper.SysMenuMapper;
import com.iptv.system.mapper.SysRoleMapper;
import com.iptv.system.mapper.SysTenantMapper;
import com.iptv.system.mapper.SysUserMapper;
import com.iptv.system.service.ISysConfigService;
import com.iptv.system.service.ISysRoleService;
import com.iptv.system.service.ISysTenantService;
import com.iptv.system.service.ISysUserService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * 租户服务实现
 */
@Service
public class SysTenantServiceImpl extends ServiceImpl<SysTenantMapper, SysTenant> implements ISysTenantService {

    @Autowired
    private SysTenantMapper sysTenantMapper;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private SysUserMapper sysUserMapper;

    @Autowired
    private SysRoleMapper sysRoleMapper;

    @Autowired
    private ISysUserService sysUserService;

    @Autowired
    private ISysRoleService sysRoleService;

    @Autowired
    private SysMenuMapper sysMenuMapper;

    @Autowired
    private ISysConfigService configService;

    @Override
    public TableDataInfo<SysTenantVO> queryList(SysTenantFilterDTO condition, PageDTO pg) {
        Page<?> page = PageUtils.toPage(pg);
        LoginUser loginUser = tokenService.getLoginUser();
        if (loginUser != null && loginUser.getSysUser() != null && !UserConstants.isAdmin(loginUser.getSysUser().getUserId())) {
            condition.setTenantId(loginUser.getSysUser().getTenantId());
        }
        List<SysTenantVO> list = sysTenantMapper.getTenantList(condition, page);
        return PageUtils.getDataTable(list, page);
    }

    @Override
    public R<List<SysTenantReChangeVO>> getAlltenant() {
        Long tenantId = tokenService.getUserTenantId();
        if (TenantConstant.ADMIN_TENANT_ID.equals(tenantId)) {
            tenantId = null;
        }
        List<SysTenantReChangeVO> list = sysTenantMapper.getAllTenantList(tenantId);
        return R.ok(list);
    }

    @Override
    public SysTenantVO queryById(Long id) {
        SysTenant entity = sysTenantMapper.selectById(id);
        if (entity == null) {
            return null;
        }
        SysTenantVO vo = new SysTenantVO();
        BeanUtils.copyProperties(entity, vo);
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public R<SysTenantVO> update(SysTenantSaveDTO saveVO) {
        SysTenant oldTenant = sysTenantMapper.selectById(saveVO.getId());
        if (oldTenant == null) {
            throw new ServiceException("该租户不存在");
        }

        validName(saveVO.getId(), saveVO.getName());

        BeanUtils.copyProperties(saveVO, oldTenant);
        if (StrUtil.isEmpty(saveVO.getProvinceCode())) {
            oldTenant.setProvinceCode("");
        }
        if (StrUtil.isEmpty(saveVO.getAreaCode())) {
            oldTenant.setAreaCode("");
        }
        if (StrUtil.isEmpty(oldTenant.getCityCode())) {
            oldTenant.setCityCode("");
        }

        String thirdTenantType;
        if (StrUtil.isEmpty(oldTenant.getThirdTenantId())) {
            thirdTenantType = TenantConstant.TenantType.INNER.getCode();
        } else {
            thirdTenantType = TenantConstant.TenantType.THIRD_2_0.getCode();
        }
        oldTenant.setThirdTenantType(thirdTenantType);
        validThirdId(oldTenant.getId(), thirdTenantType, oldTenant.getThirdTenantId());

        oldTenant.setQps(saveVO.getQps());
        this.updateById(oldTenant);

        kickOutUserByTenantId(oldTenant.getId());
        return R.ok(null, "更新成功");
    }

    @Override
    public void kickOutUserByTenantId(Long tenantId) {
        CompletableFuture.runAsync(() -> {
            LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(SysUser::getTenantId, tenantId);
            List<SysUser> sysUsers = sysUserMapper.selectList(wrapper);
            sysUsers.forEach(user -> tokenService.delLoginUser(user.getUserId().toString()));
        });
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SysTenantVO insert(SysTenantReqDTO reqVO) {
        validName(null, reqVO.getName());

        SysTenant entity = new SysTenant();
        BeanUtils.copyProperties(reqVO, entity);
        setAncestors(reqVO.getParentId(), entity);

        entity.setDelFlag("0");
        entity.setStatus(UserStatus.OK.getCode());

        String thirdTenantType;
        if (StrUtil.isEmpty(entity.getThirdTenantId())) {
            thirdTenantType = TenantConstant.TenantType.INNER.getCode();
        } else {
            thirdTenantType = TenantConstant.TenantType.THIRD_2_0.getCode();
        }
        entity.setThirdTenantType(thirdTenantType);
        validThirdId(null, thirdTenantType, entity.getThirdTenantId());

        entity.setMaxCallTimes(ObjectUtil.defaultIfNull(reqVO.getMaxCallTimes(), 0L) * 10000);

        int insert = sysTenantMapper.insert(entity);

        if (insert > 0) {
            SysUser adminUser = reqVO.getInitAdminUser();
            Long roleId;
            if (ObjectUtil.isNotNull(adminUser) && ObjectUtil.isNull(adminUser.getRoleId())) {
                // 新增默认角色
                SysRole sysRole = insertDefaultRole(entity);
                roleId = sysRole.getRoleId();
            } else {
                SysRole sysRole = copyRole(adminUser, entity);
                roleId = sysRole.getRoleId();
            }

            // 新增默认管理员
            if (ObjectUtil.isNotNull(adminUser) && StrUtil.isAllNotBlank(adminUser.getUserName(), adminUser.getNickName())) {
                adminUser.setCreateBy(SecurityUtils.getUsername());
                String password = configService.selectConfigByKey("sys.user.initPassword");
                BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
                adminUser.setPassword(passwordEncoder.encode(password));
                adminUser.setAdminFlag(FlagEnum.YES.getCode());
                adminUser.setTenantId(entity.getId());
                adminUser.setRoleIds(new Long[]{roleId});
                sysUserService.insertUser(adminUser);
            }
        }

        SysTenantVO vo = new SysTenantVO();
        BeanUtils.copyProperties(entity, vo);
        return vo;
    }

    private SysRole copyRole(SysUser admin, SysTenant entity) {
        Long roleId = admin.getRoleId();
        SysRole sysRole = sysRoleMapper.selectRoleById(roleId);
        SysRole role = new SysRole();
        if(BeanUtil.isNotEmpty(sysRole)){
            role.setRoleName(entity.getName() + "管理员");
            role.setStatus(UserStatus.OK.getCode());
            role.setRoleKey("admin_" + entity.getId());
            role.setRoleSort(0);
            role.setTenantId(entity.getId());
            role.setBuiltin(FlagEnum.YES.getCode());

            List<Long> menuIdList = sysMenuMapper.selectMenuListByRoleId(sysRole.getRoleId(), false);
            role.setMenuIds(menuIdList.toArray(new Long[0]));
            sysRoleService.insertRole(role);
        }else{
            role = insertDefaultRole(entity);
        }

        return role;
    }

    private SysRole insertDefaultRole(SysTenant entity) {
        SysRole defaultRole = new SysRole();
        defaultRole.setRoleName(entity.getName() + "管理员");
        defaultRole.setStatus(UserStatus.OK.getCode());
        defaultRole.setRoleKey("admin_" + entity.getId());
        defaultRole.setRoleSort(0);
        defaultRole.setTenantId(entity.getId());
        defaultRole.setBuiltin(FlagEnum.YES.getCode());

        Long[] menuIds = sysMenuMapper.selectAllMenuId();
        defaultRole.setMenuIds(menuIds);
        sysRoleService.insertRole(defaultRole);
        return defaultRole;
    }

    private void setAncestors(Long parentId, SysTenant tenant) {
        if (parentId != null) {
            SysTenant parentTenant = sysTenantMapper.selectById(parentId);
            if (parentTenant != null) {
                tenant.setAncestors(parentTenant.getAncestors() + SysTenant.ANCESTORS_SEP + parentTenant.getId());
            }
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void changeStatus(Long id, String key) {
        if (TenantConstant.ADMIN_TENANT_ID.equals(id)) {
            throw new ServiceException("不可停用(该租户为平台租户)");
        }
        SysTenant entity = sysTenantMapper.selectById(id);
        if (entity == null) {
            throw new ServiceException("该ID信息不存在");
        }
        LambdaUpdateWrapper<SysTenant> wrapper = new LambdaUpdateWrapper<>();
        wrapper.set(SysTenant::getStatus, key).eq(SysTenant::getId, id);
        this.update(wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteUpdateById(Long id) {
        LambdaQueryWrapper<SysUser> userWrapper = new LambdaQueryWrapper<>();
        userWrapper.eq(SysUser::getTenantId, id).eq(SysUser::getDelFlag, "0");
        Long userCount = sysUserMapper.selectCount(userWrapper);
        if (userCount > 0) {
            throw new ServiceException("不可删除(该租户已有用户绑定)");
        }

        LambdaQueryWrapper<SysRole> roleWrapper = new LambdaQueryWrapper<>();
        roleWrapper.eq(SysRole::getTenantId, id).eq(SysRole::getDelFlag, "0");
        Long roleCount = sysRoleMapper.selectCount(roleWrapper);
        if (roleCount > 0) {
            throw new ServiceException("不可删除(该租户已绑定角色)");
        }

        if (TenantConstant.ADMIN_TENANT_ID.equals(id)) {
            throw new ServiceException("不可删除(该租户为平台租户)");
        }

        LambdaUpdateWrapper<SysTenant> wrapper = new LambdaUpdateWrapper<>();
        wrapper.set(SysTenant::getDelFlag, "1").eq(SysTenant::getId, id);
        this.update(wrapper);

        kickOutUserByTenantId(id);
    }

    @Override
    public SysTenantEchoVO getTenantData(Long tenantId) {
        if (tenantId == null) {
            throw new ServiceException("租户id不能为空");
        }
        return sysTenantMapper.getTenantData(tenantId);
    }

    @Override
    public List<SysTenantReChangeVO> getAllTenantWhenBi() {
        String delFlag = "0";
        Long tenantId = tokenService.getUserTenantId();
        SysTenant userTenant = this.lambdaQuery()
                .eq(SysTenant::getId, tenantId)
                .eq(SysTenant::getDelFlag, delFlag)
                .one();

        if (ObjectUtil.isEmpty(userTenant)) {
            return Collections.emptyList();
        }

        String ancestors = userTenant.getAncestors() + SysTenant.ANCESTORS_SEP + userTenant.getId() + SysTenant.ANCESTORS_SEP;
        List<SysTenant> childTenants = this.lambdaQuery()
                .and(i -> i.eq(SysTenant::getParentId, userTenant.getId())
                        .or()
                        .likeRight(SysTenant::getAncestors, ancestors))
                .eq(SysTenant::getDelFlag, delFlag)
                .list();

        List<SysTenant> tenantList = new ArrayList<>(childTenants.size() + 1);
        tenantList.add(userTenant);
        tenantList.addAll(childTenants);
        return tenantList.stream().map(i -> {
            SysTenantReChangeVO vo = new SysTenantReChangeVO();
            BeanUtils.copyProperties(i, vo);
            vo.setLabel(vo.getName());
            return vo;
        }).collect(Collectors.toList());
    }

    @Override
    public Set<Long> getTenantChildrenIds(Long tenantId) {
        String delFlag = "0";
        SysTenant userTenant = this.lambdaQuery()
                .eq(SysTenant::getId, tenantId)
                .eq(SysTenant::getStatus, UserStatus.OK.getCode())
                .eq(SysTenant::getDelFlag, delFlag)
                .one();

        if (ObjectUtil.isEmpty(userTenant)) {
            return Collections.emptySet();
        }

        String ancestors = userTenant.getAncestors() + SysTenant.ANCESTORS_SEP + userTenant.getId() + SysTenant.ANCESTORS_SEP;
        List<SysTenant> childTenants = this.lambdaQuery()
                .and(i -> i.eq(SysTenant::getParentId, userTenant.getId())
                        .or()
                        .likeRight(SysTenant::getAncestors, ancestors))
                .eq(SysTenant::getStatus, UserStatus.OK.getCode())
                .eq(SysTenant::getDelFlag, delFlag)
                .select(SysTenant::getId)
                .list();

        return childTenants.stream().map(SysTenant::getId).collect(Collectors.toSet());
    }

    @Override
    public List<SysTenantAppSelectVO> selectTenantByUser() {
        Long userTenantId = tokenService.getUserTenantId();
        String ancestors = null;
        SysTenant tenant = null;

        if (TenantConstant.ADMIN_TENANT_ID.equals(userTenantId)) {
            userTenantId = null;
        } else {
            tenant = this.getById(userTenantId);
        }

        if (tenant != null) {
            ancestors = tenant.getAncestors();
        }

        List<SysTenantAppSelectVO> list = sysTenantMapper.selectTenantApp(userTenantId, ancestors);
        return buildAppSelectTree(list);
    }

    @Override
    public SysTenantRemoteVO getTenantByThirdId(String thirdTenantType, String thirdTenantId) {
        SysTenant one = sysTenantMapper.selectOne(
                new LambdaQueryWrapper<SysTenant>()
                        .eq(SysTenant::getThirdTenantType, thirdTenantType)
                        .eq(SysTenant::getThirdTenantId, thirdTenantId)
                        .eq(SysTenant::getDelFlag, "0")
                        .last("LIMIT 1"));
        if (one == null) {
            return null;
        }
        SysTenantRemoteVO vo = new SysTenantRemoteVO();
        BeanUtils.copyProperties(one, vo);
        return vo;
    }

    @Override
    public boolean checkName(Long tenantId, String name) {
        if (StrUtil.isEmpty(name)) {
            throw new ServiceException("租户名称不能为空");
        }
        Long count = sysTenantMapper.selectCount(
                new LambdaQueryWrapper<SysTenant>()
                        .ne(ObjectUtil.isNotEmpty(tenantId), SysTenant::getId, tenantId)
                        .eq(SysTenant::getName, name)
                        .eq(SysTenant::getDelFlag, "0"));
        return count > 0;
    }

    @Override
    public boolean checkThirdTenantId(Long tenantId, String thirdTenantType, String thirdTenantId) {
        if (StrUtil.isEmpty(thirdTenantId)) {
            return false;
        }
        Long count = sysTenantMapper.selectCount(
                new LambdaQueryWrapper<SysTenant>()
                        .ne(ObjectUtil.isNotEmpty(tenantId), SysTenant::getId, tenantId)
                        .eq(SysTenant::getThirdTenantId, thirdTenantId)
                        .eq(SysTenant::getThirdTenantType, thirdTenantType)
                        .eq(SysTenant::getDelFlag, "0"));
        return count > 0;
    }

    @Override
    public List<SelectVO<Long>> queryCurrentList(SysTenantFilterDTO dto) {
        LoginUser loginUser = tokenService.getLoginUser();
        List<SysTenant> list = lambdaQuery()
                .eq(SysTenant::getDelFlag, "0")
                .eq(SysTenant::getStatus, UserStatus.OK.getCode())
                .eq(!loginUser.getSysUser().isTenantAdmin(), SysTenant::getId, loginUser.getSysUser().getTenantId())
                .orderByDesc(SysTenant::getCreateTime)
                .list();

        if (ObjectUtil.isNull(list)) {
            return Collections.emptyList();
        }
        return list.stream().map(x -> {
            SelectVO<Long> selectVO = new SelectVO<>();
            selectVO.setLabel(x.getName());
            selectVO.setValue(x.getId());
            return selectVO;
        }).collect(Collectors.toList());
    }

    // --- private helpers ---

    private void validName(Long tenantId, String tenantName) {
        if (checkName(tenantId, tenantName)) {
            throw new ServiceException("该租户名称已存在");
        }
    }

    private void validThirdId(Long tenantId, String thirdTenantType, String thirdTenantId) {
        if (checkThirdTenantId(tenantId, thirdTenantType, thirdTenantId)) {
            throw new ServiceException("租户CODE重复，请重新输入");
        }
    }

    /**
     * 构建下拉树（简易实现替代 TreeUtils）
     */
    private List<SysTenantAppSelectVO> buildAppSelectTree(List<SysTenantAppSelectVO> list) {
        if (CollUtil.isEmpty(list)) {
            return list;
        }
        Map<Long, SysTenantAppSelectVO> map = new LinkedHashMap<>();
        for (SysTenantAppSelectVO vo : list) {
            map.put(vo.getId(), vo);
        }
        List<SysTenantAppSelectVO> roots = new ArrayList<>();
        for (SysTenantAppSelectVO vo : list) {
            SysTenantAppSelectVO parent = map.get(vo.getParentId());
            if (parent != null) {
                if (parent.getChildren() == null) {
                    parent.setChildren(new ArrayList<>());
                }
                parent.getChildren().add(vo);
            } else {
                roots.add(vo);
            }
        }
        return roots;
    }
}
