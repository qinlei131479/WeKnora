package com.iptv.common.core.utils;

import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContext;
import org.springframework.context.i18n.LocaleContextHolder;

import java.util.List;
import java.util.Locale;

/**
 * 基于 {@link LocaleContextHolder} 与 {@link MessageSource} 的消息解析工具
 *
 * @author tanjx
 * @date 2026-08-05
 */
public final class MessageUtils {
    private MessageUtils() {
    }

    /**
     * 按当前请求 Locale 解析 message key
     *
     * @param code 消息键
     * @param args 占位参数（对应资源包中的 {0}、{1}…）
     * @return 本地化文案；找不到 key 时返回 code 本身
     */
    public static String message(String code, Object... args) {
        return message(currentLocale(), code, args);
    }

    /**
     * 按指定 Locale 解析 message key（网关 WebFlux / 异步线程等无 LocaleContext 时使用）
     *
     * @param locale 语言环境，null 时回落默认 zh_CN
     * @param code   消息键
     * @param args   占位参数
     * @return 本地化文案；找不到 key 时返回 code 本身
     */
    public static String message(Locale locale, String code, Object... args) {
        if (StrUtil.isEmpty(code)) {
            return code;
        }
        MessageSource messageSource = SpringUtils.getBean(MessageSource.class);
        return messageSource.getMessage(code, args, code, normalizeLocale(locale));
    }

    /**
     * 按当前请求语言解析消息，并在 key 不存在时使用指定默认文案。
     *
     * @param code           消息键
     * @param defaultMessage 默认文案
     * @param args           占位参数
     * @return 本地化文案
     */
    public static String messageOrDefault(String code, String defaultMessage, Object... args) {
        if (StrUtil.isEmpty(code)) {
            return defaultMessage;
        }
        MessageSource messageSource = SpringUtils.getBean(MessageSource.class);
        return messageSource.getMessage(code, args, defaultMessage, currentLocale());
    }

    /**
     * 按当前请求 Locale 解析枚举展示描述。
     *
     * @param enumValue   枚举值
     * @param defaultDesc 默认中文描述
     * @return 本地化描述；找不到 key 时返回默认中文描述
     */
    public static String desc(Enum<?> enumValue, String defaultDesc) {
        String code = "enum." + enumValue.getDeclaringClass().getSimpleName() + "." + enumValue.name();
        return messageOrDefault(code, defaultDesc);
    }

    /**
     * 获取当前线程的受支持语言；非请求线程默认使用简体中文。
     *
     * @return 简体中文或美式英语
     */
    public static Locale currentLocale() {
        LocaleContext localeContext = LocaleContextHolder.getLocaleContext();
        Locale locale = ObjectUtil.isNotNull(localeContext) ? localeContext.getLocale() : null;
        return normalizeLocale(locale);
    }

    /**
     * 从 Accept-Language 请求头解析当前支持的语言。
     *
     * @param acceptLanguage Accept-Language 请求头
     * @return 简体中文或美式英语
     */
    public static Locale resolveLocale(String acceptLanguage) {
        if (StrUtil.isBlank(acceptLanguage)) {
            return Locale.SIMPLIFIED_CHINESE;
        }
        try {
            List<Locale.LanguageRange> ranges = Locale.LanguageRange.parse(acceptLanguage);
            for (Locale.LanguageRange range : ranges) {
                String language = range.getRange();
                if (language.startsWith(Locale.CHINESE.getLanguage())) {
                    return Locale.SIMPLIFIED_CHINESE;
                }
                if (language.startsWith(Locale.ENGLISH.getLanguage())) {
                    return Locale.US;
                }
            }
        } catch (IllegalArgumentException ignored) {
            // 非法请求头按默认语言处理
        }
        return Locale.SIMPLIFIED_CHINESE;
    }

    /**
     * 将语言限制为后端当前支持的中文或英文。
     *
     * @param locale 待规范化语言
     * @return 受支持语言
     */
    private static Locale normalizeLocale(Locale locale) {
        if (ObjectUtil.isNotNull(locale) && Locale.ENGLISH.getLanguage().equals(locale.getLanguage())) {
            return Locale.US;
        }
        return Locale.SIMPLIFIED_CHINESE;
    }
}
