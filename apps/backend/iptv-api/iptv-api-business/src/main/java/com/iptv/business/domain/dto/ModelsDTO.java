package com.iptv.business.domain.dto;

import com.iptv.common.core.web.domain.dto.BaseDTO;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;

/**
 * <p>
 * 模型配置 DTO
 * </p>
 *
 * @author kjsc
 * @since 2026-08-19
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class ModelsDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 唯一ID
     */
    @NotNull(message = "唯一ID不能为空", groups = {BaseDTO.Update.class})
    @Schema(description = "唯一ID")
    private String id;

    /**
     * 租户ID
     */
    @Schema(description = "租户ID")
    private Integer tenantId;

    /**
     * 模型名称
     */
    @NotBlank(message = "模型名称不能为空", groups = {BaseDTO.Insert.class})
    @Schema(description = "模型名称")
    private String name;

    /**
     * 显示名称
     */
    @Schema(description = "显示名称")
    private String displayName;

    /**
     * 模型类型: KnowledgeQA, Embedding, Rerank, VLLM, ASR
     */
    @NotBlank(message = "模型类型不能为空", groups = {BaseDTO.Insert.class})
    @Schema(description = "模型类型")
    private String type;

    /**
     * 模型来源: local, remote, aliyun, zhipu, volcengine, deepseek, hunyuan, minimax, openai, gemini, mimo, siliconflow, jina, openrouter, requesty, nvidia, novita, azure_openai
     */
    @NotBlank(message = "模型来源不能为空", groups = {BaseDTO.Insert.class})
    @Schema(description = "模型来源")
    private String source;

    /**
     * 描述
     */
    @Schema(description = "描述")
    private String description;

    /**
     * 模型参数
     */
    @NotNull(message = "模型参数不能为空", groups = {BaseDTO.Insert.class})
    @Schema(description = "模型参数")
    private ModelParametersDTO parameters;
}
