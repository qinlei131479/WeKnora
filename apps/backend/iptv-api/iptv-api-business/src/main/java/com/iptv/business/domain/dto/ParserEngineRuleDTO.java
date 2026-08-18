package com.iptv.business.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 解析引擎规则DTO
 *
 * @author kjsc
 * @since 2026-08-13
 */
@Data
@Schema(description = "解析引擎规则")
public class ParserEngineRuleDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "文件类型列表")
    private List<String> fileTypes;

    @Schema(description = "解析引擎")
    private String engine;
}
