package com.iptv.business.domain.proxy;

import cn.hutool.json.JSONObject;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.util.Map;

/**
 * 代理请求对象
 */
@Data
public class ProxyDTO implements Serializable {
    @Serial
    private static final long serialVersionUID = 7818261422015521691L;

    @Schema(description = "目标URL（含Query参数）", requiredMode = Schema.RequiredMode.REQUIRED)
    private String url;

    @Schema(description = "请求方法（GET、POST、PUT、PATCH、DELETE、HEAD、OPTIONS）", requiredMode = Schema.RequiredMode.REQUIRED)
    private String method;

    @Schema(description = "请求头")
    private Map<String, String> headers;

    @Schema(description = "请求体内容")
    private String body;

    @Schema(description = "额外参数")
    private JSONObject extra;
}
