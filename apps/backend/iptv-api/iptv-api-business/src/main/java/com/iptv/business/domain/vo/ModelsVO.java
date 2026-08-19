package com.iptv.business.domain.vo;

import java.io.Serializable;
import java.util.Date;
import java.util.Map;

import lombok.Data;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * <p>
 * 模型配置 VO
 * </p>
 *
 * @author kjsc
 * @since 2026-08-19
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class ModelsVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 唯一ID
     */
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
     * 模型类型
     */
    @Schema(description = "模型类型")
    private String type;

    /**
     * 模型来源
     */
    @Schema(description = "模型来源")
    private String source;

    /**
     * 描述
     */
    @Schema(description = "描述")
    private String description;

    /**
     * 模型参数 (脱敏后)
     */
    @Schema(description = "模型参数")
    private ModelParametersVO parameters;

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
     * 状态
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
     * 凭证配置状态 (可选)
     */
    @Schema(description = "凭证配置状态")
    private Map<String, CredentialFieldMetadataVO> credentials;
}
