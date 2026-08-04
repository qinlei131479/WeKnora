package com.iptv.generator.config;

import com.baomidou.mybatisplus.generator.config.FileOutConfig;
import com.baomidou.mybatisplus.generator.config.po.TableInfo;

/**
 * 自定义模块文件生产配置
 * 
 * @author ：qinlei
 * @date ：Created in 2024/3/18 1:58 下午
 */
public class CodeFileOutConfig extends FileOutConfig {

	// 模板路径
	static final String TEMPLATE_PATH = "/templates_code";

	private String prefix;

	private String suffix;

	public CodeFileOutConfig(String template, String prefix, String suffix) {
		super(TEMPLATE_PATH + template);
		this.prefix = prefix;
		this.suffix = suffix;
	}

	@Override
	public String outputFile(TableInfo tableInfo) {
		return String.format("%s/%s%s", this.prefix, tableInfo.getEntityName(), this.suffix);
	}
}
