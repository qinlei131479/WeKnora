package com.iptv.auth.service;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import com.iptv.common.core.enums.DelFlagEnum;
import com.iptv.common.core.enums.UserStatus;
import com.iptv.system.enums.LoginOperatorTypeEnum;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.iptv.common.core.constant.Constants;
import com.iptv.common.core.constant.SecurityConstants;
import com.iptv.common.core.constant.UserConstants;
import com.iptv.common.core.domain.R;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.DateUtils;
import com.iptv.common.core.utils.MessageUtils;
import com.iptv.common.core.utils.StringUtils;
import com.iptv.common.core.utils.ip.IpUtils;
import com.iptv.common.redis.service.RedisService;
import com.iptv.common.security.utils.SecurityUtils;
import com.iptv.system.api.RemoteTenantService;
import com.iptv.system.api.RemoteUserService;
import com.iptv.system.api.domain.SysUser;
import com.iptv.system.api.domain.vo.SysTenantVO;
import com.iptv.system.api.model.LoginUser;

import java.util.Date;

/**
 * 登录校验方法
 *
 * @author ruoyi
 */
@Component
public class SysLoginService
{
    @Autowired
    private RemoteUserService remoteUserService;

    @Autowired
    private RemoteTenantService remoteTenantService;

    @Autowired
    private SysPasswordService passwordService;

    @Autowired
    private SysRecordLogService recordLogService;

    @Autowired
    private RedisService redisService;

    /**
     * 登录
     */
    public LoginUser login(String username, String password)
    {
        LoginUser userInfo = checkUserInfo(username, password);
        recordLogService.recordLogininfor(username, Constants.LOGIN_SUCCESS, MessageUtils.message("login.success"), LoginOperatorTypeEnum.LOGIN.getCode(), userInfo.getSysUser().getUserId());
        return userInfo;
    }

    /**
     * 校验用户所属租户的状态和有效期
     */
    private void validateTenant(SysUser user)
    {
        if (ObjectUtil.isNull(user.getTenantId()))
        {
            throw new ServiceException("auth.tenant.not.linked");
        }

        R<SysTenantVO> tenantResult = remoteTenantService.queryById(user.getTenantId(), SecurityConstants.INNER);
        if (R.isSuccess(tenantResult))
        {
            SysTenantVO tenantVO = tenantResult.getData();
            if (ObjectUtil.isNull(tenantVO))
            {
                throw new ServiceException("auth.tenant.not.linked");
            }
            if (StrUtil.isNotBlank(tenantVO.getStatus()) && UserStatus.DISABLE.getCode().equals(tenantVO.getStatus()))
            {
                throw new ServiceException("auth.tenant.disabled", tenantVO.getName());
            }
            Date startTime = tenantVO.getAuditServiceValidityStart();
            Date endTime = tenantVO.getAuditServiceValidityEnd();
            Date now = new Date();
            if (!SysTenantVO.isPlatformTenant(tenantVO.getId())
                    && ObjectUtil.isNotNull(startTime)
                    && ObjectUtil.isNotNull(endTime)
                    && (now.before(startTime) || now.after(endTime)))
            {
                throw new ServiceException("auth.tenant.expired", tenantVO.getName());
            }
        }
    }

    /**
     * 记录登录信息
     *
     * @param userId 用户ID
     */
    public void recordLoginInfo(Long userId)
    {
        SysUser sysUser = new SysUser();
        sysUser.setUserId(userId);
        // 更新用户登录IP
        sysUser.setLoginIp(IpUtils.getIpAddr());
        // 更新用户登录时间
        sysUser.setLoginDate(DateUtils.getNowDate());
        remoteUserService.recordUserLogin(sysUser, SecurityConstants.INNER);
    }

    public void logout(String loginName)
    {
        R<?> userResult = remoteUserService.getUserInfo(loginName, SecurityConstants.INNER);
        Long userId = null;
        if (R.isSuccess(userResult)) {
            LoginUser userInfo = BeanUtil.toBean(userResult.getData(), LoginUser.class);
            userId = userInfo.getSysUser().getUserId();
        }

        recordLogService.recordLogininfor(loginName, Constants.LOGOUT, MessageUtils.message("login.logout"), LoginOperatorTypeEnum.LOGOUT.getCode(), userId);
    }

    /**
     * 注册
     */
    public void register(String username, String password)
    {
        // 用户名或密码为空 错误
        if (StringUtils.isAnyBlank(username, password))
        {
            throw new ServiceException("login.fail.credentials.required");
        }
        if (username.length() < UserConstants.USERNAME_MIN_LENGTH
                || username.length() > UserConstants.USERNAME_MAX_LENGTH)
        {
            throw new ServiceException("auth.register.username.length");
        }
        if (password.length() < UserConstants.PASSWORD_MIN_LENGTH
                || password.length() > UserConstants.PASSWORD_MAX_LENGTH)
        {
            throw new ServiceException("auth.register.password.length");
        }

        // 注册用户信息
        SysUser sysUser = new SysUser();
        sysUser.setUserName(username);
        sysUser.setNickName(username);
        sysUser.setPwdUpdateDate(DateUtils.getNowDate());
        sysUser.setPassword(SecurityUtils.encryptPassword(password));
        R<?> registerResult = remoteUserService.registerUserInfo(sysUser, SecurityConstants.INNER);

        if (R.FAIL == registerResult.getCode())
        {
            throw new ServiceException(registerResult.getMsg());
        }
        Long userId = null;
        if (R.SUCCESS == registerResult.getCode()) {
            LoginUser userInfo = BeanUtil.toBean(registerResult.getData(), LoginUser.class);
            userId = userInfo.getUserid();
        }
        recordLogService.recordLogininfor(username, Constants.REGISTER, MessageUtils.message("login.register"), LoginOperatorTypeEnum.REGISTER.getCode(), userId);
    }

    /**
     * 只检查用户信息是否允许登录
     *
     * @param username
     * @param password
     *
     * @return
     */
    public LoginUser checkUserInfo(String username, String password) {
        // 用户名或密码为空 错误
        if (StrUtil.isBlank(username) || StrUtil.isBlank(password)) {
            recordLogService.recordLogininfor(username, Constants.LOGIN_FAIL, MessageUtils.message("login.fail.credentials.required"), LoginOperatorTypeEnum.LOGIN.getCode(), null);
            throw new ServiceException("login.fail.credentials.required");
        }
        /*
         * // 密码如果不在指定范围内 错误 if (password.length() <
         * UserConstants.PASSWORD_MIN_LENGTH || password.length() >
         * UserConstants.PASSWORD_MAX_LENGTH) {
         * recordLogService.recordLogininfor(username, Constants.LOGIN_FAIL,
         * "用户密码不在指定范围"); throw new ServiceException("用户密码不在指定范围"); } //
         * 用户名不在指定范围内 错误 if (username.length() <
         * UserConstants.USERNAME_MIN_LENGTH || username.length() >
         * UserConstants.USERNAME_MAX_LENGTH) {
         * recordLogService.recordLogininfor(username, Constants.LOGIN_FAIL,
         * "用户名不在指定范围"); throw new ServiceException("用户名不在指定范围"); }
         */
        // 查询用户信息
        R<?> userResult = remoteUserService.getUserInfo(username, SecurityConstants.INNER);
        //
        // if (ObjectUtil.isNull(userResult) ) {
        // 	recordLogService.recordLogininfor(username, Constants.LOGIN_FAIL, "登录用户不存在", LoginOperatorTypeEnum.LOGIN.getCode(), null);
        // 	throw new ServiceException("登录用户：" + username + " 不存在");
        // }

        if (ObjectUtil.hasNull(userResult, userResult.getData()) || R.FAIL == userResult.getCode()) {
            throw new ServiceException(userResult.getMsg());
        }

        LoginUser userInfo = BeanUtil.toBean(userResult.getData(), LoginUser.class);
        SysUser user = userInfo.getSysUser();
        if (DelFlagEnum.DELETE.getCodeStr().equals(user.getDelFlag())) {
            recordLogService.recordLogininfor(username, Constants.LOGIN_FAIL, MessageUtils.message("login.fail.account.deleted"), LoginOperatorTypeEnum.LOGIN.getCode(), null);
//			throw new ServiceException("对不起，您的账号：" + username + " 已被删除");
//			和产品沟通, 删除用以下提示语
            throw new ServiceException("auth.login.bad.credentials.retry");
        }
        if (UserStatus.DISABLE.getCode().equals(user.getStatus())) {
            recordLogService.recordLogininfor(username, Constants.LOGIN_FAIL, MessageUtils.message("login.fail.account.disabled"), LoginOperatorTypeEnum.LOGIN.getCode(), null);
//			throw new ServiceException("对不起，您的账号：" + username + " 已停用");
            throw new ServiceException("auth.login.bad.credentials.retry");
        }
        passwordService.validate(user, password);// 验证密码
        // 验证租户
        validateTenant(user);
        return userInfo;
    }
}
