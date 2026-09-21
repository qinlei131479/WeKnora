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
 * Harness 内置工具只读目录，用于统一预览、依赖解析和统计
 * </p>
 *
 * @author kjsc
 * @since 2026-09-21
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class AmpBuiltinTools implements java.io.Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 内置工具目录自增主键
     */


    @Schema(description = "内置工具目录自增主键")
    private Long id;

    /**
     * 工具稳定标识
     */


    @Schema(description = "工具稳定标识")
    private String toolSlug;

    /**
     * 统一能力标识
     */


    @Schema(description = "统一能力标识")
    private String capabilityKey;

    /**
     * 工具展示名称
     */


    @Schema(description = "工具展示名称")
    private String name;

    /**
     * 工具描述
     */


    @Schema(description = "工具描述")
    private String description;

    /**
     * 工具分类
     */


    @Schema(description = "工具分类")
    private String category;

    /**
     * 工具输入 JSON Schema
     */


    @Schema(description = "工具输入 JSON Schema")
    private String inputSchema;

    /**
     * 是否启用
     */


    @Schema(description = "是否启用")
    private Boolean enabled;

    /**
     * 来源类型；目录阶段固定为 builtin
     */


    @Schema(description = "来源类型；目录阶段固定为 builtin")
    private String source;

    /**
     * 工具版本
     */


    @Schema(description = "工具版本")
    private String version;

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
}