package com.iptv.common.core.config;

import com.iptv.common.core.i18n.HeaderLocaleResolver;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;
import org.springframework.web.servlet.LocaleResolver;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

/**
 * 国际化消息源与请求语言解析配置。
 *
 * @author tanjx
 * @date 2026-08-05
 */
@AutoConfiguration
public class I18nConfig
{
    /**
     * 创建全局国际化消息源。
     *
     * @return 国际化消息源
     */
    @Bean
//    @ConditionalOnMissingBean(name = "messageSource")
    public MessageSource messageSource()
    {
        ReloadableResourceBundleMessageSource messageSource = new ReloadableResourceBundleMessageSource();
        messageSource.setBasenames(
                "classpath:i18n/messages",
                "classpath:i18n/enum-messages",
                "classpath:i18n/log-messages",
                "classpath:i18n/dict-messages",
                "classpath:i18n/menu-messages");
        messageSource.setDefaultEncoding(StandardCharsets.UTF_8.name());
        messageSource.setDefaultLocale(Locale.SIMPLIFIED_CHINESE);
        messageSource.setFallbackToSystemLocale(false);
        messageSource.setUseCodeAsDefaultMessage(true);
        return messageSource;
    }

    /**
     * 为 Servlet 请求创建基于 Accept-Language 的语言解析器。
     *
     * @return 请求语言解析器
     */
    @Bean
    @ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
    @ConditionalOnMissingBean(LocaleResolver.class)
    public LocaleResolver localeResolver()
    {
        return new HeaderLocaleResolver();
    }
}
