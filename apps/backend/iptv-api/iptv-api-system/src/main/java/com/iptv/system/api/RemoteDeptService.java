package com.iptv.system.api;

import com.iptv.common.core.constant.ServiceNameConstants;
import com.iptv.common.core.domain.R;
import com.iptv.system.api.domain.SysDept;
import com.iptv.system.api.factory.RemoteDeptFallbackFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/**
 * 部门
 *
 * @author qinlei
 */
@FeignClient(contextId = "remoteDeptService", value = ServiceNameConstants.SYSTEM_SERVICE, fallbackFactory = RemoteDeptFallbackFactory.class)
public interface RemoteDeptService {

    @GetMapping("/dept/list")
    R<List<SysDept>> list(SysDept queryDTO);

    @GetMapping("/dept/list/exclude/{deptId}")
    R<List<SysDept>> excludeChild(@PathVariable(value = "deptId", required = false) Long deptId);

}
