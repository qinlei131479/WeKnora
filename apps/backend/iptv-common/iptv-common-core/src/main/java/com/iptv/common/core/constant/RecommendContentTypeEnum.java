package com.iptv.common.core.constant;

import lombok.Data;
import lombok.Getter;

@Getter
public enum RecommendContentTypeEnum {

    //	内容类型：精选、推荐、底量
    Curated(1, "人工精选"),
    Recommend(2, "热点推荐"),
    Bottom(3, "底量"),
    LATEST(4, "最新上线"),
    Topic(5, "专题"),
    Theme(6, "主题");

    private Integer code;
    private String desc;

    RecommendContentTypeEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static String getDescByCode(Integer code) {
        for (RecommendContentTypeEnum value : RecommendContentTypeEnum.values()) {
            if (value.getCode().equals(code)) {
                return value.getDesc();
            }
        }
        return "";
    }
}
