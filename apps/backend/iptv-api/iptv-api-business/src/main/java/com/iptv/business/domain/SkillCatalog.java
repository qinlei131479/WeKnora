package com.iptv.business.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.iptv.common.core.typehandler.JsonbTypeHandler;
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
@TableName(value = "tenant_skill_catalog", autoResultMap = true)
public class SkillCatalog implements java.io.Serializable {
    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.INPUT)
    @Schema(description = "主键 ID（UUID）")
    private String id;

    @Schema(description = "所属工作空间（租户）ID；管理后台新增固定为 0（内置技能书）")
    private Long tenantId;

    @Schema(description = "技能名称（SKILL.md frontmatter name，租户内唯一）")
    private String name;

    @Schema(description = "版本号")
    private String version;

    @Schema(description = "技能描述")
    private String description;

    @Schema(description = "SKILL.md 正文指令（frontmatter 之外的内容）")
    private String instructions;

    @Schema(description = "bundle zip 存储引用（内置直连格式 minio://{bucket}/{tenantId}/tenant-skills/catalog/{name}.zip，或 resource://handle）")
    private String bundleRef;

    @Schema(description = "bundle zip 的 SHA256 摘要")
    private String bundleSha256;

    @Schema(description = "使用侧：chat 对话、work 工作、common 通用")
    private String sourceType;

    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "绑定的工具（JSON 数组）")
    private String toolDependencies;

    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "绑定的 MCP（JSON 数组）")
    private String mcpDependencies;

    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "绑定的其他技能（JSON 数组）")
    private String skillDependencies;

    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "共享范围（JSON 对象）")
    private String shareConfig;

    @Schema(description = "是否启用")
    private Boolean enabled;

    @Schema(description = "创建人")
    private String createdBy;

    @Schema(description = "最近更新人")
    private String updatedBy;

    @Schema(description = "内置技能源目录最后修改时间")
    private Date sourceMtime;

    @Schema(description = "创建时间")
    private Date createdAt;

    @Schema(description = "最后更新时间")
    private Date updatedAt;

    @Schema(description = "软删除时间；非空表示已删除")
    private Date deletedAt;
}
