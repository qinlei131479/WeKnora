package com.iptv.business.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 下载 Ollama 模型 DTO
 *
 * @author kjsc
 * @since 2026-08-12
 */
@Data
@Schema(description = "下载 Ollama 模型请求")
public class OllamaDownloadModelDTO {

    @Schema(description = "模型名称")
    private String model;
}
