package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 模型测试结果 VO
 *
 * @author kjsc
 * @since 2026-08-19
 */
@Data
@Schema(description = "模型测试结果")
public class ModelTestResultVO {

    @Schema(description = "是否可用")
    private Boolean available;

    @Schema(description = "结果消息")
    private String message;

    @Schema(description = "向量维度（仅Embedding模型）")
    private Integer dimension;

    public ModelTestResultVO() {
    }

    public ModelTestResultVO(Boolean available, String message) {
        this.available = available;
        this.message = message;
    }

    public ModelTestResultVO(Boolean available, String message, Integer dimension) {
        this.available = available;
        this.message = message;
        this.dimension = dimension;
    }
}
