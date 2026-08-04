package com.iptv.system.api.domain.vo;

import com.baomidou.mybatisplus.annotation.FieldStrategy;
import com.baomidou.mybatisplus.annotation.TableField;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.iptv.common.core.web.domain.vo.BaseVO;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.format.annotation.DateTimeFormat;

import java.util.Date;
import java.util.List;

/**
 * 租户列表/详情 VO
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Schema(description = "租户VO")
public class SysTenantVO extends BaseVO {

    private static final long serialVersionUID = 1L;

    @Schema(description = "租户ID")
    private Long id;

    @Schema(description = "租户代码")
    private String code;

    @Schema(description = "租户名称")
    private String name;

    @Schema(description = "绑定用户数量")
    private Integer userCount;

    @Schema(description = "绑定角色数量")
    private Integer userRoleCount;

    @Schema(description = "状态(0正常 1停用)")
    private String status;

    @Schema(description = "父级租户ID")
    private Long parentId;

    @Schema(description = "区域名")
    private String areaName;

    @Schema(description = "子集")
    private List<SysTenantVO> children;

    @Schema(description = "租户有效期")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date validTime;

    @Schema(description = "第三方租户id")
    private String thirdTenantId;

    @Schema(description = "租户类型编码")
    private String thirdTenantType;

    @Schema(description = "最大调用次数")
    private Long maxCallTimes;

    @Schema(description = "每秒调用上限")
    private Integer qps;

    @Schema(description = "平台租户标志(0是 1否)")
    private Integer platformTenant;

    @Schema(description = "审核服务提供商")
    private String auditServiceProvider;

    @TableField(updateStrategy = FieldStrategy.IGNORED)
    @Schema(description = "审核服务有效期-开始")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date auditServiceValidityStart;

    @TableField(updateStrategy = FieldStrategy.IGNORED)
    @Schema(description = "审核服务有效期-结束")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date auditServiceValidityEnd;

    public static boolean isPlatformTenant(Long tenantId) {
        return tenantId != null && 1 == tenantId;
    }
}
