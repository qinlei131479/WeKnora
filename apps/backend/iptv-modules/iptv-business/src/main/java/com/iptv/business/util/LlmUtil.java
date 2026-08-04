package com.iptv.business.util;

import cn.hutool.core.util.StrUtil;
import com.alibaba.dashscope.aigc.generation.Generation;
import com.alibaba.dashscope.aigc.generation.GenerationParam;
import com.alibaba.dashscope.aigc.generation.GenerationResult;
import com.alibaba.dashscope.common.Message;
import com.alibaba.dashscope.common.Role;
import lombok.extern.slf4j.Slf4j;

import java.util.Collections;

/**
 * 大模型调用工具
 */
@Slf4j
public final class LlmUtil {

    private LlmUtil() {
    }

    /**
     * 同步调用大模型，返回助手回复的纯文本。
     *
     * @param prompt 已完成的提示词内容（模板变量已替换）
     * @return 模型输出文本；失败或未配置密钥时返回 {@code null}
     */
    public static String call(String prompt, String apiKey, String model) {
        if (StrUtil.isBlank(apiKey)) {
            log.error("未配置 DashScope API Key");
            return null;
        }
        try {
            Generation gen = new Generation();
            Message userMessage = Message.builder()
                    .role(Role.USER.getValue())
                    .content(prompt)
                    .build();
            GenerationParam param = GenerationParam.builder()
                    .apiKey(apiKey)
                    .temperature(0F)
                    .topP(0.001)
                    .model(model)
                    .messages(Collections.singletonList(userMessage))
                    .resultFormat(GenerationParam.ResultFormat.MESSAGE)
                    .build();
            GenerationResult result = gen.call(param);
            return extractAssistantText(result);
        } catch (Exception e) {
            log.error("调用大模型失败, model={}", model, e);
            return null;
        }
    }

    private static String extractAssistantText(GenerationResult result) {
        if (result == null || result.getOutput() == null) {
            return null;
        }
        var choices = result.getOutput().getChoices();
        if (choices == null || choices.isEmpty()) {
            return null;
        }
        Message message = choices.get(0).getMessage();
        if (message == null) {
            return null;
        }
        Object content = message.getContent();
        if (content == null) {
            return null;
        }
        if (content instanceof String s) {
            return s;
        }
        return content.toString();
    }
}
