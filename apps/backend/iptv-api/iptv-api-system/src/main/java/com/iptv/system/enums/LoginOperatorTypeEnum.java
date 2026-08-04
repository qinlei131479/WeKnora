package com.iptv.system.enums;

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

    public static LoginOperatorTypeEnum getLoginOperatorTypeEnumByCode(String code) {
        for (LoginOperatorTypeEnum loginOperatorTypeEnum : LoginOperatorTypeEnum.values()) {
            if (loginOperatorTypeEnum.getCode().equals(code)) {
                return loginOperatorTypeEnum;
            }
        }
        return null;
    }
}
