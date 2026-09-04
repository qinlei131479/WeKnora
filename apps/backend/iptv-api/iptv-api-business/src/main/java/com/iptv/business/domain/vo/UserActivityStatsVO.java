package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 用户活跃度统计VO
 */
@Data
public class UserActivityStatsVO implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 总用户数
     */
    @Schema(description = "总用户数")
    private Integer totalUsers;
    /**
     * 最近24小时活跃用户数
     */
    @Schema(description = "最近24小时活跃用户数")
    private Integer activeUsers24h;

    /**
     * 最近30天活跃用户数
     */
    @Schema(description = "最近30天活跃用户数")
    private Integer activeUsers30d;

    /**
     * 最近7天每日活跃用户数
     */
    @Schema(description = "最近7天每日活跃用户数")
    private Integer dailyActiveUsers;
}
