package com.iptv.gateway.handler;

import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.gateway.support.NotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import com.iptv.common.core.utils.MessageUtils;
import com.iptv.common.core.utils.ServletUtils;
import reactor.core.publisher.Mono;

/**
 * 网关统一异常处理
 *
 * @author tanjx
 * @date 2026-08-05
 */
@Order(-1)
@Configuration
@RequiredArgsConstructor
public class GatewayExceptionHandler implements ErrorWebExceptionHandler
{
    private static final Logger log = LoggerFactory.getLogger(GatewayExceptionHandler.class);

    private static final String SERVICE_NOT_FOUND_KEY = "gateway.error.not.found";

    private static final String INTERNAL_ERROR_KEY = "gateway.error.internal";

    private final MessageSource messageSource;

    /**
     * 根据异常类型写入对应语言的网关错误响应。
     *
     * @param exchange 当前网关请求交换对象
     * @param ex 待处理异常
     * @return 响应写入完成信号
     */
    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex)
    {
        ServerHttpResponse response = exchange.getResponse();

        if (exchange.getResponse().isCommitted())
        {
            return Mono.error(ex);
        }

        String msg;
        Locale locale = resolveLocale(exchange);

        if (ex instanceof NotFoundException)
        {
            msg = messageSource.getMessage(SERVICE_NOT_FOUND_KEY, null, locale);
        }
        else if (ex instanceof ResponseStatusException)
        {
            ResponseStatusException responseStatusException = (ResponseStatusException) ex;
            msg = responseStatusException.getMessage();
        }
        else
        {
            msg = messageSource.getMessage(INTERNAL_ERROR_KEY, null, locale);
        }

        log.error("[网关异常处理]请求路径:{},异常信息:{}", exchange.getRequest().getPath(), ex.getMessage());

        return ServletUtils.webFluxResponseWriter(response, msg);
    }

    /**
     * 从 Accept-Language 请求头选择受支持的语言。
     *
     * @param exchange 当前网关请求交换对象
     * @return 受支持的请求语言，无法解析时返回简体中文
     */
    private Locale resolveLocale(ServerWebExchange exchange)
    {
        return MessageUtils.resolveLocale(
                exchange.getRequest().getHeaders().getFirst(HttpHeaders.ACCEPT_LANGUAGE));
    }
}