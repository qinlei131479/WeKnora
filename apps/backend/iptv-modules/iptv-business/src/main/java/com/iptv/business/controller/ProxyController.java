package com.iptv.business.controller;

import cn.hutool.core.map.MapUtil;
import cn.hutool.core.util.ObjUtil;
import cn.hutool.core.util.StrUtil;
import com.iptv.business.domain.proxy.ProxyDTO;
import com.iptv.common.core.exception.ServiceException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import okhttp3.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@Tag(name = "前端请求代理控制器", description = "前端请求代理控制器")
@RestController
@RequestMapping("/proxy")
public class ProxyController {

    private final OkHttpClient client = new OkHttpClient.Builder()
            .connectTimeout(10L, TimeUnit.SECONDS) // 连接超时
            .readTimeout(10L, TimeUnit.MINUTES)    // 读取超时
            .writeTimeout(30L, TimeUnit.SECONDS)   // 写入超时
            .callTimeout(10L, TimeUnit.MINUTES)    // 整个请求超时，OkHttp 3.12+ 支持
            .build();


    @Operation(description = "非流式")
    @PostMapping("/request/non-stream")
    public ResponseEntity<String> proxyNonStream(
            @org.springframework.web.bind.annotation.RequestBody ProxyDTO dto
    ) {
        RequestBody requestBody = "GET".equals(dto.getMethod()) || "HEAD".equals(dto.getMethod())
                ? null :
                RequestBody.create(
                        StrUtil.isBlank(dto.getBody()) ? "" : dto.getBody(),
                        resolveMediaType(dto.getHeaders())
                );
        Request.Builder requestBuilder = new Request.Builder()
                .url(dto.getUrl())
                .method(dto.getMethod(), requestBody);

        if (MapUtil.isNotEmpty(dto.getHeaders())) {
            dto.getHeaders().forEach(requestBuilder::addHeader);
        }
 

        try (Response response = client.newCall(requestBuilder.build()).execute()) {
            String responseBody = ObjUtil.isNull(response.body()) ? "" : response.body().string();

            HttpHeaders responseHeaders = new HttpHeaders();
            String contentType = response.header(HttpHeaders.CONTENT_TYPE);
            if (StrUtil.isNotBlank(contentType)) {
                responseHeaders.add(HttpHeaders.CONTENT_TYPE, contentType);
            }

            return ResponseEntity
                    .status(response.code())
                    .headers(responseHeaders)
                    .body(responseBody);

        } catch (Exception ex) {
            throw new ServiceException(ex.getMessage());
        }
    }


    //---------- private method --------------------------------------------------------------------------


    private MediaType resolveMediaType(Map<String, String> headers) {
        MediaType defaultMediaType = MediaType.parse("application/json; charset=utf-8");

        if (MapUtil.isEmpty(headers)) {
            return defaultMediaType;
        }

        return headers.entrySet().stream()
                .filter(entry -> HttpHeaders.CONTENT_TYPE.equalsIgnoreCase(entry.getKey()))
                .map(Map.Entry::getValue)
                .filter(StrUtil::isNotEmpty)
                .findFirst()
                .map(MediaType::parse)
                .orElse(defaultMediaType);
    }
}
