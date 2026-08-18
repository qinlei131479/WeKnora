package com.iptv.system.api.factory;

import com.iptv.common.core.domain.R;
import com.iptv.common.core.utils.MessageUtils;
import com.iptv.system.api.RemoteUserService;
import com.iptv.system.api.domain.SysUser;
import com.iptv.system.api.domain.dto.RefreshLoginInfoDTO;
import com.iptv.system.api.model.LoginUser;
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
public class RemoteUserFallbackFactory implements FallbackFactory<RemoteUserService> {
    private static final Logger log = LoggerFactory.getLogger(RemoteUserFallbackFactory.class);

    @Override
    public RemoteUserService create(Throwable throwable) {
        log.error("用户服务调用失败:{}", throwable.getMessage());
        return new RemoteUserService() {
            @Override
            public R<LoginUser> getUserInfo(String username, String source) {
                return R.fail(MessageUtils.message("system.remote.user.get.failed", throwable.getMessage()));
            }

            @Override
            public R<Boolean> registerUserInfo(SysUser sysUser, String source) {
                return R.fail(MessageUtils.message("system.remote.user.register.failed", throwable.getMessage()));
            }

            @Override
            public R<Boolean> recordUserLogin(SysUser sysUser, String source) {
                return R.fail(MessageUtils.message("system.remote.user.login.record.failed", throwable.getMessage()));
            }

            @Override
            public R refreshLoginInfo(RefreshLoginInfoDTO dto, String source) {
                return R.fail(MessageUtils.message("system.remote.user.login.refresh.failed", throwable.getMessage()));
            }

            @Override
            public R<SysUser> selectByScgcUserId(Long userId, String source) {
                return R.fail(MessageUtils.message("system.remote.user.info.failed", throwable.getMessage()));
            }

            @Override
            public R bindScgcUser(Long userId, Long otherUserId, String source) {
                return R.fail(MessageUtils.message("system.remote.user.operation.failed", throwable.getMessage()));
            }
        };
    }
}
