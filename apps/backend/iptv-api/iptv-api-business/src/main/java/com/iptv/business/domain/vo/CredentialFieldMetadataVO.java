package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 凭证字段元数据VO
 * 表示单个凭证字段的配置状态（脱敏，不暴露实际值）
 *
 * @author kjsc
 * @since 2026-08-17
 */
@Data
@Schema(description = "凭证字段元数据")
public class CredentialFieldMetadataVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 该字段是否已配置
     */
    @Schema(description = "该字段是否已配置")
    private Boolean configured;

    public CredentialFieldMetadataVO() {
    }

    public CredentialFieldMetadataVO(Boolean configured) {
        this.configured = configured;
    }
}
