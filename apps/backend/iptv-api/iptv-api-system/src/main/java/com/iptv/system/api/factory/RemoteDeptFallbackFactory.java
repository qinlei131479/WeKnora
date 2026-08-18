package com.iptv.system.api.factory;

import com.iptv.common.core.domain.R;
import com.iptv.common.core.utils.MessageUtils;
import com.iptv.system.api.RemoteDeptService;
import com.iptv.system.api.domain.SysDept;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 部门服务降级处理
 *
 * @author ruoyi
 */
@Component
public class RemoteDeptFallbackFactory implements FallbackFactory<RemoteDeptService> {
    private static final Logger log = LoggerFactory.getLogger(RemoteDeptFallbackFactory.class);

    @Override
    public RemoteDeptService create(Throwable throwable) {
        log.error("部门服务调用失败:{}", throwable.getMessage());
        return new RemoteDeptService() {

            @Override
            public R<List<SysDept>> list(SysDept queryDTO) {
                return R.fail(MessageUtils.message("system.remote.dept.get.failed", throwable.getMessage()));
            }

            @Override
            public R<List<SysDept>> excludeChild(Long deptId) {
                return R.fail(MessageUtils.message("system.remote.dept.exclude.failed", throwable.getMessage()));
            }
        };
    }
}
