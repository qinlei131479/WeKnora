package com.iptv.common.redis.aspect;

import cn.hutool.core.util.IdUtil;
import com.iptv.common.redis.annotation.RedisLock;
import com.iptv.common.redis.service.RedisService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.concurrent.TimeUnit;

/**
 * Redis分布式锁切面。
 * <p>
 * 该切面会在目标方法执行前尝试获取Redis锁，
 * 如果锁已被其他节点持有，则当前节点直接跳过执行。
 * <p>
 * 典型使用场景：
 * <p>
 * 1. 多节点定时任务防重执行
 * <p>
 * 2. 批处理任务串行执行
 * <p>
 * 3. 需要跨节点互斥的业务方法
 *
 * @author ruoyi
 */
@Aspect
@Component
public class RedisLockAspect implements Ordered {
    private static final Logger log = LoggerFactory.getLogger(RedisLockAspect.class);

    /**
     * 分布式锁统一前缀，避免与普通业务缓存key混用。
     */
    private static final String LOCK_PREFIX = "REDIS_LOCK:";

    @Autowired
    private RedisService redisService;

    /**
     * 分布式锁统一入口。
     * <p>
     * 锁key由“锁前缀 + 类全名 + 方法名”组成，确保同一个方法在多节点场景下只会有一个节点执行。
     *
     * @param joinPoint 当前切点
     * @param redisLock 分布式锁注解
     * @return 方法返回值；未获取到锁时直接返回null
     * @throws Throwable 目标方法执行异常
     */
    @Around("@annotation(redisLock)")
    public Object around(ProceedingJoinPoint joinPoint, RedisLock redisLock) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        String className = joinPoint.getTarget().getClass().getName();
        String lockKey = LOCK_PREFIX + className + ":" + method.getName();

        log.info("redisLockKey is {}", lockKey);
        // 每次加锁都使用唯一值，释放锁时会校验锁值，避免误删其他节点的锁。
        String lockValue = IdUtil.simpleUUID();
        Boolean locked = redisService.setIfAbsent(lockKey, lockValue, redisLock.expireSeconds(), TimeUnit.SECONDS);
        if (!Boolean.TRUE.equals(locked)) {
            log.info("未获取到Redis分布式锁，跳过执行。lockKey is {}", lockKey);
            return null;
        }

        try {
            return joinPoint.proceed();
        } finally {
            // 是否主动释放锁由注解控制，关闭后依赖Redis过期时间自动释放。
            if (redisLock.releaseLock()) {
                boolean released = redisService.deleteLock(lockKey, lockValue);
                if (!released) {
                    log.warn("Redis分布式锁释放失败或锁已失效。lockKey is {}", lockKey);
                }
            }
        }
    }

    /**
     * 让分布式锁切面尽量优先执行，尽早拦截无效调用。
     */
    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}
