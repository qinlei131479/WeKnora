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
public class DashboardUserActiveStatsVO implements Serializable {
    @Serial
    private static final long serialVersionUID = 2453695546746899710L;

    @Schema(description = "总用户数")
    private Long totalUsers;

    @Schema(description = "最近24小时活跃用户数")
    private Long activeUsers24h;

    @Schema(description = "最近30天活跃用户数")
    private Long activeUsers30d;

    @Schema(description = "最近7天每日活跃用户数")
    private List<DailyActiveUser> dailyActiveUsers;

    @Schema(description = "最近30天活跃用户列表")
    private List<ActiveUser> activeUsers;


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


    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ActiveUser implements Serializable {
        @Serial
        private static final long serialVersionUID = 8614945106199618266L;

        @Schema(description = "活跃度 COUNT")
        private Integer score;

        @Schema(description = "用户ID")
        private String id;

        @Schema(description = "用户名")
        private String username;

        @Schema(description = "登录邮箱")
        private String email;

        @Schema(description = "头像/图标")
        private String avatar;

        @Schema(description = "租户ID")
        private Integer tenantId;
    }
}
