package com.iptv.system.enums;

import com.iptv.common.core.utils.MessageUtils;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum LoginOperatorTypeEnum {
    LOGIN("0", "登录"),
    LOGOUT("1", "注销"),
    REGISTER("2", "注册");

    private final String code;

    private final String name;

    public String getName() {
        return MessageUtils.desc(this, name);
    }

    public static LoginOperatorTypeEnum getLoginOperatorTypeEnumByCode(String code) {
        for (LoginOperatorTypeEnum loginOperatorTypeEnum : LoginOperatorTypeEnum.values()) {
            if (loginOperatorTypeEnum.getCode().equals(code)) {
                return loginOperatorTypeEnum;
            }
        }
        return null;
    }
}
