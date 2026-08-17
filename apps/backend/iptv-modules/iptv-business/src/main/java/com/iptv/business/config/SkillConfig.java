package com.iptv.business.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 技能配置类
 * 通过Nacos配置中心读取skills目录路径
 *
 * @author kjsc
 * @since 2026-08-13
 */
@Data
@Component
@ConfigurationProperties(prefix = "skill")
public class SkillConfig {

    /**
     * 预装技能目录路径
     * 默认值：skills/preloaded
     */
    private String path;

    /**
     * 沙箱模式开关
     * 控制前端是否显示技能相关功能
     */
    private Boolean sandboxMode = false;
}
