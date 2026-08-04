package com.iptv.business.api.factory;

import com.iptv.business.api.RemoteBusinessService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

/**
 * 部门服务降级处理
 *
 * @author ruoyi
 */
@Component
public class RemoteBusinessFallbackFactory implements FallbackFactory<RemoteBusinessService> {
    private static final Logger log = LoggerFactory.getLogger(RemoteBusinessFallbackFactory.class);

    @Override
    public RemoteBusinessService create(Throwable throwable) {
        log.error("部门服务调用失败:{}", throwable.getMessage());
        return new RemoteBusinessService() {

        };
    }
}
