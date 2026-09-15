package com.iptv.business.domain.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.util.Date;

/**
 * 最近对话消息VO
 */
@Data
public class DashboardConversationVO implements Serializable {
    @Serial
    private static final long serialVersionUID = 4098317578514862909L;

    @Schema(description = "对话ID")
    private String id;

    @Schema(description = "对话标题")
    private String title;

    @Schema(description = "智能体ID")
    private String agentId;

    @Schema(description = "智能体名称")
    private String agentName;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "更新时间")
    private Date updatedAt;
}
