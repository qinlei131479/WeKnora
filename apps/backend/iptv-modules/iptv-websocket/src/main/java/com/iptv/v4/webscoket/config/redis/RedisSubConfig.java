package com.iptv.v4.webscoket.config.redis;

import com.iptv.common.core.constant.CacheConstants;
import com.iptv.v4.webscoket.listener.NormalMessageLisener;
import com.iptv.v4.webscoket.listener.UserLogoutMessageListener;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

/**
 * redis订阅配置
 */
@Slf4j
@Configuration
public class RedisSubConfig {

    @Bean
    RedisMessageListenerContainer container(RedisConnectionFactory connectionFactory,
                                            MessageListenerAdapter userLoginListenerAdapter,
                                            NormalMessageLisener normalMessageLisener) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(userLoginListenerAdapter, new PatternTopic(CacheConstants.TOPIC_USER_TOKEN_SOCKET_MSG));
        container.addMessageListener(normalMessageLisener, new PatternTopic(CacheConstants.TOPIC_REQUEST_TREND_EXPORT_MSG));
        return container;
    }

    /**
     * 用户单点登录监听
     */
    @Primary
    @Bean
    MessageListenerAdapter userLoginListenerAdapter(UserLogoutMessageListener userLogoutMessageListener) {
        log.info("userLoginListenerAdapter register");
        return new MessageListenerAdapter(userLogoutMessageListener, "onMessage");
    }

}

