package com.iptv.business.domain;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.iptv.common.core.typehandler.JsonbTypeHandler;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.util.Date;


/**
 * <p>
 * 审计日志：操作者、动作、作用域与请求元数据
 * </p>
 *
 * @author kjsc
 * @since 2026-08-25
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName(value = "audit_logs", autoResultMap = true)
public class AuditLogs implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键 ID
     */


    @Schema(description = "主键 ID")
    private Long id;

    /**
     * 所属工作空间（租户）ID
     */


    @Schema(description = "所属工作空间（租户）ID")
    private Long tenantId;

    /**
     * 操作者用户 ID
     */


    @Schema(description = "操作者用户 ID")
    private String actorUserId;

    /**
     * 操作者角色
     */


    @Schema(description = "操作者角色")
    private String actorRole;

    /**
     * 审计动作名（点分命名空间）
     */


    @Schema(description = "审计动作名（点分命名空间）")
    private String action;

    /**
     * 目标对象类型
     */


    @Schema(description = "目标对象类型")
    private String targetType;

    /**
     * 目标对象 ID
     */


    @Schema(description = "目标对象 ID")
    private String targetId;

    /**
     * 目标用户 ID
     */


    @Schema(description = "目标用户 ID")
    private String targetUserId;

    /**
     * HTTP 请求路径
     */


    @Schema(description = "HTTP 请求路径")
    private String requestPath;

    /**
     * HTTP 方法
     */


    @Schema(description = "HTTP 方法")
    private String requestMethod;

    /**
     * 结果（success/failure 等）
     */


    @Schema(description = "结果（success/failure 等）")
    private String outcome;

    /**
     * 详情（JSONB）
     */


    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "详情（JSONB）")
    private String details;

    /**
     * 创建时间
     */


    @Schema(description = "创建时间")
    private Date createdAt;

    /**
     * Key 作用域类型（tenant/platform）
     */


    @Schema(description = "Key 作用域类型（tenant/platform）")
    private String scopeType;

    /**
     * scope id
     */


    @Schema(description = "scope id")
    private String scopeId;
}