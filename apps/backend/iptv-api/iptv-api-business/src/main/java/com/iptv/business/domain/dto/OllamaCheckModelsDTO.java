package com.iptv.business.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * 检查 Ollama 模型是否已安装 DTO
 *
 * @author kjsc
 * @since 2026-08-12
 */
@Data
@Schema(description = "检查 Ollama 模型是否已安装请求")
public class OllamaCheckModelsDTO {

    @Schema(description = "模型名称列表")
    private List<String> models;
}
