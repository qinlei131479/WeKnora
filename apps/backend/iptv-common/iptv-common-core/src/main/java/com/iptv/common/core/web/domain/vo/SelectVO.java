package com.iptv.common.core.web.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 通用下拉选项 VO
 */
@Data
@Schema(description = "通用下拉选项")
public class SelectVO<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "标签")
    private String label;

    @Schema(description = "值")
    private T value;
}
