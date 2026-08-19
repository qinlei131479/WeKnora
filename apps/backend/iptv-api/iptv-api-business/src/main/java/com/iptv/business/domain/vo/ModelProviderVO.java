package com.iptv.business.domain.vo;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

import lombok.Data;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * <p>
 * 模型厂商信息 VO
 * </p>
 *
 * @author kjsc
 * @since 2026-08-19
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class ModelProviderVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 厂商标识
     */
    @Schema(description = "厂商标识")
    private String value;

    /**
     * 显示名称
     */
    @Schema(description = "显示名称")
    private String label;

    /**
     * 描述
     */
    @Schema(description = "描述")
    private String description;

    /**
     * 按模型类型区分的默认URL
     */
    @Schema(description = "默认URL")
    private Map<String, String> defaultUrls;

    /**
     * 支持的模型类型
     */
    @Schema(description = "支持的模型类型")
    private List<String> modelTypes;
}
