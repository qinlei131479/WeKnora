package com.iptv.common.core.domain.vo.msg;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import java.io.Serializable;

/**
 * @author GongJie
 * @date 2023/6/15
 */
@Data
@Accessors(chain = true)
@AllArgsConstructor
@NoArgsConstructor
public class SingleLoginMsgData implements Serializable {
	
	/**
	 * 登录的用户id
	 */
	private Long userId;
	
	/**
	 * 最后一次登录的用户token
	 */
	private String lastAccessToken;
	
	private String msg;
	
	public static SingleLoginMsgData newMsg(Long userId, String lastAccessToken) {
		SingleLoginMsgData msg = new SingleLoginMsgData();
		msg.userId = userId;
		msg.lastAccessToken = lastAccessToken;
		return msg;
	}
}
