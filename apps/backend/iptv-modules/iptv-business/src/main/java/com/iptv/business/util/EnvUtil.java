package com.iptv.business.util;

import io.github.cdimascio.dotenv.Dotenv;
import java.util.Map;

/**
 * .env 环境变量读取工具类
 * 支持懒加载缓存，启动时解析一次，后续从内存中读取
 */
public class EnvUtil {

    /** 懒加载缓存，保证线程安全 */
    private static volatile Dotenv dotenvInstance = null;

    /**
     * 获取指定 key 的值
     * @param key 配置键
     * @return 对应的值，不存在则返回 null
     */
    public static String get(String key) {
        return getDotenv().get(key);
    }

    /**
     * 获取指定 key 的值，带默认值
     * @param key          配置键
     * @param defaultValue 默认值
     * @return 对应的值，不存在则返回 defaultValue
     */
    public static String get(String key, String defaultValue) {
        return getDotenv().get(key, defaultValue);
    }

    /**
     * 获取指定 key 的值并转换为 Integer
     */
    public static Integer getInt(String key, Integer defaultValue) {
        String value = get(key);
        if (value == null || value.isEmpty()) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    /**
     * 获取指定 key 的值并转换为 Boolean
     */
    public static Boolean getBoolean(String key, Boolean defaultValue) {
        String value = get(key);
        if (value == null || value.isEmpty()) {
            return defaultValue;
        }
        return Boolean.parseBoolean(value.trim());
    }

    // -------------------- 内部实现 --------------------

    /**
     * 双重检查锁获取 Dotenv 实例
     */
    private static Dotenv getDotenv() {
        if (dotenvInstance == null) {
            synchronized (EnvUtil.class) {
                if (dotenvInstance == null) {
                    dotenvInstance = Dotenv.configure()
                            .ignoreIfMissing() // 文件不存在时不报错，兼容多环境
                            .load();
                }
            }
        }
        return dotenvInstance;
    }
}
