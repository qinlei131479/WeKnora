package com.iptv.system.api.factory;

import com.iptv.common.core.domain.R;
import com.iptv.common.core.utils.MessageUtils;
import com.iptv.system.api.RemoteLogService;
import com.iptv.system.api.domain.SysLogininfor;
import com.iptv.system.api.domain.SysOperLog;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

/**
 * 日志服务降级处理
 * 
 * @author ruoyi
 */
@Component
public class RemoteLogFallbackFactory implements FallbackFactory<RemoteLogService>
{
    private static final Logger log = LoggerFactory.getLogger(RemoteLogFallbackFactory.class);

    @Override
    public RemoteLogService create(Throwable throwable)
    {
        log.error("日志服务调用失败:{}", throwable.getMessage());
        return new RemoteLogService()
        {
            @Override
            public R<Boolean> saveLog(SysOperLog sysOperLog, String source)
            {
                return R.fail(MessageUtils.message("system.remote.log.operation.save.failed",
                        throwable.getMessage()));
            }

            @Override
            public R<Boolean> saveLogininfor(SysLogininfor sysLogininfor, String source)
            {
                return R.fail(MessageUtils.message("system.remote.log.login.save.failed",
                        throwable.getMessage()));
            }
        };

    }
}
