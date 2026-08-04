package com.iptv.common.core.domain.vo.msg;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.util.Collection;
import java.util.Collections;

/**
 * 用户WebSocket消息
 *
 * @author GongJie
 * @date 2023/9/13
 */
@NoArgsConstructor
@Accessors(chain = true)
@Data
public class UserWebSocketMsg implements Serializable {
	
	/**
	 * 用户id列表，可以针对指定用户批量推送消息
	 * <H4>id和token都有时 仅会处理token列表</H4>
	 */
	private Collection<Long> userIds;
	
	/**
	 * token列表，可以针对指定用户批量推送消息
	 * <H4>id和token都有时 仅会处理token列表</H4>
	 */
	private Collection<String> tokens;
	
	/**
	 * 消息
	 */
	private WebSocketMsg webSocketMsg;
	
	
	public UserWebSocketMsg(Collection<String> tokens, WebSocketMsg webSocketMsg) {
		this.tokens = tokens;
		this.webSocketMsg = webSocketMsg;
	}
	
	public UserWebSocketMsg(Long userId, WebSocketMsg webSocketMsg) {
		this.userIds = Collections.singletonList(userId);
		this.webSocketMsg = webSocketMsg;
	}
	
	public UserWebSocketMsg(String token, WebSocketMsg webSocketMsg) {
		this.tokens = Collections.singletonList(token);
		this.webSocketMsg = webSocketMsg;
	}
}
