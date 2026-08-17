package com.iptv.common.core.enums;

import lombok.Getter;
import com.iptv.common.core.utils.MessageUtils;

/**
 * 启用禁用枚举
 *
 * @author ：qinlei
 * @date ：Created in 2024/3/14 1:48 下午
 */
@Getter
public enum EnableEnum {

    ENABLE(1, "1", "启用"),
    DISABLE(0, "0", "停用"),
    // 强制停用 不可恢复
    FORCE_DISABLE(2,"2", "停用"),
    ;

    private final Integer code;
    private final String codeStr;
    private final String desc;

    EnableEnum(Integer code, String codeStr, String desc) {
        this.code = code;
        this.codeStr = codeStr;
        this.desc = desc;
    }

    public String getDesc() {
        return MessageUtils.desc(this, desc);
    }

    public static String getDescByCode(Integer enabled) {
        for (EnableEnum value : EnableEnum.values()) {
            if (value.getCode().equals(enabled)) {
                return value.getDesc();
            }
        }
        return null;
    }
}
