package com.iptv.common.log.service;

import com.iptv.business.api.RemoteBusinessService;
import com.iptv.common.core.constant.SecurityConstants;
import com.iptv.system.api.RemoteLogService;
import com.iptv.system.api.domain.SysOperLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * 异步调用日志服务
 *
 * @author ruoyi
 */
@Service
public class AsyncLogService {
    @Autowired
    private RemoteLogService remoteLogService;

    @Autowired
    private RemoteBusinessService remoteBusinessLogService;


    /**
     * 保存系统日志记录
     */
    @Async
    public void saveSysLog(SysOperLog sysOperLog) throws Exception {
        remoteLogService.saveLog(sysOperLog, SecurityConstants.INNER);
    }
}
