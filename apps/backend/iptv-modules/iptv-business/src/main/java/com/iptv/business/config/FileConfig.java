package com.iptv.business.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 文件上传下载配置
 */
@Component
@Getter
public class FileConfig {
	
	/**
	 * 上传文件存储在本地的根路径
	 */
	@Value("${file.path:}")
	private String localFilePath;
	
	/**
	 * 资源映射路径 前缀
	 */
	@Value("${file.service-prefix-url:}")
	public String servicePrefixUrl;
	
}
