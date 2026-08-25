package com.iptv.business.domain.dto.page;

import com.iptv.common.core.web.page.PageDTO;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;
import java.io.Serializable;
import java.util.Date;

/**
 * <p>
 * 具体对象/文件存储后端实例（可多实例同 provider）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-21
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class StorageBackendsPageDTO implements Serializable {
    @Serial
    private static final long serialVersionUID = -3785203040686094954L;

    @Schema(description = "主键 ID")
    private String id;

    @Schema(description = "所属工作空间（租户）ID")
    private Integer tenantId;

    @Schema(description = "存储后端实例名称")
    private String name;

    @Schema(description = "提供商类型")
    private String provider;

    @Schema(description = "配置（JSON）")
    private String config;

    @Schema(description = "来源：user（控制台）或 env（环境迁移）")
    private String source;

    @Schema(description = "状态：active/disabled")
    private String status;

    @Schema(description = "是否为兼容旧路径的别名后端")
    private Boolean legacyAlias;

    @Schema(description = "创建时间")
    private Date createdAt;

    @Schema(description = "最后更新时间")
    private Date updatedAt;

    @Schema(description = "软删除时间；非空表示已删除")
    private Date deletedAt;
}
