package com.iptv.system.api.domain;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.iptv.common.core.web.domain.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.format.annotation.DateTimeFormat;

import java.util.Date;

/**
 * 租户实体 sys_tenant
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Schema(description = "租户")
public class SysTenant extends BaseEntity {

    private static final long serialVersionUID = 1L;

    public static final String ANCESTORS_SEP = ",";

    @Schema(description = "租户ID")
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @Schema(description = "租户名称")
    private String name;

    @Schema(description = "状态(0正常 1停用)")
    private String status;

    @Schema(description = "租户代码")
    private String code;

    @Schema(description = "删除标志(0存在 1删除)")
    @TableLogic(value = "0", delval = "1")
    private String delFlag;

    @Schema(description = "父级租户ID")
    private Long parentId;

    @Schema(description = "祖先ID路径")
    private String ancestors;

    @Schema(description = "省")
    private String provinceCode;

    @Schema(description = "市")
    private String cityCode;

    @Schema(description = "区")
    private String areaCode;

    @Schema(description = "用户最大数量")
    private int userMaxCount;

    @Schema(description = "租户有效期")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date validTime;

    @Schema(description = "第三方租户id")
    private String thirdTenantId;

    @Schema(description = "租户类型编码(0内部 1第三方)")
    private String thirdTenantType;

    @Schema(description = "最大调用次数")
    private Long maxCallTimes;

    @Schema(description = "每秒调用上限")
    private Integer qps;

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
}
