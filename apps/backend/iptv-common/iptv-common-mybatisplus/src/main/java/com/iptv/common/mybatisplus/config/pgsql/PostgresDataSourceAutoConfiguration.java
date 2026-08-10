package com.iptv.common.mybatisplus.config.pgsql;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.core.config.GlobalConfig;
import com.baomidou.mybatisplus.core.toolkit.GlobalConfigUtils;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import com.baomidou.mybatisplus.extension.spring.MybatisSqlSessionFactoryBean;
import com.iptv.common.mybatisplus.config.MybatisUpdateHandler;
import com.zaxxer.hikari.HikariDataSource;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;

/**
 * PostgreSQL 数据源自动配置
 *
 * <p>激活条件：
 * <ol>
 *   <li>classpath 中存在 PostgreSQL 驱动（{@code org.postgresql.Driver}）</li>
 *   <li>Nacos/本地配置中存在 {@code spring.datasource.postgres.url}</li>
 * </ol>
 *
 * <p>暴露 Bean：
 * <ul>
 *   <li>{@code postgresDataSource} — HikariCP 连接池</li>
 *   <li>{@code postgresSqlSessionFactory} — 含 POSTGRE_SQL 分页插件</li>
 *   <li>{@code postgresSqlSessionTemplate}</li>
 *   <li>{@code postgresTransactionManager}</li>
 * </ul>
 *
 * <p>{@code @MapperScan} 不在此处声明，由各业务模块自行指定扫描包：
 * <pre>{@code
 * @MapperScan(basePackages = "com.iptv.xxx.mapper.postgres",
 *             sqlSessionFactoryRef = "postgresSqlSessionFactory")
 * }</pre>
 */
@AutoConfiguration
@ConditionalOnClass(name = "org.postgresql.Driver")
@ConditionalOnProperty(prefix = "spring.datasource.postgres", name = "url")
public class PostgresDataSourceAutoConfiguration {

    @Bean(name = "postgresDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.postgres")
    public DataSource postgresDataSource() {
        return DataSourceBuilder.create().type(HikariDataSource.class).build();
    }

    @Bean(name = "postgresSqlSessionFactory")
    public SqlSessionFactory postgresSqlSessionFactory(
            @Qualifier("postgresDataSource") DataSource dataSource) throws Exception {
        // 分页插件不注册为 Spring Bean，避免被 MybatisPlusAutoConfiguration 收集到
        // 默认 sqlSessionFactory（MySQL），导致 MySQL 查询出现多余的 LIMIT 子句
        MybatisPlusInterceptor pgInterceptor = new MybatisPlusInterceptor();
        pgInterceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.POSTGRE_SQL));

        MybatisSqlSessionFactoryBean factory = new MybatisSqlSessionFactoryBean();
        factory.setDataSource(dataSource);
        factory.setMapperLocations(
                new PathMatchingResourcePatternResolver()
                        .getResources("classpath*:mapper/postgres/**/*.xml"));
        GlobalConfig globalConfig = GlobalConfigUtils.defaults();
        globalConfig.setMetaObjectHandler(new MybatisUpdateHandler());
        factory.setGlobalConfig(globalConfig);
        factory.setPlugins(pgInterceptor);
        return factory.getObject();
    }

    @Bean(name = "postgresSqlSessionTemplate")
    public SqlSessionTemplate postgresSqlSessionTemplate(
            @Qualifier("postgresSqlSessionFactory") SqlSessionFactory factory) {
        return new SqlSessionTemplate(factory);
    }

    @Bean(name = "postgresTransactionManager")
    public PlatformTransactionManager postgresTransactionManager(
            @Qualifier("postgresDataSource") DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
