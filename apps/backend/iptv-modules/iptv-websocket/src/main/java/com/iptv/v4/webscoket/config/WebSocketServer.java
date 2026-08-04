package com.iptv.v4.webscoket.config;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson2.JSON;
import com.iptv.common.core.constant.TokenConstants;
import com.iptv.common.security.service.TokenService;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.AbstractWebSocketHandler;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;

import java.io.IOException;
import java.util.Collection;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * @author zhaojl
 */
@Slf4j
@ToString
@EqualsAndHashCode(callSuper = false)
@RestController
public class WebSocketServer extends AbstractWebSocketHandler {
    private static final long HEARTBEAT_INTERVAL = 5000;

    /**
     * 与某个客户端的连接会话，需要通过它来给客户端发送数据
     */
    private WebSocketSession session;

    /**
     * concurrent包的线程安全Set，用来存放每个客户端对应的MyWebSocket对象。
     * 虽然@Component默认是单例模式的，但springboot还是会为每个WebSocket连接初始化一个bean，所以可以用一个静态set保存起来。
     * 注：底下WebSocket是当前类名
     */
    private static CopyOnWriteArraySet<WebSocketServer> webSocketServers = new CopyOnWriteArraySet<>();
    /**
     * 用来存在线连接用户信息
     */
    private static ConcurrentHashMap<String, WebSocketSession> sessionPool = new ConcurrentHashMap<>();

    private final TokenService tokenService;

    @Autowired
    public WebSocketServer(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        try {
            webSocketServers.add(this);
            this.session = new ConcurrentWebSocketSessionDecorator(session, 10 * 1000, 64000);
            sessionPool.put(getToken(), this.session);
            log.info("ws: 有新的连接，当前连接总数为:{}", sessionPool.size());
        } catch (Exception e) {
            log.error("ws: 连接异常：", e);
        }
    }

    /**
     * 获取token
     *
     * @return
     */
    private String getToken() {
        String token = (String) session.getAttributes().getOrDefault("token", "");
        if (StrUtil.isNotBlank(token) && token.startsWith(TokenConstants.PREFIX)) {
            return token.replace(TokenConstants.PREFIX, "");
        }
        return token;
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        log.info("ws: 收到客户端消息:{}", message);
    }

    /**
     * 处理接收到的二进制消息
     *
     * @param session WebSocket会话
     * @param message 接收到的二进制消息
     * @throws Exception 处理消息过程中可能抛出的异常
     */
    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) throws Exception {
        super.handleBinaryMessage(session, message);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("ws: 用户错误,原因:", exception);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) {
        try {
            if (session.isOpen()) {
                session.close();
            }

            sessionPool.values().removeIf(x -> ObjectUtil.isNotNull(x) && x.equals(session));
            webSocketServers.remove(this);
            log.info("ws: 连接断开{}，总数为:{}", closeStatus, sessionPool.size());
        } catch (Exception e) {
            log.error("ws: 关闭异常：", e);
        }
    }

    /**
     * 是否支持消息拆分发送：如果接收的数据量比较大，最好打开(true), 否则可能会导致接收失败。
     * 如果出现WebSocket连接接收一次数据后就自动断开，应检查是否是这里的问题。
     *
     * @return
     */
    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

    /**
     * 服务端群发消息-心跳包
     */
    @Scheduled(fixedDelay = HEARTBEAT_INTERVAL)
    public synchronized void sendHeartbeat() {
        sessionPool.forEach((k, v) -> {
            WebSocketSession webSocketSession = sessionPool.get(k);
            try {
                webSocketSession.sendMessage(new PingMessage());
            } catch (Exception e) {
                afterConnectionClosed(webSocketSession, CloseStatus.NORMAL.withReason("心跳检测失败"));
                log.info("ws: 客户端心跳检测: {}，心跳发送失败，已移除连接！", k);
            }
        });
    }

    /**
     * 处理接收到的Pong消息（心跳监测）
     *
     * @param session WebSocket会话
     * @param message 接收到的Pong消息
     * @throws Exception 处理消息过程中可能抛出的异常
     */
    @Override
    protected void handlePongMessage(WebSocketSession session, PongMessage message) throws Exception {
        session.sendMessage(new PongMessage());
    }

    /**
     * 此为广播消息
     *
     * @param message
     */
    public void sendAllMessage(String message) {
        log.info("ws: 广播消息:{}", message);
        for (WebSocketServer webSocketServer : webSocketServers) {
            try {
                if (webSocketServer.session.isOpen()) {
                    sendMessage(session, new TextMessage(message));
                }
            } catch (Exception e) {
                log.error("ws: 广播消息错误:", e);
            }
        }
    }

    /**
     * 此为单点消息
     *
     * @param toUserId
     * @param message
     */
    public <T> void sendOneMessage(Long toUserId, T message) {
        Set<String> allUserTokens = tokenService.getAllUserTokens(toUserId);
        allUserTokens.forEach(token -> {
            sendOneMessage(token, message);
        });
    }

    /**
     * 此为单点消息
     *
     * @param tokens
     * @param message
     */
    public void sendOneMessage(Collection<String> tokens, Object message) {
        if (CollUtil.isNotEmpty(tokens)) {
            tokens.forEach(token -> {
                sendOneMessage(token, message);
            });
        }
    }

    /**
     * 此为单点消息
     *
     * @param token
     * @param message
     */
    public <T> void sendOneMessage(String token, T message) {
        WebSocketSession session = sessionPool.get(token);
        if (message instanceof String) {
            sendMessage(session, new TextMessage(String.valueOf(message)));
        } else {
            sendMessage(session, new TextMessage(JSON.toJSONString(message)));
        }
    }

    /**
     * 此为单点消息(多人)
     */
    public void sendMoreMessage(Long[] toUserIds, String message) {
        for (Long toUserId : toUserIds) {
            sendOneMessage(toUserId, message);
        }
    }

    /**
     * 向指定的WebSocket会话发送WebSocket消息对象
     *
     * @param session WebSocket会话
     * @param message 要发送的WebSocket消息对象
     */
    private static void sendMessage(WebSocketSession session, WebSocketMessage<?> message) {
        if (session == null || !session.isOpen()) {
            log.warn("ws: session会话已经关闭");
        } else {
            try {
                session.sendMessage(message);
                log.info("ws: session({}) 发送消息({}) 成功", session, message);
            } catch (IOException e) {
                log.error("ws: session({}) 发送消息({}) 异常", session, message, e);
            }
        }
    }

}