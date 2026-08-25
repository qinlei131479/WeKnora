package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * 解析引擎列表响应 VO
 *
 * @author kjsc
 * @since 2026-08-25
 */
@Data
@Schema(description = "解析引擎列表响应")
public class ParserEnginesVO {

    @Schema(description = "解析引擎列表")
    private List<ParserEngineInfoVO> engines;

    @Schema(description = "DocReader 服务地址")
    private String docreaderAddr;

    @Schema(description = "DocReader 传输协议")
    private String docreaderTransport;

    @Schema(description = "DocReader 是否已连接")
    private Boolean connected;
}
