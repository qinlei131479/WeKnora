package com.iptv.system.api.factory;

import com.iptv.common.core.domain.R;
import com.iptv.common.core.utils.MessageUtils;
import com.iptv.system.api.RemotePostService;
import com.iptv.system.api.domain.SysPost;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

/**
 * 用户服务降级处理
 *
 * @author ruoyi
 */
@Component
public class RemotePostFallbackFactory implements FallbackFactory<RemotePostService> {
    private static final Logger log = LoggerFactory.getLogger(RemotePostFallbackFactory.class);

    @Override
    public RemotePostService create(Throwable throwable) {
        log.error("用户服务调用失败:{}", throwable.getMessage());
        return new RemotePostService() {
            @Override
            public R<SysPost> getPostInfoByUserId(Long userId, String source) {
                return R.fail(MessageUtils.message("system.remote.post.get.failed", throwable.getMessage()));
            }
        };
    }
}
