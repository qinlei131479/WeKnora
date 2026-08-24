package com.iptv.business.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;
import java.io.Serializable;
import java.util.Date;

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
public class VectorStoresDTO implements Serializable {
    @Serial
    private static final long serialVersionUID = 761828641987387444L;

    @Schema(description = "主键 ID")
    private String id;

    @Schema(description = "展示名，如 elasticsearch-hot")
    private String name;

    @Schema(description = "引擎类型")
    private String engineType;

    @Schema(description = "连接配置（敏感字段加密）")
    private String connectionConfig;

    @Schema(description = "索引/集合配置")
    private String indexConfig;

    @Schema(description = "所属工作空间（租户）ID")
    private Integer tenantId;

    @Schema(description = "创建时间")
    private Date createdAt;

    @Schema(description = "最后更新时间")
    private Date updatedAt;

    @Schema(description = "软删除时间；非空表示已删除")
    private Date deletedAt;
}
