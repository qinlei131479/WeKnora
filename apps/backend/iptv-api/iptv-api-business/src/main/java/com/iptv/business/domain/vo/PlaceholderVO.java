package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 占位符VO
 *
 * @author kjsc
 * @since 2026-08-13
 */
@Data
@Schema(description = "占位符定义")
public class PlaceholderVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "占位符名称")
    private String name;

    @Schema(description = "占位符短标签")
    private String label;

    @Schema(description = "占位符描述")
    private String description;
}
