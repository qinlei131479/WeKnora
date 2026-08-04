package com.iptv.auth.controller;

import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import com.iptv.auth.form.QrBody;
import com.iptv.auth.service.ScgcService;
import com.iptv.common.core.constant.CacheConstants;
import com.iptv.common.core.exception.CaptchaException;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.redis.service.RedisService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import com.iptv.auth.form.LoginBody;
import com.iptv.auth.form.RegisterBody;
import com.iptv.auth.service.SysLoginService;
import com.iptv.common.core.domain.R;
import com.iptv.common.core.utils.JwtUtils;
import com.iptv.common.core.utils.StringUtils;
import com.iptv.common.security.auth.AuthUtil;
import com.iptv.common.security.service.TokenService;
import com.iptv.common.security.utils.SecurityUtils;
import com.iptv.system.api.model.LoginUser;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Set;

/**
 * token 控制
 * 
 * @author ruoyi
 */
@RestController
public class TokenController
{
    @Autowired
    private TokenService tokenService;

    @Autowired
    private SysLoginService sysLoginService;


    @Autowired
    private ScgcService scgcService;

    @Autowired
    private RedisService redisService;

    @PostMapping("login")
    public R<?> login(@RequestBody LoginBody form)
    {
        checkCaptcha(form.getCode(), form.getUuid());
        // 用户登录
        LoginUser userInfo = sysLoginService.login(form.getUsername(), form.getPassword());
        // 获取登录token
        return R.ok(tokenService.createToken(userInfo));
    }

    @DeleteMapping("logout")
    public R<?> logout(HttpServletRequest request)
    {
        String token = SecurityUtils.getToken(request);
        if (StringUtils.isNotEmpty(token))
        {
            String username = JwtUtils.getUserName(token);
            // 删除用户缓存记录
            AuthUtil.logoutByToken(token);
            // 记录用户退出日志
            sysLoginService.logout(username);
        }
        return R.ok();
    }

    @PostMapping("refresh")
    public R<?> refresh(HttpServletRequest request)
    {
        LoginUser loginUser = tokenService.getLoginUser(request);
        if (StringUtils.isNotNull(loginUser))
        {
            // 刷新令牌有效期
            tokenService.refreshToken(loginUser);
            return R.ok();
        }
        return R.ok();
    }

    @PostMapping("register")
    public R<?> register(@RequestBody RegisterBody registerBody)
    {
        checkCaptcha(registerBody.getCode(), registerBody.getUuid());
        // 用户注册
        sysLoginService.register(registerBody.getUsername(), registerBody.getPassword());
        return R.ok();
    }

    @CrossOrigin(origins = "*")
    @GetMapping("/qrCode/get")
    public R<QrBody> getLoginQrCode() {
        return R.ok(scgcService.getLoginQrCode());
    }


    @CrossOrigin(origins = "*")
    @GetMapping(value = "/qrCode/getStatus", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter getQrCodeStatus(String qrCodeKey, @RequestParam(defaultValue = "login") String type) {
        return scgcService.getQrCodeStatusBySse(qrCodeKey, type);
    }

    @GetMapping("/qrCode/getBindStatus")
    public R<Boolean> getBindStatus() {
        return scgcService.getBindStatus();
    }

    @GetMapping("/qrCode/bind")
    public R bindQrCode(Long otherUserId) {
        return scgcService.bindQrCode(otherUserId);
    }

    @GetMapping("/qrCode/unbind")
    public R unbindQrCode() {
        return scgcService.unbindQrCode();
    }

    @Operation(description = "登录：判断是否已在别处登录")
    @PostMapping("/checkLogin")
    public R<Boolean> loginCheck(@RequestBody LoginBody form) {
        try {
            checkCaptcha(CacheConstants.CAPTCHA_CODE_VALID_KEY, form.getCode(), form.getUuid());
            // 用户登录验证
            LoginUser userInfo = sysLoginService.checkUserInfo(form.getUsername(), form.getPassword());
            // 获取登录token 判断是否存在未过期的token 如果有就代表已在别处登录
            Set<String> userTokens = tokenService.getAllUserTokens(userInfo.getSysUser().getUserId());
            boolean hasOtherLogin = userTokens.stream().anyMatch(t -> ObjectUtil.isNotNull(tokenService.getLoginUser(t)));
            return R.ok(hasOtherLogin);
        } catch (Exception e) {
            String verifyKey = CacheConstants.CAPTCHA_CODE_KEY + form.getUuid();
            redisService.deleteObject(verifyKey);
            throw new ServiceException(e.getMessage());
        }
    }
    public void checkCaptcha(String code, String uuid) throws CaptchaException {
        checkCaptcha(null, code, uuid);
    }
    public void checkCaptcha(String keyPrefix, String code, String uuid) throws CaptchaException {
        if (StrUtil.isBlank(keyPrefix)) {
            keyPrefix = CacheConstants.CAPTCHA_CODE_KEY;
        }
        if (StrUtil.isEmpty(code)) {
            throw new CaptchaException("验证码不能为空");
        }
        if (StrUtil.isEmpty(uuid)) {
            throw new CaptchaException("验证码已失效");
        }
        String verifyKey = keyPrefix + uuid;
        String captcha = redisService.getCacheObject(verifyKey);
        if (StrUtil.isEmpty(captcha)) {
            throw new CaptchaException("验证码已失效");
        }
        redisService.deleteObject(verifyKey);

        if (!code.equalsIgnoreCase(captcha)) {
            throw new CaptchaException("当前登录账号、密码、验证码不匹配，请核对后重新输入！");
        }
    }
}
