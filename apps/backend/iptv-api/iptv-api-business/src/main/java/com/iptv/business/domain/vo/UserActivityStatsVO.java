package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

/**
 * 用户活跃度统计VO
 */
@Data
public class UserActivityStatsVO implements Serializable {
    @Serial
    private static final long serialVersionUID = -7886589482809925435L;

    @Schema(description = "总用户数")
    private Long totalUsers;

    @Schema(description = "最近24小时活跃用户数")
    private Long activeUsers24h;

    @Schema(description = "最近30天活跃用户数")
    private Long activeUsers30d;

    @Schema(description = "最近7天每日活跃用户数")
    private List<DailyActiveUser> dailyActiveUsers;


    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DailyActiveUser implements Serializable {
        @Serial
        private static final long serialVersionUID = 557367334204586148L;

        @Schema(description = "日期 yyyy-MM-dd")
        private String date;

        @Schema(description = "活跃用户数")
        private Long activeUsers;
    }
}
