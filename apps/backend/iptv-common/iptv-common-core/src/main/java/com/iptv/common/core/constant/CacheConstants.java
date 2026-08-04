package com.iptv.common.core.constant;

/**
 * 缓存常量信息
 * 
 * @author ruoyi
 */
public class CacheConstants
{
    public final static String CACHE_PREFIX = "agent-middle-platform:";
    /**
     * 缓存有效期，默认720（分钟）
     */
    public final static long EXPIRATION = 720;

    /**
     * 缓存刷新时间，默认120（分钟）
     */
    public final static long REFRESH_TIME = 120;

    /**
     * 密码最大错误次数
     */
    public final static int PASSWORD_MAX_RETRY_COUNT = 5;

    /**
     * 密码锁定时间，默认10（分钟）
     */
    public final static long PASSWORD_LOCK_TIME = 10;

    /**
     * 权限缓存前缀
     */
    public final static String LOGIN_TOKEN_KEY = CACHE_PREFIX + "login_tokens:";

    /**
     * 验证码 redis key
     */
    public static final String CAPTCHA_CODE_KEY =  CACHE_PREFIX + "captcha_codes:";

    /**
     * 参数管理 cache key
     */
    public static final String SYS_CONFIG_KEY = CACHE_PREFIX + "sys_config:";

    /**
     * 字典管理 cache key
     */
    public static final String SYS_DICT_KEY = CACHE_PREFIX + "sys_dict:";

    /**
     * 登录账户密码错误次数 redis key
     */
    public static final String PWD_ERR_CNT_KEY = CACHE_PREFIX + "pwd_err_cnt:";

    /**
     * 登录IP黑名单 cache key
     */
    public static final String SYS_LOGIN_BLACKIPLIST = CACHE_PREFIX + SYS_CONFIG_KEY + "sys.login.blackIPList";

    /**
     * 用户所有的token 前缀
     */
    public final static String LOGIN_TOKEN_USER_KEY = CACHE_PREFIX + "login_tokens_user_";

    /**
     * 用户token消息
     */
    public static final String TOPIC_USER_TOKEN_SOCKET_MSG = CACHE_PREFIX + "topic_user_token_socket_msg";
    /**
     * 数据调用趋势导出 消息
     */
    public static final String TOPIC_REQUEST_TREND_EXPORT_MSG = CACHE_PREFIX + "topic_request_trend_export_msg";

    /**
     * 验证码 redis key
     * <p>用于做验证</p>
     */
    public static final String CAPTCHA_CODE_VALID_KEY = CACHE_PREFIX + "captcha_code_valid_key:";

}
