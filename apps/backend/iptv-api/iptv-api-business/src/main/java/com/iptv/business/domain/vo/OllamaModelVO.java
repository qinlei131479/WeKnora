package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * Ollama 模型信息 VO
 *
 * @author kjsc
 * @since 2026-08-12
 */
@Data
@Schema(description = "Ollama 模型信息")
public class OllamaModelVO {

    @Schema(description = "模型名称")
    private String name;

    @Schema(description = "模型大小（字节）")
    private Long size;

    @Schema(description = "修改时间")
    private String modifiedAt;

    @Schema(description = "模型摘要")
    private String digest;
}
