package com.iptv.business.domain.dto.page;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;
import java.io.Serializable;

/**
 * <p>
 * Harness 内置工具只读目录，用于统一预览、依赖解析和统计
 * </p>
 *
 * @author kjsc
 * @since 2026-09-21
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class AmpBuiltinToolsPageDTO implements Serializable {
    @Serial
    private static final long serialVersionUID = -6685631835655096073L;

    @Schema(description = "查询关键字")
    private String keyword;

    @Schema(description = "工具分类")
    private String category;
}
