package com.iptv.business.domain;

import java.util.Date;
import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;



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
public class StorageBackends implements java.io.Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键 ID
     */


    @Schema(description = "主键 ID")
    private String id;

    /**
     * 所属工作空间（租户）ID
     */


    @Schema(description = "所属工作空间（租户）ID")
    private Long tenantId;

    /**
     * 存储后端实例名称
     */


    @Schema(description = "存储后端实例名称")
    private String name;

    /**
     * 提供商类型
     */


    @Schema(description = "提供商类型")
    private String provider;

    /**
     * 配置（JSON）
     */


    @Schema(description = "配置（JSON）")
    private String config;

    /**
     * 来源：user（控制台）或 env（环境迁移）
     */


    @Schema(description = "来源：user（控制台）或 env（环境迁移）")
    private String source;

    /**
     * 状态：active/disabled
     */


    @Schema(description = "状态：active/disabled")
    private String status;

    /**
     * 是否为兼容旧路径的别名后端
     */


    @Schema(description = "是否为兼容旧路径的别名后端")
    private Boolean legacyAlias;

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