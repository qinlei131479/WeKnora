package com.iptv.v4.webscoket.config;

import jakarta.annotation.Resource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.standard.ServerEndpointExporter;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Resource
    private WebsocketHandshakeInterceptor websocketHandshakeInterceptor;
    @Resource
    private WebSocketServer webSocketServer;

    /**
     * 注入ServerEndpointExporter，
     * 这个bean会自动注册使用了@ServerEndpoint注解声明的Websocket endpoint
     */
    @Bean
    public ServerEndpointExporter serverEndpointExporter() {
        return new ServerEndpointExporter();
    }


    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry
                .addHandler(webSocketServer, "/websocket")
                .addInterceptors(websocketHandshakeInterceptor)
                .setAllowedOrigins("*")
        ;
    }

    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        // 设置默认会话空闲超时 以毫秒为单位 非正值意味着无限超时，默认值 0 ，默认没10s检查一次空闲就关闭
        container.setMaxSessionIdleTimeout(1800 * 1000L);
        // 设置异步发送消息的默认超时时间 以毫秒为单位 非正值意味着无限超时 ，默认值-1，还没看到作用
        container.setAsyncSendTimeout(100 * 1000L);
        // 设置文本消息的默认最大缓冲区大小 以字符为单位，默认值 8 * 1024
        container.setMaxTextMessageBufferSize(80 * 1024);
        // 设置二进制消息的默认最大缓冲区大小 以字节为单位，默认值 8 * 1024
        container.setMaxBinaryMessageBufferSize(80 * 1024);
        return container;
    }

}