package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.Map;

/**
 * 凭证响应VO
 * 用于 PUT/DELETE /{id}/credentials 接口响应
 *
 * @author kjsc
 * @since 2026-08-17
 */
@Data
@Schema(description = "凭证响应")
public class CredentialsResponseVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 按字段名索引的配置状态Map
     * 例如: {"api_key": {"configured": true}}
     */
    @Schema(description = "凭证字段配置状态")
    private Map<String, CredentialFieldMetadataVO> fields;
}
