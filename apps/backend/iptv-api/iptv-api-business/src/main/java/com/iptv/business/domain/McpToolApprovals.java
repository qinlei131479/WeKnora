package com.iptv.business.domain;

import java.util.Date;
import java.io.Serializable;

import com.baomidou.mybatisplus.annotation.IdType;
import lombok.Data;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;



/**
 * <p>
 * MCP 工具调用人工审批门禁记录
 * </p>
 *
 * @author kjsc
 * @since 2026-08-11
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class McpToolApprovals implements java.io.Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 审批记录主键
     */

    @TableId(type = IdType.ASSIGN_UUID)
    @Schema(description = "审批记录主键")
    private String id;

    /**
     * 所属工作空间（租户）ID
     */


    @Schema(description = "所属工作空间（租户）ID")
    private Integer tenantId;

    /**
     * 关联 MCP 服务 ID
     */


    @Schema(description = "关联 MCP 服务 ID")
    private String serviceId;

    /**
     * 待审批的 MCP 工具名
     */


    @Schema(description = "待审批的 MCP 工具名")
    private String toolName;

    /**
     * 加入是否需要审批
     */


    @Schema(description = "加入是否需要审批")
    private Boolean requireApproval;

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