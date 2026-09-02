package com.iptv.business.domain.dto.page;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;
import java.io.Serializable;
import java.util.Date;

/**
 * <p>
 * Web 嵌入渠道：发布令牌、来源白名单、限流与 UI 配置
 * </p>
 *
 * @author kjsc
 * @since 2026-09-02
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class EmbedChannelsPageDTO implements Serializable {
    @Serial
    private static final long serialVersionUID = -4076313509766136829L;

    @Schema(description = "主键 ID")
    private String id;

    @Schema(description = "所属工作空间（租户）ID")
    private Long tenantId;

    @Schema(description = "智能体 ID")
    private String agentId;

    @Schema(description = "嵌入渠道名称")
    private String name;

    @Schema(description = "是否启用该嵌入渠道")
    private Boolean enabled;

    @Schema(description = "嵌入发布令牌（机密）")
    private String publishToken;

    @Schema(description = "允许的来源 Origin 列表/模式")
    private String allowedOrigins;

    @Schema(description = "嵌入页欢迎语")
    private String welcomeMessage;

    @Schema(description = "每分钟速率限制")
    private Integer rateLimitPerMinute;

    @Schema(description = "每日速率限制")
    private Integer rateLimitPerDay;

    @Schema(description = "主题主色")
    private String primaryColor;

    @Schema(description = "页面标题")
    private String pageTitle;

    @Schema(description = "页头标题展示模式")
    private String headerTitleMode;

    @Schema(description = "是否展示建议问题")
    private Boolean showSuggestedQuestions;

    @Schema(description = "嵌入挂件位置")
    private String widgetPosition;

    @Schema(description = "是否允许联网搜索")
    private Boolean allowWebSearch;

    @Schema(description = "When true, embed chat may use agent memory; client cannot override when false")
    private Boolean allowMemory;

    @Schema(description = "是否允许上传文件")
    private Boolean allowFileUpload;

    @Schema(description = "默认语言区域")
    private String defaultLocale;

    @Schema(description = "Webhook 回调地址")
    private String webhookUrl;

    @Schema(description = "Webhook 签名密钥")
    private String webhookSecret;

    @Schema(description = "创建时间")
    private Date createdAt;

    @Schema(description = "最后更新时间")
    private Date updatedAt;

    @Schema(description = "软删除时间；非空表示已删除")
    private Date deletedAt;
}
