package com.iptv.common.core.enums;

import lombok.Getter;

/**
 * 排序枚举
 * 
 * @author apple
 */
@Getter
public enum OrderByStatusEnum {

	ASC("asc", "升序"),
	DESC("desc", "降序"),
	;

	OrderByStatusEnum(String code, String desc) {
		this.code = code;
		this.desc = desc;

	}

	private final String code;
	private final String desc;
}
