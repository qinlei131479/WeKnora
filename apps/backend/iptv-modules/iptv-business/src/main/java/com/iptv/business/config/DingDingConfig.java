package com.iptv.business.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * @author GongJie
 * @date 2024/8/25
 */
@Data
@Component
@ConfigurationProperties(prefix = "dingding")
public class DingDingConfig {

    private String appKey = "dingxxa8blr5tluq17s1";

    private String appSecret = "3qgOVF5rEAtXCYTfkqesqkgnSfuSZaaWvdagUk1AsqPEhrGPk-hj39LE554b9Z9i";

    /**
     * 操作人userId，必须是公告管理员。
     * 姜莉：3108580944746797
     */
    private String operationUserid = "3108580944746797";
}
