package com.iptv.business.util;

import cn.hutool.core.util.StrUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 文件版本号工具类
 */
public class FileVersionUtil {
	
	final private static Logger logger = LoggerFactory.getLogger(FileVersionUtil.class);
	
	// 文件版本号前缀
	public static final String FILE_VERSION_PREFIX = "v";
	
	// 初始版本号
	public static final String INIT_FILE_VERSION = FILE_VERSION_PREFIX + "0";
	
	/**
	 * 获取下一个版本号
	 *
	 * @param version v1
	 *
	 * @return v2
	 */
	public static String getNextVersion(String version) {
		if (StrUtil.isBlank(version) || ! version.startsWith(FILE_VERSION_PREFIX)) {
			return INIT_FILE_VERSION;
		}
		
		try {
			int versionNum = Integer.parseInt(version.replace(FILE_VERSION_PREFIX, StrUtil.EMPTY));
			return FILE_VERSION_PREFIX + (versionNum + 1);
		} catch (Exception e) {
			logger.error("获取下一个版本号失败, version:{}", version, e);
			return version;
		}
	}
	
}
