package com.iptv.common.core.enums;

import lombok.Getter;
import com.iptv.common.core.utils.MessageUtils;

/**
 * 删除标志枚举
 *
 * @author ：qinlei
 * @date ：Created in 2024/3/14 1:48 下午
 */
@Getter
public enum DelFlagEnum {

    DELETE(1, "1", "删除"),
    NORMAL(0, "0", "正常"),
    ;

    private final Integer code;
    private final String codeStr;
    private final String desc;

    DelFlagEnum(Integer code, String codeStr, String desc) {
        this.code = code;
        this.codeStr = codeStr;
        this.desc = desc;
    }

    public String getDesc() {
        return MessageUtils.desc(this, desc);
    }

    /**
     * * 判断删除标志
     *
     * @param code
     * @return
     */
    public static boolean checkDelete(Integer code) {
        return DELETE.getCode().equals(code);
    }

    /**
     * * 判断正常标志
     *
     * @param code
     * @return
     */
    public static boolean checkNormal(Integer code) {
        return NORMAL.getCode().equals(code);
    }

    public static DelFlagEnum getByCode(Integer code) {
        for (DelFlagEnum flag : DelFlagEnum.values()) {
            if (flag.getCode().equals(code)) {
                return flag;
            }
        }
        return null;
    }
}