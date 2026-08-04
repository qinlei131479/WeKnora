package com.iptv.common.core.enums;

import lombok.Getter;

/**
 * 是否标志枚举
 * 
 * @author ：qinlei
 * @date ：Created in 2024/3/14 1:48 下午
 */
@Getter
public enum FlagEnum {

	YES(1,"1", "是"),
	NO(0,"0", "否"),
	;

	private final Integer code;
	private final String codeStr;
	private final String desc;

	FlagEnum(Integer code, String codeStr, String desc) {
		this.code = code;
		this.codeStr = codeStr;
		this.desc = desc;
	}

	/**
	 * * 判断是标志
	 * 
	 * @param code
	 * @return
	 */
	public static boolean checkYes(Integer code) {
		return YES.getCode().equals(code);
	}

	/**
	 * * 判断否标志
	 * 
	 * @param code
	 * @return
	 */
	public static boolean checkNo(Integer code) {
		return NO.getCode().equals(code);
	}

	public static FlagEnum getByCode(Integer code) {
		for (FlagEnum flag : FlagEnum.values()) {
			if (flag.getCode().equals(code)) {
				return flag;
			}
		}
		return null;
	}
}
