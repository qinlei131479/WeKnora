package com.iptv.business.enums;

import com.iptv.common.core.utils.MessageUtils;
import lombok.Getter;

/**
 * 租户角色权限
 *
 * @author ruoyi
 */
@Getter
public enum BusinessStatusEnum {
    ACTIVE("active", "激活");

    private final String code;
    private final String info;

    BusinessStatusEnum(String code, String info) {
        this.code = code;
        this.info = info;
    }

    public String getInfo() {
        return MessageUtils.desc(this, info);
    }
}
