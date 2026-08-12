package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 检查远程模型结果 VO
 *
 * @author kjsc
 * @since 2026-08-12
 */
@Data
@Schema(description = "检查远程模型结果")
public class OllamaCheckRemoteModelVO {

    @Schema(description = "是否成功")
    private Boolean success;

    @Schema(description = "消息")
    private String message;
}
