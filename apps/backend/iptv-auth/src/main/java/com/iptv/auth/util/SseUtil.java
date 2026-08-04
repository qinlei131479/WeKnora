package com.iptv.auth.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Slf4j
public class SseUtil {

    /**
     * 发送SSE事件
     *
     * @param emitter
     * @param name
     * @param data
     */
    public static void send(SseEmitter emitter, String name, Object data) {
        try {
            emitter.send(SseEmitter.event()
                    .name(name)
                    .data(data));
        } catch (Exception e) {
            log.error("Error sending SSE event: ", e);
        }
    }
}
