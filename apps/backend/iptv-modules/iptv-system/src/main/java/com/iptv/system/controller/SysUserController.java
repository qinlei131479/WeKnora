package com.iptv.system.controller;

import cn.hutool.core.collection.CollectionUtil;
import cn.hutool.core.collection.ListUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.iptv.common.core.constant.UserConstants;
import com.iptv.common.core.domain.R;
import com.iptv.common.core.text.Convert;
import com.iptv.common.core.utils.DateUtils;
import com.iptv.common.core.utils.StringUtils;
import com.iptv.common.core.utils.poi.ExcelUtil;
import com.iptv.common.core.web.controller.BaseController;
import com.iptv.common.core.web.domain.AjaxResult;
import com.iptv.common.core.web.domain.vo.SelectVO;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.log.annotation.Log;
import com.iptv.common.log.enums.BusinessType;
import com.iptv.common.security.annotation.InnerAuth;
import com.iptv.common.security.annotation.RequiresPermissions;
import com.iptv.common.security.service.TokenService;
import com.iptv.common.security.utils.SecurityUtils;
import com.iptv.system.api.domain.*;
import com.iptv.system.api.domain.dto.RefreshLoginInfoDTO;
import com.iptv.system.api.model.LoginUser;
import com.iptv.system.domain.vo.TreeSelect;
import com.iptv.system.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.commons.lang3.ArrayUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 用户信息
 *
 * @author ruoyi
 */
@Tag(name = "用户管理控制器", description = "用户管理控制器")
@RestController
@RequestMapping("/user")
public class SysUserController extends BaseController {
    @Autowired
    private ISysUserService userService;

    @Autowired
    private ISysRoleService roleService;

    @Autowired
    private ISysDeptService deptService;

    @Autowired
    private ISysPostService postService;

    @Autowired
    private ISysPermissionService permissionService;

    @Autowired
    private ISysConfigService configService;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private ISysTenantService tenantService;

    /**
     * 获取用户列表
     */
    @Operation(description = "获取用户列表")
//    @RequiresPermissions("system:user:list")
    @GetMapping("/list")
    public TableDataInfo<SysUser> list(SysUser user, PageDTO pg) {
        return userService.selectUserList(user, pg);
    }


    @Operation(description = "获取全部用户列表")
    @RequiresPermissions("system:user:list")
    @GetMapping("/all")
    public AjaxResult all() {
        List<SysUser> all = userService.all();
        return success(all);
    }

    @Log(title = "用户管理", businessType = BusinessType.EXPORT)
    @RequiresPermissions("system:user:export")
    @PostMapping("/export")
    public void export(HttpServletResponse response, SysUser user) {
        List<SysUser> list = userService.list(new LambdaQueryWrapper<SysUser>().eq(SysUser::getUserId, user.getUserId()));
        ExcelUtil<SysUser> util = new ExcelUtil<SysUser>(SysUser.class);
        util.exportExcel(response, list, "用户数据");
    }

    @Log(title = "用户管理", businessType = BusinessType.IMPORT)
    @RequiresPermissions("system:user:import")
    @PostMapping("/importData")
    public AjaxResult importData(MultipartFile file, boolean updateSupport) throws Exception {
        ExcelUtil<SysUser> util = new ExcelUtil<SysUser>(SysUser.class);
        List<SysUser> userList = util.importExcel(file.getInputStream());
        String operName = SecurityUtils.getUsername();
        String message = userService.importUser(userList, updateSupport, operName);
        return success(message);
    }

    @PostMapping("/importTemplate")
    public void importTemplate(HttpServletResponse response) throws IOException {
        ExcelUtil<SysUser> util = new ExcelUtil<SysUser>(SysUser.class);
        util.importTemplateExcel(response, "用户数据");
    }

    /**
     * 获取当前用户信息
     */
    @InnerAuth
    @GetMapping("/info/{username}")
    public R<LoginUser> info(@PathVariable("username") String username) {
        SysUser sysUser = userService.selectUserByUserName(username);
        if (StringUtils.isNull(sysUser)) {
            return R.fail("用户名或密码错误");
        }
        // 角色集合
        Set<String> roles = permissionService.getRolePermission(sysUser);
        // 权限集合
        Set<String> permissions = permissionService.getMenuPermission(sysUser);
        LoginUser sysUserVo = new LoginUser();
        sysUserVo.setSysUser(sysUser);
        sysUserVo.setRoles(roles);
        sysUserVo.setPermissions(permissions);
        return R.ok(sysUserVo);
    }

    /**
     * 注册用户信息
     */
    @InnerAuth
    @PostMapping("/register")
    public R<Boolean> register(@RequestBody SysUser sysUser) {
        String username = sysUser.getUserName();
        if (!("true".equals(configService.selectConfigByKey("sys.account.registerUser")))) {
            return R.fail("当前系统没有开启注册功能！");
        }
        if (!userService.checkUserNameUnique(sysUser)) {
            return R.fail("保存用户'" + username + "'失败，注册账号已存在");
        }
        return R.ok(userService.registerUser(sysUser));
    }

    /**
     * 记录用户登录IP地址和登录时间
     */
    @InnerAuth
    @PutMapping("/recordlogin")
    public R<Boolean> recordlogin(@RequestBody SysUser sysUser) {
        return R.ok(userService.updateLoginInfo(sysUser));
    }

    /**
     * 获取用户信息
     *
     * @return 用户信息
     */
    @GetMapping("getInfo")
    public AjaxResult getInfo() {
        LoginUser loginUser = SecurityUtils.getLoginUser();
        SysUser user = loginUser.getSysUser();
        // 角色集合
        Set<String> roles = permissionService.getRolePermission(user);
        // 权限集合
        Set<String> permissions = permissionService.getMenuPermission(user);
        if (!loginUser.getPermissions().equals(permissions)) {
            loginUser.setPermissions(permissions);
            tokenService.refreshToken(loginUser);
        }
        AjaxResult ajax = AjaxResult.success();
        ajax.put("user", user);
        ajax.put("roles", roles);
        ajax.put("permissions", permissions);
        ajax.put("isDefaultModifyPwd", initPasswordIsModify(user.getPwdUpdateDate()));
        ajax.put("isPasswordExpired", passwordIsExpiration(user.getPwdUpdateDate()));
        Long tenantId = user.getTenantId();
        if (ObjectUtil.isNotNull(tenantId)) {
            SysTenant tenant = tenantService.getById(tenantId);
            ajax.put("tenant", tenant);
        }
        return ajax;
    }

    // 检查初始密码是否提醒修改
    public boolean initPasswordIsModify(Date pwdUpdateDate) {
        Integer initPasswordModify = Convert.toInt(configService.selectConfigByKey("sys.account.initPasswordModify"));
        return initPasswordModify != null && initPasswordModify == 1 && pwdUpdateDate == null;
    }

    // 检查密码是否过期
    public boolean passwordIsExpiration(Date pwdUpdateDate) {
        Integer passwordValidateDays = Convert.toInt(configService.selectConfigByKey("sys.account.passwordValidateDays"));
        if (passwordValidateDays != null && passwordValidateDays > 0) {
            if (StringUtils.isNull(pwdUpdateDate)) {
                // 如果从未修改过初始密码，直接提醒过期
                return true;
            }
            Date nowDate = DateUtils.getNowDate();
            return DateUtils.differentDaysByMillisecond(nowDate, pwdUpdateDate) > passwordValidateDays;
        }
        return false;
    }

    /**
     * 根据用户编号获取详细信息
     */
    @RequiresPermissions("system:user:query")
    @GetMapping(value = {"/", "/{userId}"})
    public R getInfo(@PathVariable(value = "userId", required = false) Long userId) {
        userService.checkUserDataScope(userId);
        HashMap<String, Object> result = new HashMap<>();

        List<SysRole> roles = roleService.selectRoleAll();
        result.put("roles", UserConstants.isAdmin(userId) ? roles
                : roles.stream().filter(r -> !r.isAdmin()).collect(Collectors.toList()));
        List<SysPost> allPosts = postService.selectPostAll();
        result.put("posts", allPosts);

        List<SysDept> allDepts = deptService.selectDeptAll();
        result.put("depts", allDepts);

        if (ObjectUtil.isNotNull(userId)) {
            SysUser sysUser = userService.selectUserById(userId);
            if (ObjectUtil.isNotNull(sysUser)) {
                sysUser.setPassword(null);
            }
            result.put("data", sysUser);
            List<Long> posts = postService.selectPostListByUserId(userId);
            result.put("postIds", posts);
            List<String> postNames = new ArrayList<>();
            if (CollectionUtil.isNotEmpty(posts)) {
                postNames = allPosts.stream()
                        .filter(post -> CollectionUtil.contains(posts, post.getPostId()))
                        .map(SysPost::getPostName).toList();
            }
            result.put("postNames", postNames);
            result.put("roleIds", sysUser.getRoles().stream().map(SysRole::getRoleId).collect(Collectors.toList()));
            List<Long> deptIdList = deptService.selectDeptListByUserId(userId);
            result.put("deptIds", deptIdList);

            Long tenantId = sysUser.getTenantId();
            if (ObjectUtil.isNotNull(tenantId)) {
                SysTenant tenant = tenantService.getById(tenantId);
                if (ObjectUtil.isNotNull(tenant)) {
                    result.put("tenant", ListUtil.of(tenant));
                }
            }
        }
        return R.ok(result);
    }

    /**
     * 新增用户
     */
    @RequiresPermissions("system:user:add")
    @Log(title = "用户管理", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@Validated @RequestBody SysUser user) {
        deptService.checkDeptDataScope(user.getDeptId());
        roleService.checkRoleDataScope(user.getRoleIds());
        if (!userService.checkUserNameUnique(user)) {
            return error("新增用户'" + user.getUserName() + "'失败，登录账号已存在");
        } else if (StringUtils.isNotEmpty(user.getPhonenumber()) && !userService.checkPhoneUnique(user)) {
            return error("新增用户'" + user.getUserName() + "'失败，手机号码已存在");
        } else if (StringUtils.isNotEmpty(user.getEmail()) && !userService.checkEmailUnique(user)) {
            return error("新增用户'" + user.getUserName() + "'失败，邮箱账号已存在");
        }
        user.setCreateBy(SecurityUtils.getUsername());
        user.setPassword(SecurityUtils.encryptPassword(user.getPassword()));
        int i = userService.insertUser(user);
        return toAjax(i, user);
    }

    /**
     * 修改用户
     */
    @RequiresPermissions("system:user:edit")
    @Log(title = "用户管理", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@Validated @RequestBody SysUser user) {
        userService.checkUserAllowed(user);
        userService.checkUserDataScope(user.getUserId());
        deptService.checkDeptDataScope(user.getDeptId());
        roleService.checkRoleDataScope(user.getRoleIds());
        if (!userService.checkUserNameUnique(user)) {
            return error("修改用户'" + user.getUserName() + "'失败，登录账号已存在");
        } else if (StringUtils.isNotEmpty(user.getPhonenumber()) && !userService.checkPhoneUnique(user)) {
            return error("修改用户'" + user.getUserName() + "'失败，手机号码已存在");
        } else if (StringUtils.isNotEmpty(user.getEmail()) && !userService.checkEmailUnique(user)) {
            return error("修改用户'" + user.getUserName() + "'失败，邮箱账号已存在");
        }
        user.setUpdateBy(SecurityUtils.getUsername());
        return toAjax(userService.updateUser(user));
    }

    /**
     * 删除用户
     */
    @RequiresPermissions("system:user:remove")
    @Log(title = "用户管理", businessType = BusinessType.DELETE)
    @DeleteMapping("/{userIds}")
    public AjaxResult remove(@PathVariable Long[] userIds) {
        if (ArrayUtils.contains(userIds, SecurityUtils.getUserId())) {
            return error("当前用户不能删除");
        }
        List<SysUser> users = new ArrayList<>();
        for (Long userId : userIds) {
            users.add(userService.getById(userId));
        }
        int i = userService.deleteUserByIds(userIds);
        return toAjax(i, users);
    }

    /**
     * 重置密码
     */
    @RequiresPermissions("system:user:edit")
    @Log(title = "用户管理", businessType = BusinessType.UPDATE)
    @PutMapping("/resetPwd")
    public AjaxResult resetPwd(@RequestBody SysUser user) {
        userService.checkUserAllowed(user);
        userService.checkUserDataScope(user.getUserId());
        user.setPassword(SecurityUtils.encryptPassword(user.getPassword()));
        user.setUpdateBy(SecurityUtils.getUsername());
        int i = userService.resetPwd(user);
        SysUser sysUser = userService.getById(user.getUserId());
        return toAjax(i, sysUser);
    }

    /**
     * 状态修改
     */
    @RequiresPermissions("system:user:edit")
    @Log(title = "用户管理", businessType = BusinessType.UPDATE)
    @PutMapping("/changeStatus")
    public AjaxResult changeStatus(@RequestBody SysUser user) {
        userService.checkUserAllowed(user);
        userService.checkUserDataScope(user.getUserId());
        user.setUpdateBy(SecurityUtils.getUsername());
        int i = userService.updateUserStatus(user);
        SysUser sysUser = userService.getById(user.getUserId());
        sysUser.setAction(StrUtil.equals(user.getStatus(), UserConstants.USER_DISABLE) ? "禁用" : "启用");
        return toAjax(i, sysUser);
    }

    /**
     * 根据用户编号获取授权角色
     */
    @RequiresPermissions("system:user:query")
    @GetMapping("/authRole/{userId}")
    public AjaxResult authRole(@PathVariable("userId") Long userId) {
        AjaxResult ajax = AjaxResult.success();
        SysUser user = userService.selectUserById(userId);
        List<SysRole> roles = roleService.selectRolesByUserId(userId);
        ajax.put("user", user);
        ajax.put("roles", SecurityUtils.isAdmin(userId) ? roles : roles.stream().filter(r -> !r.isAdmin()).collect(Collectors.toList()));
        return ajax;
    }

    /**
     * 用户授权角色
     */
    @RequiresPermissions("system:user:edit")
    @Log(title = "用户管理", businessType = BusinessType.GRANT)
    @PutMapping("/authRole")
    public AjaxResult insertAuthRole(Long userId, Long[] roleIds) {
        userService.checkUserDataScope(userId);
        roleService.checkRoleDataScope(roleIds);
        userService.insertUserAuth(userId, roleIds);
        return success();
    }

    /**
     * 获取部门树列表
     */
    @RequiresPermissions("system:user:list")
    @GetMapping("/deptTree")
    public AjaxResult deptTree(SysDept dept) {
        return success(deptService.selectDeptTreeList(dept));
    }

    /**
     * 刷新用户登录信息
     */
    @PutMapping("/refreshLoginInfo")
    public R refreshLoginInfo(@RequestBody RefreshLoginInfoDTO dto) {
        userService.refreshLoginInfo(dto);
        return R.ok();
    }

    @Operation(description = "校验密码是否相同")
    @PostMapping("/checkPassword")
    public R<Boolean> checkPassword(@RequestBody SysUser user) {
        boolean checkedPassword = userService.checkPassword(user.getUserId(), user.getPassword());
        return R.ok(checkedPassword);
    }

    @Operation(description = "校验用户名是否已存在")
    @PostMapping("/checkUserName")
    public R<Boolean> checkUserName(@RequestBody SysUser user) {
        boolean equals = UserConstants.NOT_UNIQUE == userService.checkUserNameUnique(user);
        return R.ok(equals);
    }

    @Operation(description = "根据用户编号获取用户信息")
    @GetMapping("/selectByScgcUserId/")
    R<SysUser> selectByScgcUserId(@RequestParam("userId") Long userId) {
        return R.ok(userService.selectByScgcUserId(userId));
    }

    @Operation(description = "绑定用户")
    @GetMapping("/bindScgcUser/")
    R bindScgcUser(@RequestParam("userId") Long userId, @RequestParam(value = "otherUserId", required = false) Long otherUserId) {
        return userService.bindScgcUser(userId, otherUserId);
    }

    @GetMapping("/select")
    public R<List<SelectVO<String>>> getSelectList(String keyword) {
        return R.ok(userService.getSelectList(keyword));
    }

    /**
     * 获取部门树列表
     */
    @GetMapping("/userDeptTree")
    public R<List<TreeSelect>> userDeptTree(SysDept dept) {
        return R.ok(deptService.userDeptTree(dept));
    }
}
