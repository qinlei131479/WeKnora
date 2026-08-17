package com.iptv.system.service.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.common.core.constant.UserConstants;
import com.iptv.common.core.domain.R;
import com.iptv.common.core.enums.FlagEnum;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.MessageUtils;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.utils.StringUtils;
import com.iptv.common.core.utils.bean.BeanValidators;
import com.iptv.common.core.web.domain.vo.SelectVO;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.datascope.annotation.DataScope;
import com.iptv.common.security.service.TokenService;
import com.iptv.common.security.utils.SecurityUtils;
import com.iptv.system.api.domain.*;
import com.iptv.system.api.domain.dto.RefreshLoginInfoDTO;
import com.iptv.system.api.model.LoginUser;
import com.iptv.system.domain.SysUserRole;
import com.iptv.system.mapper.*;
import com.iptv.system.service.ISysConfigService;
import com.iptv.system.service.ISysDeptService;
import com.iptv.system.service.ISysUserService;
import jakarta.annotation.Resource;
import jakarta.validation.Validator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 用户 业务层处理
 *
 * @author ruoyi
 */
@Service
public class SysUserServiceImpl extends ServiceImpl<SysUserMapper, SysUser> implements ISysUserService {
    private static final Logger log = LoggerFactory.getLogger(SysUserServiceImpl.class);

    @Autowired
    private SysRoleMapper roleMapper;

    @Autowired
    private SysPostMapper postMapper;

    @Autowired
    private SysUserRoleMapper userRoleMapper;

    @Autowired
    private SysUserPostMapper userPostMapper;

    @Autowired
    private SysUserDeptMapper userDeptMapper;

    @Autowired
    private ISysConfigService configService;

    @Autowired
    private ISysDeptService deptService;

    @Autowired
    protected Validator validator;

    @Autowired
    private SysTenantMapper sysTenantMapper;

    @Resource
    private TokenService tokenService;

    /**
     * 根据条件分页查询用户列表
     *
     * @param user 用户信息
     * @return 用户信息集合信息
     */
    @Override
    @DataScope(deptAlias = "d", userAlias = "u")
    public TableDataInfo<SysUser> selectUserList(SysUser user, PageDTO dto) {
        Page pg = PageUtils.toPage(dto);

        LoginUser loginUser = tokenService.getLoginUser();
//        SysUser sysUser = loginUser.getSysUser();
//        if (!sysUser.isTenantAdmin()) {
//            user.setTenantId(sysUser.getTenantId());
//        } else if (!sysUser.isAdmin()) {
//            user.setUserId(sysUser.getUserId());
//        }

        List<SysUser> list = this.baseMapper.selectUserList(user, pg);

        TableDataInfo<SysUser> table = PageUtils.getDataTable(list, pg);


        fillOtherInfo(table);
        return table;
    }

    /**
     * 填充其他信息
     *
     * @param table
     */
    private void fillOtherInfo(TableDataInfo<SysUser> table) {
        List<SysUser> rows = table.getRows();
        rows.forEach(x -> {
            List<SysRole> sysRoles = roleMapper.selectRolePermissionByUserId(x.getUserId());
            if (CollUtil.isNotEmpty(sysRoles)) {
                SysRole sysRole = sysRoles.get(0);
                if (ObjectUtil.isNotNull(sysRole)) {
                    x.setRoleId(sysRole.getRoleId());
                    x.setRoleName(sysRole.getRoleName());
                }
            }
        });

        Set<Long> tenantIdSet = rows.stream().map(SysUser::getTenantId).collect(Collectors.toSet());
        if (CollUtil.isNotEmpty(tenantIdSet)) {
            Map<Long, SysTenant> sysTenantMap = sysTenantMapper.selectList(new LambdaQueryWrapper<SysTenant>()
                    .in(SysTenant::getId, tenantIdSet)).stream().collect(Collectors.toMap(SysTenant::getId, Function.identity()));

            rows.forEach(x -> {
                SysTenant tenant = sysTenantMap.get(x.getTenantId());
                if (ObjectUtil.isNotNull(tenant)) {
                    x.setTenantName(tenant.getName());
                }
            });
        }
        table.setRows(rows);
    }

    /**
     * 根据条件分页查询已分配用户角色列表
     *
     * @param user 用户信息
     * @return 用户信息集合信息
     */
    @Override
    @DataScope(deptAlias = "d", userAlias = "u")
    public TableDataInfo<SysUser> selectAllocatedList(SysUser user, PageDTO dto) {
        Page pg = PageUtils.toPage(dto);
        List<SysUser> list = this.baseMapper.selectAllocatedList(user, pg);
        return PageUtils.getDataTable(list, pg);
    }

    /**
     * 根据条件分页查询未分配用户角色列表
     *
     * @param user 用户信息
     * @return 用户信息集合信息
     */
    @Override
    @DataScope(deptAlias = "d", userAlias = "u")
    public TableDataInfo<SysUser> selectUnallocatedList(SysUser user, PageDTO dto) {
        Page pg = PageUtils.toPage(dto);
        List<SysUser> list = this.baseMapper.selectUnallocatedList(user, pg);
        return PageUtils.getDataTable(list, pg);
    }

    /**
     * 通过用户名查询用户
     *
     * @param userName 用户名
     * @return 用户对象信息
     */
    @Override
    public SysUser selectUserByUserName(String userName) {
        return this.baseMapper.selectUserByUserName(userName);
    }

    /**
     * 通过用户ID查询用户
     *
     * @param userId 用户ID
     * @return 用户对象信息
     */
    @Override
    public SysUser selectUserById(Long userId) {
        return this.baseMapper.selectUserById(userId);
    }

    /**
     * 查询用户所属角色组
     *
     * @param userName 用户名
     * @return 结果
     */
    @Override
    public String selectUserRoleGroup(String userName) {
        List<SysRole> list = roleMapper.selectRolesByUserName(userName);
        if (CollectionUtils.isEmpty(list)) {
            return StringUtils.EMPTY;
        }
        return list.stream().map(SysRole::getRoleName).collect(Collectors.joining(","));
    }

    /**
     * 查询用户所属岗位组
     *
     * @param userName 用户名
     * @return 结果
     */
    @Override
    public String selectUserPostGroup(String userName) {
        List<SysPost> list = postMapper.selectPostsByUserName(userName);
        if (CollectionUtils.isEmpty(list)) {
            return StringUtils.EMPTY;
        }
        return list.stream().map(SysPost::getPostName).collect(Collectors.joining(","));
    }

    /**
     * 校验用户名称是否唯一
     *
     * @param user 用户信息
     * @return 结果
     */
    @Override
    public boolean checkUserNameUnique(SysUser user) {
        Long userId = StringUtils.isNull(user.getUserId()) ? -1L : user.getUserId();
        SysUser info = this.baseMapper.checkUserNameUnique(user.getUserName());
        if (StringUtils.isNotNull(info) && info.getUserId().longValue() != userId.longValue()) {
            return UserConstants.NOT_UNIQUE;
        }
        return UserConstants.UNIQUE;
    }

    /**
     * 校验手机号码是否唯一
     *
     * @param user 用户信息
     * @return
     */
    @Override
    public boolean checkPhoneUnique(SysUser user) {
        Long userId = StringUtils.isNull(user.getUserId()) ? -1L : user.getUserId();
        SysUser info = this.baseMapper.checkPhoneUnique(user.getPhonenumber());
        if (StringUtils.isNotNull(info) && info.getUserId().longValue() != userId.longValue()) {
            return UserConstants.NOT_UNIQUE;
        }
        return UserConstants.UNIQUE;
    }

    /**
     * 校验email是否唯一
     *
     * @param user 用户信息
     * @return
     */
    @Override
    public boolean checkEmailUnique(SysUser user) {
        Long userId = StringUtils.isNull(user.getUserId()) ? -1L : user.getUserId();
        SysUser info = this.baseMapper.checkEmailUnique(user.getEmail());
        if (StringUtils.isNotNull(info) && info.getUserId().longValue() != userId.longValue()) {
            return UserConstants.NOT_UNIQUE;
        }
        return UserConstants.UNIQUE;
    }

    /**
     * 校验用户是否允许操作
     *
     * @param user 用户信息
     */
    @Override
    public void checkUserAllowed(SysUser user) {
        if (StringUtils.isNotNull(user.getUserId()) && UserConstants.isAdmin(user.getUserId())) {
            throw new ServiceException("system.user.admin.forbidden");
        }
    }

    /**
     * 校验用户是否有数据权限
     *
     * @param userId 用户id
     */
    @Override
    public void checkUserDataScope(Long userId) {
        if (!SecurityUtils.isAdmin()) {
            List<SysUser> users = this.baseMapper.selectList(new LambdaQueryWrapper<SysUser>().eq(SysUser::getUserId, userId));
            if (StringUtils.isEmpty(users)) {
                throw new ServiceException("system.user.scope.denied");
            }
        }
    }

    /**
     * 新增保存用户信息
     *
     * @param user 用户信息
     * @return 结果
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public int insertUser(SysUser user) {
        // 新增用户信息
        int rows = this.baseMapper.insertUser(user);
        // 新增用户岗位关联
        insertUserPost(user);
        // 新增用户与角色管理
        insertUserRole(user);
        // 新增用户与部门关联
        insertUserDept(user);
        return rows;
    }

    /**
     * 注册用户信息
     *
     * @param user 用户信息
     * @return 结果
     */
    @Override
    public boolean registerUser(SysUser user) {
        return this.baseMapper.insertUser(user) > 0;
    }

    /**
     * 修改保存用户信息
     *
     * @param user 用户信息
     * @return 结果
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public int updateUser(SysUser user) {
        Long userId = user.getUserId();
        // 删除用户与角色关联
        userRoleMapper.deleteUserRoleByUserId(userId);
        // 新增用户与角色管理
        insertUserRole(user);
        // 删除用户与岗位关联
        userPostMapper.deleteUserPostByUserId(userId);
        // 新增用户与岗位管理
        insertUserPost(user);
        // 删除用户与部门关联
        userDeptMapper.deleteUserDeptByUserId(userId);
        // 新增用户与部门管理
        insertUserDept(user);
        return this.baseMapper.updateUser(user);
    }

    /**
     * 用户授权角色
     *
     * @param userId  用户ID
     * @param roleIds 角色组
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void insertUserAuth(Long userId, Long[] roleIds) {
        userRoleMapper.deleteUserRoleByUserId(userId);
        insertUserRole(userId, roleIds);
    }

    /**
     * 修改用户状态
     *
     * @param user 用户信息
     * @return 结果
     */
    @Override
    public int updateUserStatus(SysUser user) {
        return this.baseMapper.updateUserStatus(user.getUserId(), user.getStatus());
    }

    /**
     * 修改用户基本信息
     *
     * @param user 用户信息
     * @return 结果
     */
    @Override
    public boolean updateUserProfile(SysUser user) {
        return this.baseMapper.updateUser(user) > 0;
    }

    /**
     * 修改用户头像
     *
     * @param userId 用户ID
     * @param avatar 头像地址
     * @return 结果
     */
    @Override
    public boolean updateUserAvatar(Long userId, String avatar) {
        return this.baseMapper.updateUserAvatar(userId, avatar) > 0;
    }

    /**
     * 更新用户登录信息（IP和登录时间）
     *
     * @param user 用户信息
     * @return 结果
     */
    public boolean updateLoginInfo(SysUser user) {
        return this.baseMapper.updateLoginInfo(user) > 0;
    }

    /**
     * 重置用户密码
     *
     * @param user 用户信息
     * @return 结果
     */
    @Override
    public int resetPwd(SysUser user) {
        return this.baseMapper.resetUserPwd(user.getUserId(), user.getPassword());
    }

    /**
     * 重置用户密码
     *
     * @param userId   用户ID
     * @param password 密码
     * @return 结果
     */
    @Override
    public int resetUserPwd(Long userId, String password) {
        return this.baseMapper.resetUserPwd(userId, password);
    }

    /**
     * 新增用户部门信息
     *
     * @param user 用户对象
     */
    public void insertUserDept(SysUser user) {
        Long userId = user.getUserId();
        List<Long> deptIds = user.getDeptIds();
        if (StringUtils.isNotEmpty(deptIds)) {
            // 新增用户与部门关联
            List<SysUserDept> list = new ArrayList<>();
            for (Long deptId : deptIds) {
                SysUserDept ur = new SysUserDept();
                ur.setUserId(userId);
                ur.setDeptId(deptId);
                list.add(ur);
                userDeptMapper.insert(ur);
            }
        }
    }


    /**
     * 新增用户角色信息
     *
     * @param user 用户对象
     */
    public void insertUserRole(SysUser user) {
        this.insertUserRole(user.getUserId(), user.getRoleIds());
    }

    /**
     * 新增用户岗位信息
     *
     * @param user 用户对象
     */
    public void insertUserPost(SysUser user) {
        Long[] posts = user.getPostIds();
        if (StringUtils.isNotEmpty(posts)) {
            // 新增用户与岗位管理
            List<SysUserPost> list = new ArrayList<SysUserPost>();
            for (Long postId : posts) {
                SysUserPost up = new SysUserPost();
                up.setUserId(user.getUserId());
                up.setPostId(postId);
                list.add(up);
            }
            userPostMapper.batchUserPost(list);
        }
    }

    /**
     * 新增用户角色信息
     *
     * @param userId  用户ID
     * @param roleIds 角色组
     */
    public void insertUserRole(Long userId, Long[] roleIds) {
        if (StringUtils.isNotEmpty(roleIds)) {
            // 新增用户与角色管理
            List<SysUserRole> list = new ArrayList<SysUserRole>();
            for (Long roleId : roleIds) {
                SysUserRole ur = new SysUserRole();
                ur.setUserId(userId);
                ur.setRoleId(roleId);
                list.add(ur);
            }
            userRoleMapper.batchUserRole(list);
        }
    }

    /**
     * 通过用户ID删除用户
     *
     * @param userId 用户ID
     * @return 结果
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public int deleteUserById(Long userId) {
        // 删除用户与角色关联
        userRoleMapper.deleteUserRoleByUserId(userId);
        // 删除用户与岗位表
        userPostMapper.deleteUserPostByUserId(userId);
        return this.baseMapper.deleteUserById(userId);
    }

    /**
     * 批量删除用户信息
     *
     * @param userIds 需要删除的用户ID
     * @return 结果
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public int deleteUserByIds(Long[] userIds) {
        for (Long userId : userIds) {
            checkUserAllowed(new SysUser(userId));
            checkUserDataScope(userId);
        }
        // 删除用户与角色关联
        userRoleMapper.deleteUserRole(userIds);
        // 删除用户与岗位关联
        userPostMapper.deleteUserPost(userIds);
        // 删除用户与部门关联
        userDeptMapper.deleteUserDept(userIds);
        return this.baseMapper.deleteUserByIds(userIds);
    }

    /**
     * 导入用户数据
     *
     * @param userList        用户数据列表
     * @param isUpdateSupport 是否更新支持，如果已存在，则进行更新数据
     * @param operName        操作用户
     * @return 结果
     */
    @Override
    public String importUser(List<SysUser> userList, Boolean isUpdateSupport, String operName) {
        if (StringUtils.isNull(userList) || userList.size() == 0) {
            throw new ServiceException("system.user.import.empty");
        }
        int successNum = 0;
        int failureNum = 0;
        StringBuilder successMsg = new StringBuilder();
        StringBuilder failureMsg = new StringBuilder();
        for (SysUser user : userList) {
            try {
                // 验证是否存在这个用户
                SysUser u = this.baseMapper.selectUserByUserName(user.getUserName());
                if (StringUtils.isNull(u)) {
                    BeanValidators.validateWithException(validator, user);
                    deptService.checkDeptDataScope(user.getDeptId());
                    String password = configService.selectConfigByKey("sys.user.initPassword");
                    user.setPassword(SecurityUtils.encryptPassword(password));
                    user.setCreateBy(operName);
                    this.baseMapper.insertUser(user);
                    successNum++;
                    successMsg.append(MessageUtils.message("system.user.import.item.success", successNum, user.getUserName()));
                } else if (isUpdateSupport) {
                    BeanValidators.validateWithException(validator, user);
                    checkUserAllowed(u);
                    checkUserDataScope(u.getUserId());
                    deptService.checkDeptDataScope(user.getDeptId());
                    user.setUserId(u.getUserId());
                    user.setDeptId(u.getDeptId());
                    user.setUpdateBy(operName);
                    this.baseMapper.updateUser(user);
                    successNum++;
                    successMsg.append(MessageUtils.message("system.user.import.item.updated", successNum, user.getUserName()));
                } else {
                    failureNum++;
                    failureMsg.append(MessageUtils.message("system.user.import.item.exists", failureNum, user.getUserName()));
                }
            } catch (Exception e) {
                failureNum++;
                String msg = MessageUtils.message("system.user.import.item.failed", failureNum, user.getUserName(), e.getMessage());
                failureMsg.append(msg);
                log.error(msg, e);
            }
        }
        if (failureNum > 0) {
            failureMsg.insert(0, MessageUtils.message("system.user.import.failed.summary", failureNum));
            throw new ServiceException(failureMsg.toString());
        } else {
            successMsg.insert(0, MessageUtils.message("system.user.import.success.summary", successNum));
        }
        return successMsg.toString();
    }

    @Override
    public List<SysUser> all() {
        return this.baseMapper.selectList(null);
    }

    @Override
    public void refreshLoginInfo(RefreshLoginInfoDTO dto) {
        SysUser sysUser = this.baseMapper.selectUserById(dto.getUserId());
        if (ObjectUtil.isNull(sysUser)) {
            return;
        }

        sysUser.setLoginIp(dto.getIpAddr());
        sysUser.setLoginDate(dto.getDate());
        this.baseMapper.refreshLoginInfo(sysUser);
    }

    @Override
    public boolean checkPassword(Long userId, String password) {
        SysUser user = getById(userId);
        if (ObjectUtil.isNull(user)) {
            throw new ServiceException("system.user.not.exists");
        }
        checkUserDataScope(user.getUserId());

        return SecurityUtils.matchesPassword(password, user.getPassword());
    }

    @Override
    public SysUser selectByScgcUserId(Long userId) {
        return this.baseMapper.selectByScgcUserId(userId);
    }

    @Override
    public R bindScgcUser(Long userId, Long otherUserId) {
        SysUser sysUser = this.baseMapper.selectUserById(userId);
        if (ObjectUtil.isNull(sysUser)) {
            return R.fail(MessageUtils.message("system.user.not.exists"));
        }
        if (ObjectUtil.isNotNull(otherUserId)) {
            if (ObjectUtil.isNotNull(sysUser.getScgcUserId())) {
                return R.fail(MessageUtils.message("system.user.already.bound"));
            }
            SysUser scgcUser = this.baseMapper.selectByScgcUserId(otherUserId);
            if (ObjectUtil.isNotNull(scgcUser) && !scgcUser.getUserId().equals(userId)) {
                return R.fail(MessageUtils.message("system.user.already.bound"));
            }
        }

        this.baseMapper.updateUserScgcUserId(userId, otherUserId);
        return R.ok();
    }

    /**
     * 获取当前登陆用户所能查看到的用户id列表
     * 管理员返回空
     * 租户管理员返回当前租户id
     * 都不是返回当前id
     *
     * @return
     */
    @Override
    public List<Long> getUserIdsByUserId() {
        SysUser sysUser = tokenService.getLoginUser().getSysUser();
        // 判断是否为超级管理员
        if (SecurityUtils.isAdmin(sysUser.getUserId())) {
            // 超级管理员查所有
            return null;
        }
        // 判断是否为租户管理员
        if (ObjectUtil.isNotNull(sysUser)) {
            // 判断是否为租户管理员
            if (FlagEnum.YES.getCode().equals(sysUser.getAdminFlag())) {
                Long tenantId = sysUser.getTenantId();
                List<SysUser> userList = lambdaQuery().eq(SysUser::getTenantId, tenantId).list();
                if (ObjectUtil.isNotEmpty(userList)) {
                    return userList.stream().map(SysUser::getUserId).collect(Collectors.toList());
                }
            }
        }
        // 非管理员也非租户管理员, 返回当前id
//        return Collections.singletonList(SecurityUtils.getUserId());
        // 上面那个报错了, 不允许反射, 改用下面
        List<Long> singleList = new ArrayList<>();
        singleList.add(sysUser.getUserId());
        return singleList;
    }

    @Override
    public List<SelectVO<String>> getSelectList(String keyword) {
        List<SysUser> sysUsers = this.baseMapper.selectList(new LambdaQueryWrapper<>(SysUser.class)
                .select(SysUser::getUserId, SysUser::getNickName)
                .eq(SysUser::getDelFlag, "0")
                .eq(SysUser::getStatus, "0")
                .like(StrUtil.isNotBlank(keyword), SysUser::getNickName, keyword));
        return sysUsers.stream().map(x -> {
            SelectVO<String> selectVO = new SelectVO<>();
            selectVO.setLabel(String.valueOf(x.getUserId()));
            selectVO.setValue(x.getNickName());
            return selectVO;
        }).collect(Collectors.toList());
    }

}
