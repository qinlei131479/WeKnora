package com.iptv.system.api;

import com.iptv.common.core.constant.SecurityConstants;
import com.iptv.common.core.constant.ServiceNameConstants;
import com.iptv.common.core.domain.R;
import com.iptv.common.core.web.domain.vo.SelectVO;
import com.iptv.system.api.domain.vo.SysTenantVO;
import com.iptv.system.api.factory.RemoteTenantFallbackFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

/**
 * 租户远程服务
 */
@FeignClient(contextId = "remoteTenantService", value = ServiceNameConstants.SYSTEM_SERVICE, fallbackFactory = RemoteTenantFallbackFactory.class)
public interface RemoteTenantService {

    @GetMapping("/tenant/single")
    R<SysTenantVO> queryById(@RequestParam("id") Long id, @RequestHeader(SecurityConstants.FROM_SOURCE) String source);

    @GetMapping("/tenant/queryTenantList")
    R<List<SelectVO<Long>>> queryTenantList(@RequestParam("userId") Long userId, @RequestHeader(SecurityConstants.FROM_SOURCE) String source);
}
