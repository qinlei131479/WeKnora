package com.iptv.business.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * DocReader 配置类
 * 通过Nacos配置中心读取docreader地址配置
 *
 * @author kjsc
 * @since 2026-08-26
 */
@Data
@Component
@ConfigurationProperties(prefix = "docreader")
public class DocReaderConfig {

    /**
     * docreader 服务地址
     */
    private String url = "192.168.180.238:50051";
}
