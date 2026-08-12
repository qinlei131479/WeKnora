package com.iptv.business.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 检查远程模型 DTO
 *
 * @author kjsc
 * @since 2026-08-12
 */
@Data
@Schema(description = "检查远程模型请求")
public class OllamaCheckRemoteModelDTO {

    @Schema(description = "模型服务 URL")
    private String url;

    @Schema(description = "API Key")
    private String apiKey;

    @Schema(description = "模型名称")
    private String modelName;
}
