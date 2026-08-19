package com.iptv.business.domain.vo;

import lombok.Data;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;
import java.util.Map;

/**
 * <p>
 * 模型调试结果 VO
 * </p>
 *
 * @author kjsc
 * @since 2026-08-19
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Schema(description = "模型调试结果")
public class ModelDebugVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 请求预览（脱敏后的参数）
     */
    @Schema(description = "请求预览")
    private Map<String, Object> requestPreview;

    /**
     * 耗时（毫秒）
     */
    @Schema(description = "耗时（毫秒）")
    private Long elapsedMs;

    /**
     * 响应内容
     */
    @Schema(description = "响应内容")
    private Object response;

    /**
     * 错误信息
     */
    @Schema(description = "错误信息")
    private String error;

    /**
     * 观察指标
     */
    @Schema(description = "观察指标")
    private Map<String, Object> observations;
}
