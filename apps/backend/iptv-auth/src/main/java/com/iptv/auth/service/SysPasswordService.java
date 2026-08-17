package com.iptv.auth.service;

import java.util.concurrent.TimeUnit;

import com.iptv.system.enums.LoginOperatorTypeEnum;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.iptv.common.core.constant.CacheConstants;
import com.iptv.common.core.constant.Constants;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.MessageUtils;
import com.iptv.common.redis.service.RedisService;
import com.iptv.common.security.utils.SecurityUtils;
import com.iptv.system.api.domain.SysUser;

/**
 * 登录密码方法
 *
 * @author ruoyi
 */
@Component
public class SysPasswordService
{
    @Autowired
    private RedisService redisService;

    private int maxRetryCount = CacheConstants.PASSWORD_MAX_RETRY_COUNT;

    private Long lockTime = CacheConstants.PASSWORD_LOCK_TIME;

    @Autowired
    private SysRecordLogService recordLogService;

    /**
     * 登录账户密码错误次数缓存键名
     *
     * @param username 用户名
     * @return 缓存键key
     */
    private String getCacheKey(String username)
    {
        return CacheConstants.PWD_ERR_CNT_KEY + username;
    }

    public void validate(SysUser user, String password)
    {
        String username = user.getUserName();

        Integer retryCount = redisService.getCacheObject(getCacheKey(username));

        if (retryCount == null)
        {
            retryCount = 0;
        }

        if (retryCount >= Integer.valueOf(maxRetryCount).intValue())
        {
            String errMsg = MessageUtils.message("login.fail.password.lock", maxRetryCount, lockTime);
            recordLogService.recordLogininfor(username, Constants.LOGIN_FAIL, errMsg, LoginOperatorTypeEnum.LOGIN.getCode(), user.getUserId());
            throw new ServiceException("login.fail.password.lock", maxRetryCount, lockTime);
        }

        if (!matches(user, password))
        {
            retryCount = retryCount + 1;
            recordLogService.recordLogininfor(username, Constants.LOGIN_FAIL, MessageUtils.message("login.fail.password.retry", retryCount), LoginOperatorTypeEnum.LOGIN.getCode(), user.getUserId());
            redisService.setCacheObject(getCacheKey(username), retryCount, lockTime, TimeUnit.MINUTES);
            throw new ServiceException("auth.login.bad.credentials");
        }
        else
        {
            clearLoginRecordCache(username);
        }
    }

    public boolean matches(SysUser user, String rawPassword)
    {

        boolean equals = rawPassword.equals(user.getPassword());
        return equals || SecurityUtils.matchesPassword(rawPassword, user.getPassword());
    }

    public void clearLoginRecordCache(String loginName)
    {
        if (redisService.hasKey(getCacheKey(loginName)))
        {
            redisService.deleteObject(getCacheKey(loginName));
        }
    }
}
