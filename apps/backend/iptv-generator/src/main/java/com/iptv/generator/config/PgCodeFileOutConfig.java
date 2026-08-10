package com.iptv.generator.config;

import com.baomidou.mybatisplus.generator.config.FileOutConfig;
import com.baomidou.mybatisplus.generator.config.po.TableInfo;

/**
 * PostgreSQL 模块文件输出配置
 * 模板路径固定为 /templates_code_pg/
 */
public class PgCodeFileOutConfig extends FileOutConfig {

    static final String TEMPLATE_PATH = "/templates_code_pg";

    private final String prefix;
    private final String suffix;

    public PgCodeFileOutConfig(String template, String prefix, String suffix) {
        super(TEMPLATE_PATH + template);
        this.prefix = prefix;
        this.suffix = suffix;
    }

    @Override
    public String outputFile(TableInfo tableInfo) {
        return String.format("%s/%s%s", this.prefix, tableInfo.getEntityName(), this.suffix);
    }
}
