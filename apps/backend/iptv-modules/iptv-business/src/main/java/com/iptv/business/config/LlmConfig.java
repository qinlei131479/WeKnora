package com.iptv.business.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 大模型配置
 */
@Component
@Getter
public class LlmConfig {

    @Value("${llm.apiKey:sk-4faba81e1a274aa79bf8419cb06eacb0}")
    private String apiKey;

    @Value("${llm.model:qwen-plus-latest}")
    private String model;

}
