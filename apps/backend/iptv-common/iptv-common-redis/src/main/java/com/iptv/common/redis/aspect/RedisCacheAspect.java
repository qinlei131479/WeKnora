package com.iptv.common.redis.aspect;

import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import com.iptv.common.redis.annotation.RedisCache;
import com.iptv.common.redis.service.RedisService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.Ordered;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * Redis缓存切面
 */
@Aspect
@Component
public class RedisCacheAspect implements Ordered {
    private static final Logger log = LoggerFactory.getLogger(RedisCacheAspect.class);
    @Autowired
    private RedisService redisService;

    private static final ExpressionParser parser = new SpelExpressionParser();

    /**
     * Redis缓存统一入口。
     * <p>
     * 根据注解上配置的模式，分发到“查询缓存”或“删除缓存”逻辑。
     *
     * @param joinPoint  当前切点
     * @param redisCache 注解配置
     * @return 方法返回值或缓存值
     * @throws Throwable 目标方法执行异常
     */
    @Around("@annotation(redisCache)")
    public Object around(ProceedingJoinPoint joinPoint, RedisCache redisCache) throws Throwable {
        String cacheKey = getCacheKey(joinPoint, redisCache);
        log.info("redisCacheKey is {}", cacheKey);
        // 仅删除缓存
        if (redisCache.evict()) {
            redisService.deleteObject(cacheKey);
            log.info("delete redisCacheKey is {}", cacheKey);
            Object result = joinPoint.proceed();
            return result;
        }
        if (redisService.hasKey(cacheKey)) {
            return redisService.getCacheObject(cacheKey);
        }
        Object result = joinPoint.proceed();
        if (ObjectUtil.isEmpty(result) && redisCache.cacheEmpty()) {
            redisService.setCacheObject(cacheKey, result, redisCache.emptyTtl(), TimeUnit.SECONDS);
        } else {
            redisService.setCacheObject(cacheKey, result, redisCache.ttl(), TimeUnit.SECONDS);
        }
        return result;
    }

    /**
     * 获取当前方法对应的缓存key
     *
     * @param joinPoint
     * @param redisCache
     * @return
     */
    private String getCacheKey(ProceedingJoinPoint joinPoint, RedisCache redisCache) {
        String name = StrUtil.trim(redisCache.name());
        String cacheKey = "";
        if (StrUtil.isBlank(name)) {
            String className = joinPoint.getTarget().getClass().getSimpleName();
            String methodName = joinPoint.getSignature().getName();
            name = className + ":" + methodName + ":";
        }
        String dynamicKey = null;
        try {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            String[] paramNames = signature.getParameterNames();
            Object[] args = joinPoint.getArgs();

            EvaluationContext context = new StandardEvaluationContext();
            for (int i = 0; i < paramNames.length; i++) {
                context.setVariable(paramNames[i], args[i]);
            }
            dynamicKey = parser.parseExpression(redisCache.key()).getValue(context, String.class);
        } catch (Exception e) {

        }
        cacheKey = StrUtil.isBlank(dynamicKey) ? name : name + (name.endsWith(":") ? "" : ":") + dynamicKey;
        return cacheKey;
    }

    /**
     * 让缓存切面尽量在事务切面外层执行，便于读取缓存。
     */
    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE - 1;
    }
}
