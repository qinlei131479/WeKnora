package com.iptv.business.api;

import com.iptv.business.api.factory.RemoteBusinessFallbackFactory;
import com.iptv.common.core.constant.ServiceNameConstants;
import org.springframework.cloud.openfeign.FeignClient;

/**
 * 部门
 *
 * @author qinlei
 */
@FeignClient(contextId = "remoteBusinessService", value = ServiceNameConstants.BUSINESS_SERVICE, fallbackFactory = RemoteBusinessFallbackFactory.class)
public interface RemoteBusinessService {

}
