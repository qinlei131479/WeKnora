package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.Map;

/**
 * 检查 Ollama 模型结果 VO
 *
 * @author kjsc
 * @since 2026-08-12
 */
@Data
@Schema(description = "检查 Ollama 模型结果")
public class OllamaCheckModelsVO {

    @Schema(description = "模型可用性映射（模型名 -> 是否可用）")
    private Map<String, Boolean> models;
}
