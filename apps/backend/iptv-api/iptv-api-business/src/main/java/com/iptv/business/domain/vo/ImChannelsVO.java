package com.iptv.business.domain.vo;

import com.iptv.business.domain.CustomAgents;
import com.iptv.business.domain.KnowledgeBases;
import com.iptv.business.domain.Tenants;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;
import java.io.Serializable;
import java.util.Date;

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
    @Serial
    private static final long serialVersionUID = -8635679685551858486L;

    @Schema(description = "主键 ID")
    private String id;

    @Schema(description = "所属工作空间（租户）ID")
    private Integer tenantId;

    @Schema(description = "租户")
    private Tenants tenant;

    @Schema(description = "智能体 ID")
    private String agentId;

    @Schema(description = "智能体")
    private CustomAgents agent;

    @Schema(description = "平台标识")
    private String platform;

    @Schema(description = "IM 渠道展示名称")
    private String name;

    @Schema(description = "是否启用该 IM 渠道")
    private Boolean enabled;

    @Schema(description = "连接/工作模式")
    private String mode;

    @Schema(description = "输出模式（如 stream）")
    private String outputMode;

    @Schema(description = "凭证配置（JSON，通常加密）")
    private String credentials;

    @Schema(description = "创建时间")
    private Date createdAt;

    @Schema(description = "最后更新时间")
    private Date updatedAt;

    @Schema(description = "软删除时间；非空表示已删除")
    private Date deletedAt;

    @Schema(description = "可选绑定的知识库")
    private String knowledgeBaseId;

    @Schema(description = "知识库")
    private KnowledgeBases knowledgeBase;

    @Schema(description = "机器人身份标识（非空时唯一）")
    private String botIdentity;

    @Schema(description = "会话模式（如按用户）")
    private String sessionMode;
}
