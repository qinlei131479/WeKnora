package com.iptv.v4.webscoket.listener;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.ObjectUtil;
import com.alibaba.fastjson.JSON;
import com.iptv.common.core.domain.vo.msg.UserWebSocketMsg;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

/**
 * 发送消息提示用户退出登录
 * <p>
 * 多服务使用websocket发送消息，使用消息队列的广播模式，确保用户能收到消息，这里使用redis的消息订阅
 * </p>
 */
@Slf4j
@Component
public class UserLogoutMessageListener extends BaseListener implements MessageListener {

    @Override
    public void onMessage(Message message, byte[] pattern) {
        UserWebSocketMsg socketMsg = getMsgObj(message, pattern);

        if (ObjectUtil.isNull(socketMsg) || CollUtil.isEmpty(socketMsg.getTokens())) {
            log.error("消息格式/内容错误 -> {} ", JSON.toJSONString(socketMsg));
            return;
        }

        sendMsg(socketMsg);

        socketMsg.getTokens().forEach(token -> {
            tokenService.logout(token);
            log.info("已踢下线，token:{}", token);
        });
    }
}
