package com.iptv.system.api;

import com.iptv.common.core.constant.SecurityConstants;
import com.iptv.common.core.constant.ServiceNameConstants;
import com.iptv.common.core.domain.R;
import com.iptv.system.api.domain.SysUser;
import com.iptv.system.api.domain.dto.RefreshLoginInfoDTO;
import com.iptv.system.api.factory.RemoteUserFallbackFactory;
import com.iptv.system.api.model.LoginUser;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

/**
 * 用户服务
 *
 * @author ruoyi
 */
@FeignClient(contextId = "remoteUserService", value = ServiceNameConstants.SYSTEM_SERVICE, fallbackFactory = RemoteUserFallbackFactory.class)
public interface RemoteUserService {
    /**
     * 通过用户名查询用户信息
     *
     * @param username 用户名
     * @param source   请求来源
     * @return 结果
     */
    @GetMapping("/user/info/{username}")
    public R<LoginUser> getUserInfo(@PathVariable("username") String username, @RequestHeader(SecurityConstants.FROM_SOURCE) String source);

    /**
     * 注册用户信息
     *
     * @param sysUser 用户信息
     * @param source  请求来源
     * @return 结果
     */
    @PostMapping("/user/register")
    public R<Boolean> registerUserInfo(@RequestBody SysUser sysUser, @RequestHeader(SecurityConstants.FROM_SOURCE) String source);

    /**
     * 记录用户登录IP地址和登录时间
     *
     * @param sysUser 用户信息
     * @param source  请求来源
     * @return 结果
     */
    @PutMapping("/user/recordlogin")
    public R<Boolean> recordUserLogin(@RequestBody SysUser sysUser, @RequestHeader(SecurityConstants.FROM_SOURCE) String source);

    /**
     * 刷新用户登录信息
     */
    @PutMapping("/user/refreshLoginInfo")
    public R refreshLoginInfo(@RequestBody RefreshLoginInfoDTO dto,
                              @RequestHeader(SecurityConstants.FROM_SOURCE) String source);

    @GetMapping("/user/selectByScgcUserId/")
    R<SysUser> selectByScgcUserId(@RequestParam("userId") Long userId,
                                  @RequestHeader(SecurityConstants.FROM_SOURCE) String source);

    @GetMapping("/user/bindScgcUser/")
    R bindScgcUser(@RequestParam("userId") Long userId,
                   @RequestParam(value = "otherUserId", required = false) Long otherUserId,
                   @RequestHeader(SecurityConstants.FROM_SOURCE) String source);
}
