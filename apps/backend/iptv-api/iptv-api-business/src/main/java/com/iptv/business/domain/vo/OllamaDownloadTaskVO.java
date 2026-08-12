package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Ollama 下载任务 VO
 *
 * @author kjsc
 * @since 2026-08-12
 */
@Data
@Schema(description = "Ollama 下载任务")
public class OllamaDownloadTaskVO {

    @Schema(description = "任务 ID")
    private String id;

    @Schema(description = "模型名称")
    private String modelName;

    @Schema(description = "任务状态")
    private String status;

    @Schema(description = "下载进度（0-100）")
    private Double progress;

    @Schema(description = "状态消息")
    private String message;

    @Schema(description = "开始时间")
    private LocalDateTime startTime;

    @Schema(description = "结束时间")
    private LocalDateTime endTime;
}
