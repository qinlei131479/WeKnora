package com.iptv.common.security.service;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.ArrayUtil;
import com.iptv.common.core.constant.CacheConstants;
import com.iptv.common.core.constant.Constants;
import com.iptv.common.core.constant.SecurityConstants;
import com.iptv.common.core.domain.vo.msg.UserWebSocketMsg;
import com.iptv.common.core.domain.vo.msg.WebSocketMsg;
import com.iptv.common.core.enums.WebSocketMsgEnum;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.JwtUtils;
import com.iptv.common.core.utils.MessageUtils;
import com.iptv.common.core.utils.ServletUtils;
import com.iptv.common.core.utils.StringUtils;
import com.iptv.common.core.utils.ip.IpUtils;
import com.iptv.common.core.utils.uuid.IdUtils;
import com.iptv.common.redis.service.RedisService;
import com.iptv.common.security.auth.AuthUtil;
import com.iptv.common.security.utils.SecurityUtils;
import com.iptv.system.api.RemoteLogService;
import com.iptv.system.api.RemoteUserService;
import com.iptv.system.api.domain.SysLogininfor;
import com.iptv.system.api.domain.dto.RefreshLoginInfoDTO;
import com.iptv.system.api.model.LoginUser;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * token验证处理
 *
 * @author ruoyi
 */
@Component
public class TokenService {
    private static final Logger log = LoggerFactory.getLogger(TokenService.class);

    @Autowired
    private RedisService redisService;

    @Lazy
    @Autowired
    private RemoteUserService remoteUserService;

    @Lazy
    @Autowired
    private RemoteLogService remoteLogService;

    protected static final long MILLIS_SECOND = 1000;

    protected static final long MILLIS_MINUTE = 60 * MILLIS_SECOND;

    private final static long TOKEN_EXPIRE_TIME = CacheConstants.EXPIRATION;

    private final static String ACCESS_TOKEN = CacheConstants.LOGIN_TOKEN_KEY;

    private final static Long TOKEN_REFRESH_THRESHOLD_MINUTES = CacheConstants.REFRESH_TIME * MILLIS_MINUTE;

    /**
     * 创建令牌
     */
    public Map<String, Object> createToken(LoginUser loginUser) {
        String token = IdUtils.fastUUID();
        Long userId = loginUser.getSysUser().getUserId();
        String userName = loginUser.getSysUser().getUserName();
        loginUser.setToken(token);
        loginUser.setUserid(userId);
        loginUser.setUsername(userName);
        loginUser.setIpaddr(IpUtils.getIpAddr());
        refreshToken(loginUser);

        // Jwt存储信息
        Map<String, Object> claimsMap = new HashMap<String, Object>();
        claimsMap.put(SecurityConstants.USER_KEY, token);
        claimsMap.put(SecurityConstants.DETAILS_USER_ID, userId);
        claimsMap.put(SecurityConstants.DETAILS_USERNAME, userName);

        // 接口返回信息
        Map<String, Object> rspMap = new HashMap<String, Object>();
        String accessToken = JwtUtils.createToken(claimsMap);
        rspMap.put("access_token", accessToken);
        rspMap.put("expires_in", TOKEN_EXPIRE_TIME);

        addUserToken(userId, accessToken);
        singleLogin(userId, accessToken);
        return rspMap;
    }

    /**
     * 获取用户身份信息
     *
     * @return 用户信息
     */
    public LoginUser getLoginUser() {
        return getLoginUser(ServletUtils.getRequest());
    }

    /**
     * 获取用户身份信息
     *
     * @return 用户信息
     */
    public LoginUser getLoginUser(HttpServletRequest request) {
        // 获取请求携带的令牌
        String token = SecurityUtils.getToken(request);
        return getLoginUser(token);
    }

    /**
     * 获取用户身份信息
     *
     * @return 用户信息
     */
    public LoginUser getLoginUser(String token) {
        LoginUser user = null;
        try {
            if (StringUtils.isNotEmpty(token)) {
                String userkey = JwtUtils.getUserKey(token);
                user = redisService.getCacheObject(getTokenKey(userkey));
                return user;
            }
        } catch (Exception e) {
            log.error("获取用户信息异常'{}'", e.getMessage());
        }
        return user;
    }

    /**
     * 设置用户身份信息
     */
    public void setLoginUser(LoginUser loginUser) {
        if (StringUtils.isNotNull(loginUser) && StringUtils.isNotEmpty(loginUser.getToken())) {
            refreshToken(loginUser);
        }
    }

    /**
     * 删除用户缓存信息
     */
    public void delLoginUser(String token) {
        if (StringUtils.isNotEmpty(token)) {
            String userkey = JwtUtils.getUserKey(token);
            redisService.deleteObject(getTokenKey(userkey));
        }
    }

    /**
     * 验证令牌有效期，相差不足120分钟，自动刷新缓存
     *
     * @param loginUser
     */
    public void verifyToken(LoginUser loginUser) {
        long expireTime = loginUser.getExpireTime();
        long currentTime = System.currentTimeMillis();
        if (expireTime - currentTime <= TOKEN_REFRESH_THRESHOLD_MINUTES) {
            refreshToken(loginUser);
        }
    }

    /**
     * 刷新令牌有效期
     *
     * @param loginUser 登录信息
     */
    public void refreshToken(LoginUser loginUser) {
        loginUser.setLoginTime(System.currentTimeMillis());
        loginUser.setExpireTime(loginUser.getLoginTime() + TOKEN_EXPIRE_TIME * MILLIS_MINUTE);
        // 根据uuid将loginUser缓存
        String userKey = getTokenKey(loginUser.getToken());
        redisService.setCacheObject(userKey, loginUser, TOKEN_EXPIRE_TIME, TimeUnit.MINUTES);
        // 刷新数据库中的登录IP和时间
        RefreshLoginInfoDTO refreshLoginInfoDTO = RefreshLoginInfoDTO.builder()
                .userId(loginUser.getUserid())
                .ipAddr(loginUser.getIpaddr())
                .date(new Date())
                .build();
        remoteUserService.refreshLoginInfo(refreshLoginInfoDTO, SecurityConstants.INNER);
    }

    /**
     * 获取当前用户的租户ID
     */
    public Long getUserTenantId() {
        LoginUser loginUser = getLoginUser();
        if (loginUser == null || loginUser.getSysUser() == null) {
            throw new ServiceException("security.user.info.failed");
        }
        return loginUser.getSysUser().getTenantId();
    }

    /**
     * 校验数据权限：当前用户的租户与目标租户是否一致
     *
     * @param tenantId 目标租户id
     */
    public void checkDataScope(Long tenantId) {
        LoginUser loginUser = getLoginUser();
        if (loginUser == null || loginUser.getSysUser() == null) {
            throw new ServiceException("security.user.info.failed");
        }
        if (loginUser.getSysUser().isTenantAdmin()) {
            return;
        }
        Long userTenantId = loginUser.getSysUser().getTenantId();
        if (userTenantId == null || !userTenantId.equals(tenantId)) {
            throw new ServiceException("security.data.scope.denied");
        }
    }

    private String getTokenKey(String token) {
        return ACCESS_TOKEN + token;
    }

    /**
     * 单账户登录，同一时段只能有一个用户登录
     *
     * @param userId          当前登录的用户端
     * @param lastAccessToken 最后一次登录的token；用于防止发送退出登录的消息出现延迟，导致只有一个设备登录时也提示退出登录
     */
    public void singleLogin(Long userId, String lastAccessToken) {
        // 强制退出登录
        Set<String> tokens = getAllUserTokens(userId);

        // 使其他设备退出登录，并记录退出日志
        tokens.removeIf(lastAccessToken::equals);

        if (tokens.isEmpty()) {
            return;
        }

        // 通知被踢设备下线
        UserWebSocketMsg msg = new UserWebSocketMsg(tokens, WebSocketMsg.createMsg(WebSocketMsgEnum.Msg.LOGOUT_OTHER_LOGIN.getCode(), WebSocketMsgEnum.Msg.LOGOUT_OTHER_LOGIN.toRes()));
        redisService.redisTemplate.convertAndSend(CacheConstants.TOPIC_USER_TOKEN_SOCKET_MSG, msg);

        // 这里移除用户token 并不会让token失效 在向用户发送消息后才会让其token失效
        removeUserToken(userId, tokens);
    }

    /**
     * 添加用户登录token
     *
     * @param userId    用户id
     * @param userToken 用户token
     */
    public void addUserToken(Long userId, Object... userToken) {
        String key = CacheConstants.LOGIN_TOKEN_USER_KEY + userId;
        redisService.redisTemplate.opsForSet().add(key, userToken);
    }

    /**
     * 移除用户登录token
     *
     * @param userId    用户id
     * @param userToken 用户token
     */
    public void removeUserToken(Long userId, Object... userToken) {
        String key = CacheConstants.LOGIN_TOKEN_USER_KEY + userId;
        redisService.redisTemplate.opsForSet().remove(key, userToken);
    }

    /**
     * 获取当前用户所有的登录token
     *
     * @param userId
     * @return
     */
    public Set<String> getAllUserTokens(Object userId) {
        String key = CacheConstants.LOGIN_TOKEN_USER_KEY + userId;
        return redisService.getCacheSet(key);
    }

    /**
     * 退出登录
     *
     * @param loginUser 登录用户信息
     * @param token     当前token
     */
    public void logout(LoginUser loginUser, String token) {
        if (loginUser != null) {
            // 删除用户登录信息
            AuthUtil.logoutByToken(token);
            // 删除用户缓存记录
            this.delLoginUser(token);
            // 移除token集合中的登录记录
            this.removeUserToken(loginUser.getSysUser().getUserId(), token);

            // 记录退出日志
            SysLogininfor logininfor = new SysLogininfor();
            logininfor.setUserName(loginUser.getUsername());
            logininfor.setIpaddr(IpUtils.getIpAddr());
            logininfor.setStatus(Constants.LOGIN_SUCCESS_STATUS);
            logininfor.setMsg(MessageUtils.message("login.logout"));
            remoteLogService.saveLogininfor(logininfor, SecurityConstants.INNER);
        }
    }

    /**
     * 退出登录
     *
     * @param token 当前token
     */
    public void logout(String token) {
        if (StringUtils.isNotEmpty(token)) {
            logout(getLoginUser(token), token);
        }
    }

    /**
     * 踢出用户（单个）
     *
     * @param userId 用户id
     * @param type   消息类型
     * @param msg    提示消息
     */
    public <T> void kickOutUser(Long userId, String type, T msg) {
        Set<String> allUserTokens = getAllUserTokens(userId);
        if (CollUtil.isEmpty(allUserTokens)) {
            return;
        }
        // 踢出通知
        UserWebSocketMsg socketMsg = new UserWebSocketMsg(allUserTokens, WebSocketMsg.createMsg(type, msg));
        redisService.redisTemplate.convertAndSend(CacheConstants.TOPIC_USER_TOKEN_SOCKET_MSG, socketMsg);
        log.info("已通知用户下线:{}", userId);
    }

    /**
     * 踢出用户（集合）
     *
     * @param userIds 用户id集合
     * @param type    消息类型
     * @param msg     提示消息
     */
    public <T> void kickOutUser(Collection<Long> userIds, String type, T msg) {
        if (CollUtil.isNotEmpty(userIds)) {
            userIds.forEach(userId -> kickOutUser(userId, type, msg));
        }
    }

    /**
     * 踢出用户（数组）
     *
     * @param userIds 用户id数组
     * @param type    消息类型
     * @param msg     提示消息
     */
    public <T> void kickOutUser(Long[] userIds, String type, T msg) {
        if (ArrayUtil.isNotEmpty(userIds)) {
            for (Long userId : userIds) {
                kickOutUser(userId, type, msg);
            }
        }
    }
}