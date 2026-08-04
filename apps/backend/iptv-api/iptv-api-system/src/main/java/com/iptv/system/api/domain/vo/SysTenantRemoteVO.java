package com.iptv.system.api.domain.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serializable;
import java.util.Date;

/**
 * 租户跨服务传输 VO
 */
@Data
@Schema(description = "租户远程VO")
public class SysTenantRemoteVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "租户ID")
    private Long id;

    @Schema(description = "租户名称")
    private String name;

    @Schema(description = "状态(0正常 1停用)")
    private String status;

    @Schema(description = "租户代码")
    private String code;

    @Schema(description = "删除标志")
    private String delFlag;

    @Schema(description = "父级租户ID")
    private Long parentId;

    @Schema(description = "祖先追溯字段")
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

    @Schema(description = "租户类型编码")
    private String thirdTenantType;
}
