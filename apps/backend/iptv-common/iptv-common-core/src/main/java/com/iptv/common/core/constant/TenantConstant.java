package com.iptv.common.core.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;
import com.iptv.common.core.utils.MessageUtils;

/**
 * 租户相关常量
 */
public class TenantConstant {

    /** 平台管理租户id */
    public static final Long ADMIN_TENANT_ID = 1L;

    public static final Integer BUSINESS_BUILTIN_TENANT_ID = 0;

    /**
     * 租户类型编码
     */
    @AllArgsConstructor
    @Getter
    public enum TenantType {

        INNER("0", "大数据平台"),
        THIRD_2_0("1", "2.0平台"),
        WMSJ("2", "文明实践"),
        DTXT("3", "答题系统"),
        PXXT("4", "培训系统"),
        ;

        private final String code;
        private final String name;

        public String getName() {
            return MessageUtils.desc(this, name);
        }

        public static String getNameByCode(String code) {
            for (TenantType ele : TenantType.values()) {
                if (ele.getCode().equals(code)) {
                    return ele.getName();
                }
            }
            return null;
        }
    }
}
