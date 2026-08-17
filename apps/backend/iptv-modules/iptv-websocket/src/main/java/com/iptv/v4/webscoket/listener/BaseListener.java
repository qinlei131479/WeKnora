package com.iptv.v4.webscoket.listener;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson.JSON;
import com.iptv.common.core.domain.vo.msg.UserWebSocketMsg;
import com.iptv.common.core.domain.vo.msg.WebSocketMsg;
import com.iptv.common.core.utils.MessageUtils;
import com.iptv.common.security.service.TokenService;
import com.iptv.v4.webscoket.config.WebSocketServer;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;


@Slf4j
@Component
public class BaseListener {

    @Resource
    protected TokenService tokenService;

    @Resource
    protected WebSocketServer webSocketServer;

    /**
     * 获取消息对象
     *
     * @param message
     * @param pattern
     * @return
     */
    public static UserWebSocketMsg getMsgObj(Message message, byte[] pattern) {
        // 如果发送的消息类型是字符串，这里获取的消息前后会加上引号
        String msg = new String(message.getBody());
        String topic = new String(pattern);
        log.info("msg: {}, topic: {}", msg, topic);

        if (StrUtil.isEmpty(msg)) {
            log.error("消息为空！-> {}", msg);
            return null;
        }

        try {
            return JSON.parseObject(msg, UserWebSocketMsg.class);
        } catch (Exception e) {
            log.error("解析消息失败！-> {}", msg);
            throw new RuntimeException(MessageUtils.message("websocket.msg.format.invalid"));
        }
    }


    /**
     * 发送消息
     *
     * @param webSocketMsg
     */
    public void sendMsg(UserWebSocketMsg webSocketMsg) {
        HashSet<String> allTokens = new HashSet<>();
        if (CollUtil.isNotEmpty(webSocketMsg.getTokens())) {
            allTokens = new HashSet<>(webSocketMsg.getTokens());
        }
        if (CollUtil.isNotEmpty(webSocketMsg.getUserIds())) {
            allTokens.addAll(getTokenByUserIds(webSocketMsg.getUserIds()));
        }
        sendMsg(allTokens, webSocketMsg.getWebSocketMsg());
        log.info("消息发送成功：{}-{}", allTokens.size(), webSocketMsg);
    }

    /**
     * 根据token发送消息
     *
     * @param token
     * @param webSocketMsg
     */
    private void sendMsg(Collection<String> token, WebSocketMsg webSocketMsg) {
        if (CollUtil.isEmpty(token) || ObjectUtil.isNull(webSocketMsg)) {
            log.error("消息发送失败，请检查消息参数：{}-{}", token, webSocketMsg);
            throw new RuntimeException(MessageUtils.message("websocket.msg.send.failed"));
        }
        webSocketServer.sendOneMessage(token, webSocketMsg);
    }

    /**
     * 根据用户id集合获取token集合
     *
     * @param userIds
     * @return
     */
    private HashSet<String> getTokenByUserIds(Collection<Long> userIds) {
        HashSet<String> tokens = new HashSet<>();
        if (CollUtil.isNotEmpty(userIds)) {
            for (Long userId : userIds) {
                tokens.addAll(getTokenByUserId(userId));
            }
        }
        return tokens;
    }

    /**
     * 根据用户id获取token集合
     *
     * @param userId
     * @return
     */
    public Set<String> getTokenByUserId(Object userId) {
        return tokenService.getAllUserTokens(userId);
    }

}
