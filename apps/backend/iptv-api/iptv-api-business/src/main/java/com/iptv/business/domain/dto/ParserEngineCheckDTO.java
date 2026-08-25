package com.iptv.business.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 解析引擎配置检测请求DTO（与Go ParserEngineConfig结构对应）
 *
 * @author kjsc
 * @since 2026-08-25
 */
@Data
@Schema(description = "解析引擎配置（用于可用性检测）")
public class ParserEngineCheckDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "MinerU 自建服务端点")
    private String mineruEndpoint;

    @Schema(description = "MinerU 云 API Key")
    private String mineruApiKey;

    @Schema(description = "MinerU backend: pipeline, vlm-*, hybrid-*")
    private String mineruModel;

    @Schema(description = "vLLM 服务器地址")
    private String mineruVlmServerUrl;

    @Schema(description = "MinerU 是否启用公式解析")
    private Boolean mineruEnableFormula;

    @Schema(description = "MinerU 是否启用表格解析")
    private Boolean mineruEnableTable;

    @Schema(description = "MinerU 解析方法: auto/ocr/txt")
    private String mineruParseMethod;

    @Schema(description = "MinerU 是否启用OCR（兼容旧配置）")
    private Boolean mineruEnableOcr;

    @Schema(description = "MinerU 语言")
    private String mineruLanguage;

    @Schema(description = "MinerU 云 model_version: pipeline, vlm, MinerU-HTML")
    private String mineruCloudModel;

    @Schema(description = "MinerU 云是否启用公式解析")
    private Boolean mineruCloudEnableFormula;

    @Schema(description = "MinerU 云是否启用表格解析")
    private Boolean mineruCloudEnableTable;

    @Schema(description = "MinerU 云是否启用OCR")
    private Boolean mineruCloudEnableOcr;

    @Schema(description = "MinerU 云语言")
    private String mineruCloudLanguage;

    @Schema(description = "ODL hybrid模式: off, docling-fast, hancom-ai")
    private String odlHybrid;

    @Schema(description = "ODL hybrid服务URL")
    private String odlHybridUrl;

    @Schema(description = "ODL hybrid模式: auto, full")
    private String odlHybridMode;

    @Schema(description = "ODL hybrid是否启用回退")
    private Boolean odlHybridFallback;

    @Schema(description = "ODL Markdown是否包含HTML")
    private Boolean odlMarkdownWithHtml;

    @Schema(description = "PaddleOCR-VL 自建服务端点")
    private String paddleocrVlEndpoint;

    @Schema(description = "PaddleOCR-VL 是否启用印章识别")
    private Boolean paddleocrVlUseSealRecognition;

    @Schema(description = "PaddleOCR-VL 是否启用图表识别")
    private Boolean paddleocrVlUseChartRecognition;

    @Schema(description = "PaddleOCR-VL Cloud Token")
    private String paddleocrVlCloudToken;

    @Schema(description = "PaddleOCR-VL Cloud 模型")
    private String paddleocrVlCloudModel;

    @Schema(description = "PaddleOCR-VL Cloud 是否启用印章识别")
    private Boolean paddleocrVlCloudUseSealRecognition;

    @Schema(description = "PaddleOCR-VL Cloud 是否启用图表识别")
    private Boolean paddleocrVlCloudUseChartRecognition;
}
