package com.iptv.business.util;

public class PlatformUtil {
	
	/**
	 * 判断是否是Linux系统
	 *
	 * @return
	 */
	public static boolean isLinux() {
		return System.getProperty("os.name").toLowerCase().contains("linux");
	}
}
