package com.iptv.system.api.domain.dto;

import com.baomidou.mybatisplus.annotation.FieldStrategy;
import com.baomidou.mybatisplus.annotation.TableField;
import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serializable;
import java.util.Date;

/**
 * 租户更新请求 DTO
 */
@Data
@Schema(description = "租户更新请求")
public class SysTenantSaveDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "租户ID")
    private Long id;

    @Schema(description = "租户名称")
    private String name;

    @Schema(description = "父级租户ID")
    private Long parentId;

    @Schema(description = "省")
    private String provinceCode;

    @Schema(description = "市")
    private String cityCode;

    @Schema(description = "区")
    private String areaCode;

    @Schema(description = "用户最大数量")
    private int userMaxCount;

    @Schema(description = "有效期")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date validTime;

    @Schema(description = "第三方租户id")
    private String thirdTenantId;

    @Schema(description = "租户类型编码")
    private String thirdTenantType;

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
