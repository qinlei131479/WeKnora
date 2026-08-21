package com.iptv.common.mybatisplus.config.pgsql;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.core.config.GlobalConfig;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.toolkit.GlobalConfigUtils;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import com.baomidou.mybatisplus.extension.spring.MybatisSqlSessionFactoryBean;
import com.baomidou.mybatisplus.autoconfigure.MybatisPlusProperties;
import com.iptv.common.mybatisplus.config.MybatisUpdateHandler;
import com.zaxxer.hikari.HikariDataSource;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
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
 * @MapperScan(basePackages = "com.iptv.xxx.pgmapper",
 *             sqlSessionFactoryRef = "postgresSqlSessionFactory")
 * }</pre>
 */
@AutoConfiguration
@ConditionalOnClass(name = "org.postgresql.Driver")
@ConditionalOnProperty(prefix = "spring.datasource.postgres", name = "url")
@EnableConfigurationProperties(MybatisPlusProperties.class)
public class PostgresDataSourceAutoConfiguration {

    // defaultCandidate = false: 不参与按类型自动注入，避免与 dynamic-datasource 的
    // dataSource Bean 冲突（"2 DataSource beans found"）。仅通过 @Qualifier 供本类内部使用。
    @Bean(name = "postgresDataSource", defaultCandidate = false)
    @ConfigurationProperties(prefix = "spring.datasource.postgres")
    public DataSource postgresDataSource() {
        return DataSourceBuilder.create().type(HikariDataSource.class).build();
    }

    @Bean(name = "postgresSqlSessionFactory")
    public SqlSessionFactory postgresSqlSessionFactory(
            @Qualifier("postgresDataSource") DataSource dataSource,
            MybatisPlusProperties properties) throws Exception {
        // 分页插件不注册为 Spring Bean，避免被 MybatisPlusAutoConfiguration 收集到
        // 默认 sqlSessionFactory（MySQL），导致 MySQL 查询出现多余的 LIMIT 子句
        MybatisPlusInterceptor pgInterceptor = new MybatisPlusInterceptor();
        pgInterceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.POSTGRE_SQL));

        MybatisSqlSessionFactoryBean factory = new MybatisSqlSessionFactoryBean();
        factory.setDataSource(dataSource);
        factory.setMapperLocations(
                new PathMatchingResourcePatternResolver()
                        .getResources("classpath*:pgmapper/**/*.xml"));

        // 应用 MyBatis-Plus 配置
        if (properties.getTypeAliasesPackage() != null) {
            factory.setTypeAliasesPackage(properties.getTypeAliasesPackage());
        }

        // 创建 MybatisConfiguration 并应用配置
        MybatisConfiguration configuration = new MybatisConfiguration();
        if (properties.getConfiguration() != null) {
            // 复制 log-impl 等配置
            configuration.setLogImpl(properties.getConfiguration().getLogImpl());
        }
        factory.setConfiguration(configuration);

        GlobalConfig globalConfig = GlobalConfigUtils.defaults();
        globalConfig.setMetaObjectHandler(new MybatisUpdateHandler());

        // 应用全局配置（如逻辑删除）
        if (properties.getGlobalConfig() != null && properties.getGlobalConfig().getDbConfig() != null) {
            globalConfig.setDbConfig(properties.getGlobalConfig().getDbConfig());
        }

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
