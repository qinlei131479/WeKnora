package com.iptv.common.core.domain.vo.msg;

import com.alibaba.fastjson2.JSON;
import com.iptv.common.core.enums.WebSocketMsgEnum;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import java.io.Serializable;

/**
 * @author GongJie
 * @date 2022/10/31
 */
@Data
@Accessors(chain = true)
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketMsg<T> implements Serializable {

    /**
     * 消息类型，来源于 {@link WebSocketMsgEnum.Type}
     */
    private String type;

    /**
     * 消息内容
     */
    private String msg;

    /**
     * 业务数据
     */
    private T data;

    public WebSocketMsg(String type, T data) {
        this.type = type;
        this.data = data;
    }

    public WebSocketMsg(String type, String msg) {
        this.type = type;
        this.msg = msg;
    }

    public static <T> WebSocketMsg<T> createMsg(String type, T data) {
        return new WebSocketMsg<>(type, data);
    }

    public static <T> WebSocketMsg<T> createMsg(String type, String mag) {
        return new WebSocketMsg<>(type, mag);
    }

    public static <T> WebSocketMsg<T> createMsg(String type, String mag, T data) {
        return new WebSocketMsg<>(type, mag, data);
    }

    public static <T> WebSocketMsg<T> createMsg(WebSocketMsgEnum.Type type, T data) {
        return createMsg(type.getCode(), data);
    }

    public static <T> WebSocketMsg<T> createMsg(WebSocketMsgEnum.Type type, String msg) {
        return createMsg(type.getCode(), msg);
    }

    public static <T> WebSocketMsg<T> createMsg(WebSocketMsgEnum.Type type, String msg, T data) {
        return createMsg(type.getCode(), msg, data);
    }

    /**
     * 转为实际发送的消息格式
     *
     * @return
     */
    public String toSendMsg() {
        return JSON.toJSONString(this);
    }
}
