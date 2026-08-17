package com.iptv.common.core.enums;

import com.iptv.common.core.utils.MessageUtils;

/**
 * 用户状态
 *
 * @author ruoyi
 */
public enum UserStatus
{
    OK("0", "正常"), DISABLE("1", "停用");

    private final String code;
    private final String info;

    UserStatus(String code, String info)
    {
        this.code = code;
        this.info = info;
    }

    public String getCode()
    {
        return code;
    }

    public String getInfo()
    {
        return MessageUtils.desc(this, info);
    }
}
