package com.iptv.business.domain.vo;

import java.io.Serializable;
import java.util.Date;
import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * <p>
 * 向量库连接实例：引擎类型、连接与索引配置
 * </p>
 *
 * @author kjsc
 * @since 2026-08-24
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class VectorStoresVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键 ID
     */
    @Schema(description = "主键 ID")
    private String id;

    /**
     * 展示名，如 elasticsearch-hot
     */
    @Schema(description = "展示名，如 elasticsearch-hot")
    private String name;

    /**
     * 引擎类型
     */
    @Schema(description = "引擎类型")
    private String engineType;

    /**
     * 连接配置（敏感字段加密）
     */
    @Schema(description = "连接配置（敏感字段加密）")
    private String connectionConfig;

    /**
     * 索引/集合配置
     */
    @Schema(description = "索引/集合配置")
    private String indexConfig;

    /**
     * 所属工作空间（租户）ID
     */
    @Schema(description = "所属工作空间（租户）ID")
    private Long tenantId;

    /**
     * 创建时间
     */
    @Schema(description = "创建时间")
    private Date createdAt;

    /**
     * 最后更新时间
     */
    @Schema(description = "最后更新时间")
    private Date updatedAt;

    /**
     * 软删除时间；非空表示已删除
     */
    @Schema(description = "软删除时间；非空表示已删除")
    private Date deletedAt;
}
