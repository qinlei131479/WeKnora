package com.iptv.system.api;

import com.iptv.common.core.constant.SecurityConstants;
import com.iptv.common.core.constant.ServiceNameConstants;
import com.iptv.common.core.domain.R;
import com.iptv.system.api.domain.SysPost;
import com.iptv.system.api.factory.RemotePostFallbackFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

/**
 * 用户服务
 *
 * @author ruoyi
 */
@FeignClient(contextId = "remotePostService", value = ServiceNameConstants.SYSTEM_SERVICE, fallbackFactory = RemotePostFallbackFactory.class)
public interface RemotePostService {
    /**
     * 通过岗位ID查询岗位信息
     *
     * @param userId 岗位ID
     * @param source 请求来源
     * @return 结果
     */
    @GetMapping("/getByUserId")
    public R<SysPost> getPostInfoByUserId(@RequestParam("userId") Long userId, @RequestHeader(SecurityConstants.FROM_SOURCE) String source);
}
