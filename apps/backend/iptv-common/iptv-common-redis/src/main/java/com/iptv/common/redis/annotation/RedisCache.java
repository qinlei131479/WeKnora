package com.iptv.common.redis.annotation;

import java.lang.annotation.*;

/**
 * Redis缓存注解。
 * <p>
 * 该注解用于统一处理方法级缓存逻辑，业务层只需要声明缓存前缀和参数SpEL表达式，
 * 即可自动完成查缓存、回填缓存、空值缓存以及删缓存等操作。
 * <p>
 * 设计约束：
 * <p>
 * 1. Redis key 固定由两部分组成：前缀常量 + 动态参数部分。
 * <p>
 * 2. 前缀通过 {@link #prefix()} 单独传入，建议直接引用缓存常量。
 * <p>
 * 3. 动态参数部分通过 {@link #key()} 编写SpEL表达式。
 * <p>
 * 4. 删除缓存时只允许删除单个key，不支持通配批量删除。
 * <p>
 * 5. 过期时间统一按“秒”配置，避免再单独传时间单位。
 * <p>
 * 示例：
 * <p>
 * {@code @RedisCache(prefix = CacheConstants.SYS_DICT_KEY, key = "#dictType")}
 * <p>
 * 上述配置最终得到的key类似：
 * <p>
 * {@code INDUCTION_TRAINING_CLOUD_CACHE:sys_dict:news_type}
 *
 * @author ruoyi
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RedisCache {
    /**
     * 缓存名称 默认为类名+方法名
     */
    String name() default "";

    /**
     * 缓存key
     *
     */
    String key() default "";

    /**
     * 是否为删除缓存操作。
     * <p>
     * false：先查缓存，未命中再执行业务并写入缓存。
     * <p>
     * true：仅删除缓存，通常用于新增、修改、删除操作。
     */
    boolean evict() default false;

    /**
     * 正常缓存过期时间，单位：秒。
     * <p>
     * 仅在查询缓存且返回值非null时生效。
     * <p>
     * 默认1800秒，即30分钟。
     */
    long ttl() default 1800L;

    /**
     * 是否缓存空值。
     * <p>
     * 开启后，当方法返回null时会写入一个空值占位对象，用于防止缓存穿透。
     */
    boolean cacheEmpty() default true;

    /**
     * 空值缓存过期时间，单位：秒。
     * <p>
     * 仅在 {@link #cacheEmpty()} 为true且方法返回null时生效。
     * <p>
     * 默认10秒。
     */
    long emptyTtl() default 10L;

    /**
     * 是否在方法执行前删除缓存。
     * <p>
     * 仅在 {@link #evict()} 为true时生效。
     * <p>
     * 默认为false，即方法执行成功后再删除缓存。
     */
    boolean beforeInvocation() default false;
}
