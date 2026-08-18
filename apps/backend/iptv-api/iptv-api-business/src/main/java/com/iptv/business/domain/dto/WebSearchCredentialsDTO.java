package com.iptv.business.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 网络搜索提供商凭证DTO
 * 用于 PUT /{id}/credentials 接口
 *
 * @author kjsc
 * @since 2026-08-17
 */
@Data
@Schema(description = "网络搜索提供商凭证")
public class WebSearchCredentialsDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 搜索提供商配置ID
     */
    @Schema(description = "搜索提供商配置ID")
    private String id;

    /**
     * API密钥（可选，不传则仅查询配置状态）
     */
    @Schema(description = "API密钥（可选，不传则仅查询配置状态）")
    private String apiKey;
}
