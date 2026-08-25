package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;
import java.io.Serializable;
import java.util.Date;

/**
 * <p>
 * 对话会话：归属用户、置顶、最近一次提问栏状态（agent_config 列）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-25
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class SessionsVO implements Serializable {
    @Serial
    private static final long serialVersionUID = -7228861524050561496L;

    @Schema(description = "主键 ID")
    private String id;

    @Schema(description = "所属工作空间（租户）ID")
    private Integer tenantId;

    @Schema(description = "所属工作空间（租户）")
    private String tenantName;

    @Schema(description = "会话标题")
    private String title;

    @Schema(description = "会话描述")
    private String description;

    @Schema(description = "知识库 ID")
    private String knowledgeBaseId;

    @Schema(description = "会话最大轮次限制")
    private Integer maxRounds;

    @Schema(description = "是否启用查询改写")
    private Boolean enableRewrite;

    @Schema(description = "无命中时的兜底策略")
    private String fallbackStrategy;

    @Schema(description = "兜底回复文案")
    private String fallbackResponse;

    @Schema(description = "关键词检索分数阈值")
    private Double keywordThreshold;

    @Schema(description = "向量检索分数阈值")
    private Double vectorThreshold;

    @Schema(description = "重排模型 ID")
    private String rerankModelId;

    @Schema(description = "向量检索返回条数 TopK")
    private Integer embeddingTopK;

    @Schema(description = "重排后保留条数 TopK")
    private Integer rerankTopK;

    @Schema(description = "重排分数阈值")
    private Double rerankThreshold;

    @Schema(description = "摘要模型 ID")
    private String summaryModelId;

    @Schema(description = "摘要相关参数（JSON）")
    private String summaryParameters;

    @Schema(description = "最近一次提问栏状态（选用的智能体/模型/知识范围/联网/MCP 等）；历史列名")
    private String agentConfig;

    @Schema(description = "全局上下文管理配置（会话默认）")
    private String contextConfig;

    @Schema(description = "创建时间")
    private Date createdAt;

    @Schema(description = "最后更新时间")
    private Date updatedAt;

    @Schema(description = "软删除时间；非空表示已删除")
    private Date deletedAt;

    @Schema(description = "智能体 ID")
    private String agentId;

    @Schema(description = "会话归属主体（WeKnora 用户 UUID、API 外部用户或嵌入访客等）")
    private String userId;

    @Schema(description = "会话归属主体（WeKnora 用户 UUID、API 外部用户或嵌入访客等）用户名")
    private String username;

    @Schema(description = "is pinned")
    private Boolean isPinned;

    @Schema(description = "pinned at")
    private Date pinnedAt;
}
