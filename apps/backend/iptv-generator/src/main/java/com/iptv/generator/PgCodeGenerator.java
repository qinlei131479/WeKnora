package com.iptv.generator;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.core.toolkit.StringPool;
import com.baomidou.mybatisplus.generator.AutoGenerator;
import com.baomidou.mybatisplus.generator.InjectionConfig;
import com.baomidou.mybatisplus.generator.config.*;
import com.baomidou.mybatisplus.generator.config.rules.NamingStrategy;
import com.baomidou.mybatisplus.generator.engine.FreemarkerTemplateEngine;
import com.iptv.generator.config.PgCodeFileOutConfig;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * PostgreSQL 业务逻辑代码生成
 * 生成的代码位于 pgmapper / domain / service 包下
 * ServiceImpl 使用 postgresTransactionManager 事务管理器
 *
 * @author kjsc
 */
@Slf4j
public class PgCodeGenerator {

    // ===== 路径常量 =====
    static final String CODE_PREFIX     = "/src/main/java/com/iptv/business";
    static final String TEST_PREFIX     = "/src/test/java/com/iptv/business";
    static final String BASE_PATH       = System.getProperty("user.dir");
    static final String PROJECT_MODULE  = BASE_PATH + "/iptv-modules/iptv-business";
    static final String PROJECT_MODULE_PATH      = PROJECT_MODULE + CODE_PREFIX + "/";
    static final String PROJECT_MODULE_TEST_PATH = PROJECT_MODULE + TEST_PREFIX + "/";

    // entity 生成到 domain 子包
    static final String ENTITY_MODULE_PATH = BASE_PATH + "/iptv-api/iptv-api-business" + CODE_PREFIX + "/domain";
    // mapper XML 生成到 pgmapper 目录（供 PostgresDataSourceAutoConfiguration 扫描）
    static final String MAPPER_XML_PATH = PROJECT_MODULE + "/src/main/resources/pgmapper";

    // ===== 代码配置 =====
    static final Class<?> BASE_ENTITY     = null;
    static final Class<?> BASE_CONTROLLER = null;
    static final String   PARENT_PKG      = "com.iptv.business";
    static final String   MODULE_NAME     = "business";
    static final String   AUTHOR          = "kjsc";

    // 实体基类字段（与 MySQL 保持一致，从父类 BaseEntity 继承）
    static final String[] SUPER_ENTITY_COLS = {};

    // ===== 待生成的 PostgreSQL 表 =====
    static final String[] DATA_TABLES = {"audit_logs"};

    // ===== PostgreSQL jsonb 列配置 =====
    // Key: 表名（小写），Value: jsonb 列名数组（下划线命名）
    static final Map<String, String[]> JSONB_COLUMNS = Map.of(
            "audit_logs", new String[]{}
    );
    // jsonb 列名后缀（自动匹配以这些后缀结尾的列）
    static final String[] JSONB_COLUMN_SUFFIXES = {};

    // ===== PostgreSQL 数据源配置 =====
    private interface DataBaseConfig {
        String URL      = "jdbc:postgresql://192.168.180.238:5432/agent-middle?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai";
        String USERNAME = "postgres";
        String PASSWORD = "postgres123!@#";
    }

    public static void main(String[] args) {
        AutoGenerator autoGenerator = new AutoGenerator();

        configGlobal(autoGenerator, PROJECT_MODULE, AUTHOR);
        configPkg(autoGenerator);

        // PostgreSQL 数据源
        DataSourceConfig dsc = new DataSourceConfig();
        dsc.setDbType(DbType.POSTGRE_SQL);
        dsc.setUrl(DataBaseConfig.URL);
        dsc.setUsername(DataBaseConfig.USERNAME);
        dsc.setPassword(DataBaseConfig.PASSWORD);
        dsc.setDriverName("org.postgresql.Driver");
        autoGenerator.setDataSource(dsc);

        // 注入自定义模板参数
        InjectionConfig cfg = new InjectionConfig() {
            @Override
            public void initMap() {
                Map<String, Object> map = new HashMap<>();
                map.put("baseResultMap", true);
                map.put("packageParent", PARENT_PKG);
                map.put("moduleName", MODULE_NAME);
                map.put("dbType", "pg");

                // 构建 jsonb 列索引：columnName -> "true"
                Map<String, String> jsonbColMap = new HashMap<>();
                for (Map.Entry<String, String[]> entry : JSONB_COLUMNS.entrySet()) {
                    for (String col : entry.getValue()) {
                        jsonbColMap.put(col.toLowerCase(), "true");
                    }
                }
                map.put("pgJsonbColumns", jsonbColMap);
                map.put("pgJsonbSuffixes", JSONB_COLUMN_SUFFIXES);

                this.setMap(map);
            }
        };
        List<FileOutConfig> outConfigs = new ArrayList<>();
        importTemplate(outConfigs);
        cfg.setFileOutConfigList(outConfigs);
        autoGenerator.setCfg(cfg);

        // 策略配置
        StrategyConfig strategy = new StrategyConfig();
        strategy.setEntityLombokModel(true);
        if (BASE_ENTITY != null)     strategy.setSuperEntityClass(BASE_ENTITY);
        if (BASE_CONTROLLER != null) strategy.setSuperControllerClass(BASE_CONTROLLER);
        strategy.setSuperEntityColumns(SUPER_ENTITY_COLS);
        strategy.setInclude(DATA_TABLES);
        strategy.setNaming(NamingStrategy.underline_to_camel);
        strategy.setColumnNaming(NamingStrategy.underline_to_camel);
        strategy.setRestControllerStyle(true);
        autoGenerator.setStrategy(strategy);

        configTemplate(autoGenerator);
        autoGenerator.execute();

        log.info("PostgreSQL 代码生成完成，输出目录：{}", PROJECT_MODULE);
    }

    static void importTemplate(List<FileOutConfig> configs) {
        // entity → domain/
        configs.add(new PgCodeFileOutConfig("/entity.java.ftl", ENTITY_MODULE_PATH, ".java"));
        // pageDTO → domain/dto/page/
        configs.add(new PgCodeFileOutConfig("/pageDTO.java.ftl", ENTITY_MODULE_PATH + "/dto/page", "PageDTO.java"));
        // dto → domain/dto/
        configs.add(new PgCodeFileOutConfig("/dto.java.ftl", ENTITY_MODULE_PATH + "/dto", "DTO.java"));
        // vo → domain/vo/
        configs.add(new PgCodeFileOutConfig("/vo.java.ftl", ENTITY_MODULE_PATH + "/vo", "VO.java"));

        // mapper XML → resources/pgmapper/
        configs.add(new PgCodeFileOutConfig("/mapper.xml.ftl", MAPPER_XML_PATH, "Mapper" + StringPool.DOT_XML));

        // mapper 接口 → pgmapper/
        configs.add(new PgCodeFileOutConfig("/mapper.java.ftl", PROJECT_MODULE_PATH + "pgmapper", "Mapper.java"));

        // service 接口 → service/
        configs.add(new PgCodeFileOutConfig("/service.java.ftl", PROJECT_MODULE_PATH + "service", "Service.java"));

        // service 实现 → service/impl/
        configs.add(new PgCodeFileOutConfig("/serviceImpl.java.ftl", PROJECT_MODULE_PATH + "service/impl", "ServiceImpl.java"));

        // controller → controller/（与 MySQL controller 同层）
        configs.add(new PgCodeFileOutConfig("/controller.java.ftl", PROJECT_MODULE_PATH + "controller", "Controller.java"));

        // 测试用例
//        configs.add(new PgCodeFileOutConfig("/controllerTest.java.ftl", PROJECT_MODULE_TEST_PATH + "controller", "ControllerTest.java"));
    }

    private static void configGlobal(AutoGenerator ag, String projectPath, String author) {
        GlobalConfig gc = new GlobalConfig();
        gc.setOutputDir(projectPath + "/src/main/java");
        gc.setAuthor(author);
        gc.setOpen(false);
        gc.setSwagger2(true);
        gc.setBaseResultMap(true);
        gc.setBaseColumnList(true);
        gc.setServiceName("%s" + ConstVal.SERVICE);
        ag.setGlobalConfig(gc);
    }

    private static void configPkg(AutoGenerator ag) {
        PackageConfig pkg = new PackageConfig();
        pkg.setParent(PARENT_PKG);
        pkg.setEntity("domain");
        pkg.setMapper("pgmapper");
        pkg.setService("service");
        pkg.setServiceImpl("service.impl");
        pkg.setController("controller");
        ag.setPackageInfo(pkg);
    }

    private static void configTemplate(AutoGenerator ag) {
        TemplateConfig tc = new TemplateConfig();
        tc.setController("");
        tc.setService("");
        tc.setServiceImpl("");
        tc.setEntity("");
        tc.setMapper("");
        tc.setXml(null);
        ag.setTemplate(tc);
        ag.setTemplateEngine(new FreemarkerTemplateEngine());
    }
}
