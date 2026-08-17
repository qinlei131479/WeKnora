package com.iptv.common.core.i18n;

import com.iptv.common.core.utils.MessageUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.web.servlet.LocaleResolver;

import java.util.Locale;

/**
 * 从 Accept-Language 请求头解析受支持的语言。
 *
 * @author tanjx
 * @date 2026-08-05
 */
public class HeaderLocaleResolver implements LocaleResolver {
    /**
     * 按客户端优先级选择受支持的语言，缺省或无法识别时使用简体中文。
     *
     * @param request HTTP 请求
     * @return 解析后的语言
     */
    @Override
    public Locale resolveLocale(HttpServletRequest request) {
        return MessageUtils.resolveLocale(request.getHeader(HttpHeaders.ACCEPT_LANGUAGE));
    }

    /**
     * 请求语言只由 Accept-Language 决定，不支持服务端修改。
     *
     * @param request  HTTP 请求
     * @param response HTTP 响应
     * @param locale   待设置语言
     */
    @Override
    public void setLocale(HttpServletRequest request, HttpServletResponse response, Locale locale) {
        throw new UnsupportedOperationException("HeaderLocaleResolver does not support setLocale");
    }
}
