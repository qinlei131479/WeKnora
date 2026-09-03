package com.iptv.business.domain.dto;

import java.io.Serializable;
import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.web.multipart.MultipartFile;

/**
 * <p>
 * 模型调试 DTO
 * </p>
 *
 * @author kjsc
 * @since 2026-08-19
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class ModelDebugDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 模型ID (必填)
     */
    @NotBlank(message = "模型ID不能为空")
    @Schema(description = "模型ID")
    private String modelId;

    /**
     * 模型名称 (可选)
     */
    @Schema(description = "模型名称", hidden = true)
    private String modelName;

    /**
     * 输入文本 (必填)
     */
    @NotBlank(message = "输入不能为空")
    @Schema(description = "输入文本")
    private String input;

    /**
     * 系统提示词 (可选)
     */
    @Schema(description = "系统提示词")
    private String systemPrompt;

    /**
     * 温度参数 (可选, 0-2)
     */
    @Min(value = 0, message = "温度必须在0-2之间")
    @Max(value = 2, message = "温度必须在0-2之间")
    @Schema(description = "温度参数")
    private Double temperature;

    /**
     * Top-P 参数 (可选, 0-1)
     */
    @Min(value = 0, message = "top_p必须在0-1之间")
    @Max(value = 1, message = "top_p必须在0-1之间")
    @Schema(description = "Top-P参数")
    private Double topP;

    /**
     * 最大token数 (可选, 1-8192)
     */
    @Min(value = 1, message = "max_tokens必须在1-8192之间")
    @Max(value = 8192, message = "max_tokens必须在1-8192之间")
    @Schema(description = "最大token数")
    private Integer maxTokens;

    /**
     * 是否启用思考模式 (可选)
     */
    @Schema(description = "是否启用思考模式")
    private Boolean thinking;

    /**
     * 文档列表 (可选, Rerank模型使用)
     */
    @Schema(description = "文档列表")
    private List<String> documents;

    /**
     * 文件
     */
    @Schema(description = "文件（可选, 语音模型和视觉模型使用）")
    private MultipartFile file;
}
