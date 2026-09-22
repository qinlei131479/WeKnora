package com.iptv.business.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;
import java.util.Date;

/**
 * <p>
 * 工作空间技能目录定义（与 Go 端 tenant_skill_catalog 共享，软删除）
 * </p>
 *
 * @author kjsc
 * @since 2026-09-21
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("tenant_skill_catalog")
public class SkillCatalog implements java.io.Serializable {
    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.INPUT)
    @Schema(description = "主键 ID（UUID）")
    private String id;

    @Schema(description = "所属工作空间（租户）ID；管理后台新增固定为 1")
    private Long tenantId;

    @Schema(description = "技能名称（SKILL.md frontmatter name，租户内唯一）")
    private String name;

    @Schema(description = "版本号")
    private String version;

    @Schema(description = "技能描述")
    private String description;

    @Schema(description = "SKILL.md 正文指令（frontmatter 之外的内容）")
    private String instructions;

    @Schema(description = "bundle zip 存储引用（如 minio://{bucket}/1/exports/{uuid}.zip）")
    private String bundleRef;

    @Schema(description = "bundle zip 的 SHA256 摘要")
    private String bundleSha256;

    @Schema(description = "创建时间")
    private Date createdAt;

    @Schema(description = "最后更新时间")
    private Date updatedAt;

    @Schema(description = "软删除时间；非空表示已删除")
    private Date deletedAt;
}
