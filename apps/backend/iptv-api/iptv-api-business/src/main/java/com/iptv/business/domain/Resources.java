package com.iptv.business.domain;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.util.Date;

/**
 * 资源实体类
 *
 * @author iptv
 * @since 2026-01-27
 */
@Data
@TableName("resources")
public class Resources implements Serializable {
    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "资源ID")
    @TableId
    private String id;

    @Schema(description = "资源句柄")
    @TableField("handle")
    private String handle;

    @Schema(description = "租户ID")
    @TableField("tenant_id")
    private Long tenantId;

    @Schema(description = "存储后端ID")
    @TableField("storage_backend_id")
    private String storageBackendId;

    @Schema(description = "存储提供者")
    @TableField("provider")
    private String provider;

    @Schema(description = "物理路径")
    @TableField("physical_path")
    private String physicalPath;

    @Schema(description = "位置哈希")
    @TableField("location_hash")
    private String locationHash;

    @Schema(description = "资源类型")
    @TableField("kind")
    private String kind;

    @Schema(description = "MIME类型")
    @TableField("mime_type")
    private String mimeType;

    @Schema(description = "原始文件名")
    @TableField("original_name")
    private String originalName;

    @Schema(description = "文件大小")
    @TableField("size")
    private Long size;

    @Schema(description = "内容哈希")
    @TableField("content_hash")
    private String contentHash;

    @Schema(description = "生命周期")
    @TableField("lifecycle")
    private String lifecycle;

    @Schema(description = "过期时间")
    @TableField("expires_at")
    private Date expiresAt;

    @Schema(description = "状态")
    @TableField("state")
    private String state;

    @Schema(description = "创建时间")
    @TableField("created_at")
    private Date createdAt;

    @Schema(description = "更新时间")
    @TableField("updated_at")
    private Date updatedAt;

    @Schema(description = "删除时间")
    @TableField("deleted_at")
    private Date deletedAt;
}
