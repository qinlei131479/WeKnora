package com.iptv.system.api.factory;

import com.iptv.common.core.domain.R;
import com.iptv.common.core.web.domain.vo.SelectVO;
import com.iptv.system.api.RemoteTenantService;
import com.iptv.system.api.domain.vo.SysTenantVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 租户服务降级处理
 */
@Component
public class RemoteTenantFallbackFactory implements FallbackFactory<RemoteTenantService> {

    private static final Logger log = LoggerFactory.getLogger(RemoteTenantFallbackFactory.class);

    @Override
    public RemoteTenantService create(Throwable throwable) {
        log.error("租户服务调用失败:{}", throwable.getMessage());
        return new RemoteTenantService() {
            @Override
            public R<SysTenantVO> queryById(Long id, String source) {
                return R.fail("获取租户失败:" + throwable.getMessage());
            }

            @Override
            public R<List<SelectVO<Long>>> queryTenantList(Long userId, String source) {
                return R.fail("获取租户列表失败:" + throwable.getMessage());
            }
        };
    }
}
