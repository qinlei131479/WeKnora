package com.iptv.v4.webscoket.listener;

import cn.hutool.core.util.ObjectUtil;
import com.alibaba.fastjson.JSON;
import com.iptv.common.core.domain.vo.msg.UserWebSocketMsg;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class NormalMessageLisener extends BaseListener implements MessageListener {

    @Override
    public void onMessage(Message message, byte[] pattern) {
        UserWebSocketMsg webSocketMsg = getMsgObj(message, pattern);
        if (ObjectUtil.isNull(webSocketMsg)) {
            log.error("消息格式/内容错误 -> {} ", JSON.toJSONString(webSocketMsg));
            return;
        }

        sendMsg(webSocketMsg);
    }

}
