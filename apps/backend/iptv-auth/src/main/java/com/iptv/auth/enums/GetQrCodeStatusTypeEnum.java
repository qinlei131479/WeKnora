package com.iptv.auth.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public enum GetQrCodeStatusTypeEnum {

    /**
     * 登录
     */
    LOGIN("login"),
    /**
     * 绑定
     */
    BIND("bind");

    private String type;
}
