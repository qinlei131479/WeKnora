package com.iptv.common.redis.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Redis分布式锁注解。
 * <p>
 * 该注解主要用于控制多节点部署场景下的方法并发执行，
 * 尤其适合定时任务、补偿任务、批处理任务等“同一时刻只能执行一次”的业务。
 * <p>
 * 锁key默认由“类名 + 方法名”组成，
 * 例如：{@code REDIS_LOCK:com.iptv.job.task.DemoTask:execute}
 * <p>
 * 当某个节点已成功获取锁后，其他节点再次进入同一方法时将直接跳过执行。
 *
 * @author ruoyi
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RedisLock
{
    /**
     * 锁过期时间，单位：秒。
     * <p>
     * 为了避免节点异常退出后锁无法释放，建议始终配置合理的过期时间。
     */
    long expireSeconds() default 300L;

    /**
     * 是否在方法执行完成后主动释放锁。
     * <p>
     * true：方法结束后主动释放锁。
     * <p>
     * false：不主动释放，等待锁自然过期。
     */
    boolean releaseLock() default true;
}
