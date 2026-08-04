package com.iptv.system.api.domain.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.iptv.common.core.web.domain.vo.BaseVO;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.format.annotation.DateTimeFormat;

import java.util.Date;

/**
 * 租户编辑回显 VO
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Schema(description = "租户编辑回显")
public class SysTenantEchoVO extends BaseVO {

    @Schema(description = "租户名称")
    private String tenantName;

    @Schema(description = "父租户id")
    private Long parentTenantId;

    @Schema(description = "租户id")
    private Long tenantId;

    @Schema(description = "父租户名称")
    private String parentTenantName;

    @Schema(description = "省code")
    private String provinceCode;

    @Schema(description = "省名称")
    private String provinceName;

    @Schema(description = "市code")
    private String cityCode;

    @Schema(description = "市名称")
    private String cityName;

    @Schema(description = "区code")
    private String areaCode;

    @Schema(description = "区名称")
    private String areaName;

    @Schema(description = "合并区域名称")
    private String concatName;

    @Schema(description = "用户最大数量")
    private String userMaxCount;

    @Schema(description = "有效期")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date validTime;

    @Schema(description = "第三方租户id")
    private String thirdTenantId;

    @Schema(description = "是否有子租户")
    private boolean hasChild;

    @Schema(description = "最大调用次数")
    private Long maxCallTimes;

    @Schema(description = "每秒调用上限")
    private Integer qps;
}
