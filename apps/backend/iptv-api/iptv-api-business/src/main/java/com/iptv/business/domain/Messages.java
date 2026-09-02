package com.iptv.business.domain;

import java.util.Date;
import java.io.Serializable;

import com.baomidou.mybatisplus.annotation.IdType;
import com.iptv.common.core.typehandler.JsonbTypeHandler;
import lombok.Data;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;



/**
 * <p>
 * 会话消息：角色内容、知识引用、Agent 步骤、附件与执行上下文
 * </p>
 *
 * @author kjsc
 * @since 2026-08-25
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class Messages implements java.io.Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键 ID
     */

    @TableId(type = IdType.ASSIGN_UUID)
    @Schema(description = "主键 ID")
    private String id;

    /**
     * 请求追踪 ID
     */


    @Schema(description = "请求追踪 ID")
    private String requestId;

    /**
     * 会话 ID
     */


    @Schema(description = "会话 ID")
    private String sessionId;

    /**
     * 消息角色：user/assistant/system
     */


    @Schema(description = "消息角色：user/assistant/system")
    private String role;

    /**
     * 正文内容
     */


    @Schema(description = "正文内容")
    private String content;

    /**
     * 回答引用的知识分块
     */

    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "回答引用的知识分块")
    private String knowledgeReferences;

    /**
     * Agent 执行步骤（仅展示，不进 LLM 上下文）
     */

    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "Agent 执行步骤（仅展示，不进 LLM 上下文）")
    private String agentSteps;

    /**
     * 是否已完成生成
     */


    @Schema(description = "是否已完成生成")
    private Boolean isCompleted;

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

    /**
     * 用户 @ 提及的知识库/文件
     */

    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "用户 @ 提及的知识库/文件")
    private String mentionedItems;

    /**
     * 是否为无知识命中时的兜底回复
     */


    @Schema(description = "是否为无知识命中时的兜底回复")
    private Boolean isFallback;

    /**
     * Agent 执行耗时（毫秒）
     */


    @Schema(description = "Agent 执行耗时（毫秒）")
    private Long agentDurationMs;

    /**
     * 知识条目 ID
     */


    @Schema(description = "知识条目 ID")
    private String knowledgeId;

    /**
     * 用户消息附带图片及 OCR/描述
     */

    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "用户消息附带图片及 OCR/描述")
    private String images;

    /**
     * 来源渠道（web/api/im 等）
     */


    @Schema(description = "来源渠道（web/api/im 等）")
    private String channel;

    /**
     * 送入 LLM 的完整 RAG 增强用户消息
     */


    @Schema(description = "送入 LLM 的完整 RAG 增强用户消息")
    private String renderedContent;

    /**
     * 用户消息附件
     */

    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "用户消息附件")
    private String attachments;

    /**
     * 智能体 ID
     */


    @Schema(description = "智能体 ID")
    private String agentId;

    /**
     * agent tenant id
     */


    @Schema(description = "agent tenant id")
    private Integer agentTenantId;

    /**
     * model id
     */


    @Schema(description = "model id")
    private String modelId;

    /**
     * execution context
     */

    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "execution context")
    private String executionContext;
}