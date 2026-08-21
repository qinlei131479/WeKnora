package com.iptv.business.domain;

import java.util.Date;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.iptv.common.core.typehandler.JsonbTypeHandler;
import lombok.Data;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * <p>
 * 模型配置
 * </p>
 *
 * @author kjsc
 * @since 2026-08-19
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName(value = "models", autoResultMap = true)
public class Models implements java.io.Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 唯一ID
     */
    @TableId(type = IdType.ASSIGN_UUID)
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
    @Schema(description = "模型类型")
    private String type;

    /**
     * 模型来源: local, remote, aliyun, zhipu, volcengine, deepseek, hunyuan, minimax, openai, gemini, mimo, siliconflow, jina, openrouter, requesty, nvidia, novita, azure_openai
     */
    @Schema(description = "模型来源")
    private String source;

    /**
     * 描述
     */
    @Schema(description = "描述")
    private String description;

    /**
     * 模型参数 (JSON)
     */
    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "模型参数")
    private String parameters;

    /**
     * 是否默认模型
     */
    @Schema(description = "是否默认模型")
    private Boolean isDefault;

    /**
     * 是否内置模型
     */
    @Schema(description = "是否内置模型")
    private Boolean isBuiltin;

    /**
     * 管理来源 (yaml等)
     */
    @Schema(description = "管理来源")
    private String managedBy;

    /**
     * 状态: active, downloading, download_failed
     */
    @Schema(description = "状态")
    private String status;

    /**
     * 创建时间
     */
    @Schema(description = "创建时间")
    private Date createdAt;

    /**
     * 更新时间
     */
    @Schema(description = "更新时间")
    private Date updatedAt;

    /**
     * 删除时间
     */
    @Schema(description = "删除时间")
    private Date deletedAt;
}
