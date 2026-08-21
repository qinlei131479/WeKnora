package com.iptv.business.enums;

import cn.hutool.core.util.StrUtil;
import com.iptv.common.core.utils.MessageUtils;
import lombok.Getter;

/**
 * 租户角色权限
 *
 * @author ruoyi
 */
@Getter
public enum TenantMemberRoleEnum {
    OWNER("owner", "所有者"),
    ADMIN("admin", "管理员"),
    EDITOR("contributor", "编辑"),
    GUEST("viewer", "访客");

    private final String code;
    private final String info;

    TenantMemberRoleEnum(String code, String info) {
        this.code = code;
        this.info = info;
    }

    public String getInfo() {
        return MessageUtils.desc(this, info);
    }

    public static String getDesc(String code) {
        for (TenantMemberRoleEnum role : TenantMemberRoleEnum.values()) {
            if (StrUtil.equals(role.getCode(), code)) {
                return role.getInfo();
            }
        }
        return null;
    }
}
