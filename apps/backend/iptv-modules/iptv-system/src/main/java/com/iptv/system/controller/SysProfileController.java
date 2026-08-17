package com.iptv.system.controller;

import com.iptv.common.core.domain.R;
import com.iptv.common.core.utils.DateUtils;
import com.iptv.common.core.utils.MessageUtils;
import com.iptv.common.core.utils.StringUtils;
import com.iptv.common.core.utils.file.FileTypeUtils;
import com.iptv.common.core.utils.file.MimeTypeUtils;
import com.iptv.common.core.web.controller.BaseController;
import com.iptv.common.core.web.domain.AjaxResult;
import com.iptv.common.log.annotation.Log;
import com.iptv.common.log.enums.BusinessType;
import com.iptv.common.security.service.TokenService;
import com.iptv.common.security.utils.SecurityUtils;
import com.iptv.system.api.RemoteFileService;
import com.iptv.system.api.domain.SysFile;
import com.iptv.system.api.domain.SysUser;
import com.iptv.system.api.model.LoginUser;
import com.iptv.system.service.ISysUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.Map;

/**
 * 个人信息 业务处理
 * 
 * @author ruoyi
 */
@RestController
@RequestMapping("/user/profile")
public class SysProfileController extends BaseController
{
    @Autowired
    private ISysUserService userService;
    
    @Autowired
    private TokenService tokenService;
    
    @Autowired
    private RemoteFileService remoteFileService;

    /**
     * 个人信息
     */
    @GetMapping
    public AjaxResult profile()
    {
        String username = SecurityUtils.getUsername();
        SysUser user = userService.selectUserByUserName(username);
        AjaxResult ajax = AjaxResult.success(user);
        ajax.put("roleGroup", userService.selectUserRoleGroup(username));
        ajax.put("postGroup", userService.selectUserPostGroup(username));
        return ajax;
    }

    /**
     * 修改用户
     */
    @Log(title = "log.title.profile", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult updateProfile(@RequestBody SysUser user)
    {
        LoginUser loginUser = SecurityUtils.getLoginUser();
        SysUser currentUser = loginUser.getSysUser();
        currentUser.setNickName(user.getNickName());
        currentUser.setEmail(user.getEmail());
        currentUser.setPhonenumber(user.getPhonenumber());
        currentUser.setSex(user.getSex());
        if (StringUtils.isNotEmpty(user.getPhonenumber()) && !userService.checkPhoneUnique(currentUser))
        {
            return error(MessageUtils.message("system.user.edit.phone.exists", loginUser.getUsername()));
        }
        if (StringUtils.isNotEmpty(user.getEmail()) && !userService.checkEmailUnique(currentUser))
        {
            return error(MessageUtils.message("system.user.edit.email.exists", loginUser.getUsername()));
        }
        if (userService.updateUserProfile(currentUser))
        {
            // 更新缓存用户信息
            tokenService.setLoginUser(loginUser);
            return success();
        }
        return error(MessageUtils.message("system.profile.update.failed"));
    }

    /**
     * 重置密码
     */
    @Log(title = "log.title.profile", businessType = BusinessType.UPDATE)
    @PutMapping("/updatePwd")
    public AjaxResult updatePwd(@RequestBody Map<String, String> params)
    {
        String oldPassword = params.get("oldPassword");
        String newPassword = params.get("newPassword");
        LoginUser loginUser = SecurityUtils.getLoginUser();
        Long userId = loginUser.getUserid();
        String password = loginUser.getSysUser().getPassword();
        if (!SecurityUtils.matchesPassword(oldPassword, password))
        {
            return error(MessageUtils.message("system.profile.pwd.old.incorrect"));
        }
        if (SecurityUtils.matchesPassword(newPassword, password))
        {
            return error(MessageUtils.message("system.profile.pwd.same"));
        }
        newPassword = SecurityUtils.encryptPassword(newPassword);
        if (userService.resetUserPwd(userId, newPassword) > 0)
        {
            // 更新缓存用户密码&密码最后更新时间
            loginUser.getSysUser().setPwdUpdateDate(DateUtils.getNowDate());
            loginUser.getSysUser().setPassword(newPassword);
            tokenService.setLoginUser(loginUser);
            return success();
        }
        return error(MessageUtils.message("system.profile.pwd.failed"));
    }
    
    /**
     * 头像上传
     */
    @Log(title = "log.title.avatar", businessType = BusinessType.UPDATE)
    @PostMapping("/avatar")
    public AjaxResult avatar(@RequestParam("file") MultipartFile file)
    {
        if (!file.isEmpty())
        {
            LoginUser loginUser = SecurityUtils.getLoginUser();
            String extension = FileTypeUtils.getExtension(file);
            if (!StringUtils.equalsAnyIgnoreCase(extension, MimeTypeUtils.IMAGE_EXTENSION))
            {
                return error(MessageUtils.message("system.profile.avatar.format",
                        Arrays.toString(MimeTypeUtils.IMAGE_EXTENSION)));
            }
            R<SysFile> fileResult = remoteFileService.upload(file);
            if (StringUtils.isNull(fileResult) || StringUtils.isNull(fileResult.getData()))
            {
                return error(MessageUtils.message("system.profile.avatar.file.service"));
            }
            String url = fileResult.getData().getUrl();
            if (userService.updateUserAvatar(loginUser.getUserid(), url))
            {
                String oldAvatarUrl = loginUser.getSysUser().getAvatar();
                if (StringUtils.isNotEmpty(oldAvatarUrl))
                {
                    remoteFileService.delete(oldAvatarUrl);
                }
                AjaxResult ajax = AjaxResult.success();
                ajax.put("imgUrl", url);
                // 更新缓存用户头像
                loginUser.getSysUser().setAvatar(url);
                tokenService.setLoginUser(loginUser);
                return ajax;
            }
        }
        return error(MessageUtils.message("system.profile.avatar.upload.failed"));
    }
}
