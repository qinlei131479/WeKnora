package com.iptv.common.mybatisplus.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import interceptor.MapF2FInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * MyBatis-Plus配置类
 *
 * @author ruoyi
 */
@Configuration
@EnableTransactionManagement
public class MybatisPlusConfig {

    /**
     * 分页插件
     */
    @Primary
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }

    @Bean
    public MapF2FInterceptor mapF2FInterceptor() {
        return new MapF2FInterceptor();
    }

    /**
     * 自动填充处理器（插入/更新时注入 createBy/updateBy/createTime/updateTime）
     * 显式注册为 Bean，确保通过 @Import(MybatisPlusConfig.class) 引入时能被
     * MyBatis-Plus 自动配置检测到，不依赖组件扫描。
     */
    @Bean
    public MetaObjectHandler metaObjectHandler() {
        return new MybatisUpdateHandler();
    }
}