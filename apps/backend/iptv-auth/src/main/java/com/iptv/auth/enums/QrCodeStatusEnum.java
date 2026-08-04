package com.iptv.auth.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 二维码状态
 */
@Getter
@AllArgsConstructor
@NoArgsConstructor
public enum QrCodeStatusEnum {
    // 200（各方面正常，未扫码也是），500（其他错误） 410（二维码失效，需要刷新）
    SUCCESS(200),
    ERROR(500),
    EXPIRED(410);

    private Integer status;
}
