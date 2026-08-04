package com.iptv.v4.webscoket.config;

import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import com.iptv.common.core.constant.TokenConstants;
import com.iptv.common.security.service.TokenService;
import com.iptv.system.api.model.LoginUser;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Slf4j
@Component
public class WebsocketHandshakeInterceptor implements HandshakeInterceptor {

    private static final String SEC_WEB_SOCKET_PROTOCOL = "Sec-WebSocket-Protocol";

    @Resource
    private TokenService tokenService;

    /**
     * 握手之前，若返回false，则不建立链接 *
     *
     * @param request
     * @param response
     * @param wsHandler
     * @param attributes
     * @return
     */
    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse
            response, WebSocketHandler wsHandler, Map<String, Object> attributes) {
        String authorization = request.getHeaders().getFirst(SEC_WEB_SOCKET_PROTOCOL);
        log.info("收到握手请求，开始鉴权…… -> {},token={}", request.getURI(), authorization);
        boolean authSuccess = false;
        try {
            if (StrUtil.isNotBlank(authorization)) {
                if (StrUtil.startWith(authorization, TokenConstants.PREFIX)) {
                    authorization = StrUtil.replace(authorization, TokenConstants.PREFIX, "");
                }
                LoginUser loginUser = tokenService.getLoginUser(authorization);
                authSuccess = ObjectUtil.isNotNull(loginUser);
            }
        } catch (Exception e) {
            log.error("鉴权失败！ -> {} token:->{}", request.getURI(), String.join(",", authorization), e);
        }
        if (!authSuccess) {
            log.error("鉴权不通过！ -> {} token:->{}", request.getURI(), String.join(",", authorization));
        }
        attributes.put("token", authorization);
        return authSuccess;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse
            response, WebSocketHandler wsHandler, Exception exception) {
        // 获取 Servlet 的 HttpServletRequest 和 HttpServletResponse 对象
        // httpRequest 可以获取 HTTP协议升级前 请求报文的信息，如 header中的键值对等
        // httpResponse 可以设置 HTTP响应 的相关信息，如状态码、ContentType、header信息等
        HttpServletRequest httpRequest = ((ServletServerHttpRequest) request).getServletRequest();
        HttpServletResponse httpResponse = ((ServletServerHttpResponse) response).getServletResponse();
        if (httpRequest.getHeader(SEC_WEB_SOCKET_PROTOCOL) != null) {
            httpResponse.addHeader(SEC_WEB_SOCKET_PROTOCOL, httpRequest.getHeader(SEC_WEB_SOCKET_PROTOCOL));
        }
        log.info("鉴权成功，完成握手！-> {}", request.getURI());
    }

}
