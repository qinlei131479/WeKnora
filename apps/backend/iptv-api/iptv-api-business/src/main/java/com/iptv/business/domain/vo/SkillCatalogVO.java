package com.iptv.business.domain.vo;

import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.iptv.business.domain.Tenants;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;
import java.util.Date;
import java.util.List;

/**
 * <p>
 * 技能目录定义视图对象
 * </p>
 *
 * @author kjsc
 * @since 2026-09-21
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class SkillCatalogVO implements java.io.Serializable {
    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "主键 ID（UUID）")
    private String id;

    @Schema(description = "所属工作空间（租户）ID")
    private Long tenantId;

    @Schema(description = "技能名称")
    private String name;

    @Schema(description = "版本号")
    private String version;

    @Schema(description = "技能描述")
    private String description;

    @Schema(description = "SKILL.md 正文指令")
    private String instructions;

    @Schema(description = "bundle zip 存储引用")
    private String bundleRef;

    @Schema(description = "bundle zip 的 SHA256 摘要")
    private String bundleSha256;

    @Schema(description = "使用侧：chat 对话、work 工作、common 通用")
    private String sourceType;

    @Schema(description = "绑定的工具（JSON 数组）")
    private JSONArray toolDependencies;

    @Schema(description = "绑定的 MCP（JSON 数组）")
    private JSONArray mcpDependencies;

    @Schema(description = "绑定的其他技能（JSON 数组）")
    private JSONArray skillDependencies;

    @Schema(description = "共享范围（JSON 对象）")
    private JSONObject shareConfig;

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

    @Schema(description = "关联租户信息")
    private Tenants tenant;

    @Schema(description = "bundle 内文件树（详情查询时返回）")
    private List<FileNode> fileTree;

    /**
     * bundle 内文件树节点
     */
    @Data
    public static class FileNode implements java.io.Serializable {
        @Serial
        private static final long serialVersionUID = 1L;

        @Schema(description = "节点名称")
        private String name;

        @Schema(description = "相对技能根目录的路径")
        private String path;

        @Schema(description = "是否为目录")
        private Boolean isDir;

        @Schema(description = "子节点（目录时存在）")
        private List<FileNode> children;
    }
}
