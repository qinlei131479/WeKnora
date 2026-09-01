package com.iptv.business.domain.vo;

import java.io.Serializable;
import java.util.Date;
import java.io.Serializable;

import com.iptv.business.domain.CustomAgents;
import com.iptv.business.domain.KnowledgeBases;
import com.iptv.business.domain.Tenants;
import lombok.Data;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * <p>
 * IM 渠道：平台凭证、绑定智能体、会话模式与输出模式
 * </p>
 *
 * @author kjsc
 * @since 2026-09-01
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class ImChannelsVO implements Serializable {

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
    private Integer tenantId;

    /**
     * 租户信息
     */
    @Schema(description = "租户")
    private Tenants tenant;

    /**
     * 智能体 ID
     */
    @Schema(description = "智能体 ID")
    private String agentId;

    /**
     * 智能体信息
     */
    @Schema(description = "智能体")
    private CustomAgents agent;

    /**
     * 平台标识
     */
    @Schema(description = "平台标识")
    private String platform;

    /**
     * IM 渠道展示名称
     */
    @Schema(description = "IM 渠道展示名称")
    private String name;

    /**
     * 是否启用该 IM 渠道
     */
    @Schema(description = "是否启用该 IM 渠道")
    private Boolean enabled;

    /**
     * 连接/工作模式
     */
    @Schema(description = "连接/工作模式")
    private String mode;

    /**
     * 输出模式（如 stream）
     */
    @Schema(description = "输出模式（如 stream）")
    private String outputMode;

    /**
     * 凭证配置（JSON，通常加密）
     */
    @Schema(description = "凭证配置（JSON，通常加密）")
    private String credentials;

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
     * 可选绑定的知识库
     */
    @Schema(description = "可选绑定的知识库")
    private String knowledgeBaseId;

    /**
     * 知识库信息
     */
    @Schema(description = "知识库")
    private KnowledgeBases knowledgeBase;

    /**
     * 机器人身份标识（非空时唯一）
     */
    @Schema(description = "机器人身份标识（非空时唯一）")
    private String botIdentity;

    /**
     * 会话模式（如按用户）
     */
    @Schema(description = "会话模式（如按用户）")
    private String sessionMode;
}
