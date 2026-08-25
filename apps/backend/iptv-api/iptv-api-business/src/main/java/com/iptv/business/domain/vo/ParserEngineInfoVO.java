package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * 解析引擎信息 VO
 *
 * @author kjsc
 * @since 2026-08-25
 */
@Data
@Schema(description = "解析引擎信息")
public class ParserEngineInfoVO {

    @Schema(description = "引擎名称")
    private String name;

    @Schema(description = "引擎描述")
    private String description;

    @Schema(description = "支持的文件类型")
    private List<String> fileTypes;

    @Schema(description = "是否可用")
    private Boolean available;

    @Schema(description = "不可用原因")
    private String unavailableReason;
}
