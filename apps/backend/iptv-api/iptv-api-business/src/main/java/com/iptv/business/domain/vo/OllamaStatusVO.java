package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * Ollama 服务状态 VO
 *
 * @author kjsc
 * @since 2026-08-12
 */
@Data
@Schema(description = "Ollama 服务状态")
public class OllamaStatusVO {

    @Schema(description = "服务是否可用")
    private Boolean available;

    @Schema(description = "服务地址")
    private String endpoint;

    @Schema(description = "版本信息")
    private String version;
}
