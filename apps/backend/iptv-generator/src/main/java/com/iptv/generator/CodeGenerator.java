package com.iptv.generator;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.core.toolkit.StringPool;
import com.baomidou.mybatisplus.generator.AutoGenerator;
import com.baomidou.mybatisplus.generator.InjectionConfig;
import com.baomidou.mybatisplus.generator.config.*;
import com.baomidou.mybatisplus.generator.config.rules.NamingStrategy;
import com.baomidou.mybatisplus.generator.engine.FreemarkerTemplateEngine;
import com.iptv.common.core.web.controller.BaseController;
import com.iptv.common.core.web.domain.BaseEntity;
import com.iptv.generator.config.CodeFileOutConfig;
import lombok.extern.slf4j.Slf4j;

import java.io.File;
import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 基础业务逻辑代码生成
 *
 * @author apple
 */
@Slf4j
public class CodeGenerator {
    // 代码生成路径
    static final String CODE_PREFIX = "/src/main/java/com/iptv/business";
    // 测试用例生成路径
    static final String TEST_PREFIX = "/src/test/java/com/iptv/business";
    // 实体基类BaseEntity.class
    static final Class<?> BASE_ENTITY = BaseEntity.class;
    // 实体基类BaseController.class
    static final Class<?> BASE_CONTROLLER = BaseController.class;
    // 父类包
    static final String PARENT_PKG = "com.iptv.business";
    // 权限标识中使用的模块名
    static final String MODULE_NAME = "business";
    static final String AUTHOR = "kjsc";
    /**
     * 解析为「包含 iptv-modules/iptv-business 的 apps/backend 目录」。
     * user.dir 常为 iptv-generator 模块或仓库根目录，不能假定其下直接就是 iptv-modules。
     */
    static final String BASE_PATH = resolveBackendRoot().getPath();
    // entity、vo、dto模块父路径
    static final String ENTITY_MODULE_PATH = BASE_PATH + "/iptv-api/iptv-api-business" + CODE_PREFIX + "/api/domain";
    // 项目主模块
    static final String PROJECT_MODULE = BASE_PATH + "/iptv-modules/iptv-business";
    // 项目模块controller、service、mapper类路径
    static final String PROJECT_MODULE_PATH = PROJECT_MODULE + CODE_PREFIX + "/";
    // 项目模块controller、service、mapper类路径
    static final String PROJECT_MODULE_TEST_PATH = PROJECT_MODULE + TEST_PREFIX + "/";
    // mapper.xml生成路径
    static final String MAPPER_XML_PATH = PROJECT_MODULE + "/src/main/resources/mapper";
    // 生成的表
    static final String[] DATA_TABLES = {
            "agi_client"
    };
    // 实体基类字段 生成实体时会忽略这些字段，从父类继承
    static final String[] SUPER_ENTITY_COLS = {"update_by", "update_time", "create_by", "create_time"};

    private interface DataBaseConfig {
        String URL = "jdbc:mysql://192.168.180.243:3306/agent-middle-test?characterEncoding=utf8&useSSL=false&connectTimeout=60000&socketTimeout=60000&useTimezone=true&serverTimezone=Asia/Shanghai";
        String USERNAME = "hzjy";
        String PASSWORD = "f72aq!CREpzk";

    }


    public static void main(String[] args) {
        log.info("准备生成表: {}", String.join(", ", DATA_TABLES));

        if (!checkTablesExist(DataBaseConfig.URL, DataBaseConfig.USERNAME, DataBaseConfig.PASSWORD, DATA_TABLES)) {
            log.warn("未检测到任何待生成表（或数据库连接失败）。请核对：URL/账号密码/库名/表名。");
            return;
        }

        // 代码生成器
        AutoGenerator autoGenerator = new AutoGenerator();
        // 全局配置
        configGlobal(autoGenerator, PROJECT_MODULE, AUTHOR);
        // pkg设置
        configPkg(autoGenerator);
        // 数据源配置
        DataSourceConfig dsc = new DataSourceConfig();
        dsc.setDbType(DbType.MYSQL);
        dsc.setUrl(DataBaseConfig.URL);
        dsc.setUsername(DataBaseConfig.USERNAME);
        dsc.setPassword(DataBaseConfig.PASSWORD);
        dsc.setDriverName("com.mysql.cj.jdbc.Driver");
        autoGenerator.setDataSource(dsc);
        // 配置指定自定义模板参数和类型
        InjectionConfig cfg = new InjectionConfig() {
            @Override
            public void initMap() {
                Map<String, Object> map = new HashMap<>();
                map.put("baseResultMap", true);
                map.put("packageParent", PARENT_PKG);
                map.put("moduleName", MODULE_NAME);
                this.setMap(map);
            }
        };
        List<FileOutConfig> outConfigs = new ArrayList<>();
        importTemplate(outConfigs);

        cfg.setFileOutConfigList(outConfigs);
        autoGenerator.setCfg(cfg);

        // 配置策略
        StrategyConfig strategyConfig = new StrategyConfig();
        strategyConfig.setEntityLombokModel(true);
        // 实体基类和基类的字段
        if (BASE_ENTITY != null) {
            strategyConfig.setSuperEntityClass(BASE_ENTITY);
        }
        if (BASE_CONTROLLER != null) {
            strategyConfig.setSuperControllerClass(BASE_CONTROLLER);
        }
        strategyConfig.setSuperEntityColumns(SUPER_ENTITY_COLS);

        // 包含的表
        strategyConfig.setInclude(DATA_TABLES);
        strategyConfig.setNaming(NamingStrategy.underline_to_camel);
        strategyConfig.setColumnNaming(NamingStrategy.underline_to_camel);
        strategyConfig.setRestControllerStyle(true);
        autoGenerator.setStrategy(strategyConfig);
        // 配置模板
        configTemplate(autoGenerator);
        // 执行
        autoGenerator.execute();
    }

    static boolean checkTablesExist(String jdbcUrl, String username, String password, String[] tables) {
        // 必须用 extractDbName 提取数据库名，不能用 extractSchema
        String dbName = extractDbName(jdbcUrl);
        if (dbName == null || dbName.trim().isEmpty()) {
            log.warn("无法从 JDBC URL 解析数据库名: {}", jdbcUrl);
            return false;
        }

        String sql = "SELECT COUNT(*) AS cnt "
                + "FROM information_schema.tables "
                + "WHERE table_schema = ? "
                + "  AND table_name = ?";

        int hit = 0;
        try (Connection conn = DriverManager.getConnection(jdbcUrl, username, password)) {
            // 这里打印的应该会变成你的真实数据库名，比如 solution-cloud-test
            log.info("数据库连接成功，Database: {}", dbName);
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                for (String table : tables) {
                    ps.setString(1, dbName);
                    ps.setString(2, table);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next() && rs.getInt("cnt") > 0) {
                            hit++;
                        } else {
                            log.warn("未找到表: {}.{}", dbName, table);
                        }
                    }
                }
            }
        } catch (SQLException e) {
            log.error("数据库连接/查询失败: {}", e.getMessage(), e);
            return false;
        }

        log.info("表命中数量: {}/{}", hit, tables.length);
        return hit > 0;
    }


    static String extractDbName(String jdbcUrl) {
        // 1. 找到问号，把参数部分截掉，避免时zone里的 / 干扰
        int qIndex = jdbcUrl.indexOf('?');
        String mainUrl = (qIndex == -1) ? jdbcUrl : jdbcUrl.substring(0, qIndex);

        // 2. 在纯净的 URL (jdbc:mysql://host:port/dbname) 里找最后一个斜杠
        int slash = mainUrl.lastIndexOf('/');
        if (slash < 0 || slash + 1 >= mainUrl.length()) {
            return null;
        }

        // 3. 截取数据库名
        return mainUrl.substring(slash + 1);
    }


    static String extractSchema(String jdbcUrl) {
        if (jdbcUrl == null || !jdbcUrl.contains("currentSchema=")) {
            return null;
        }
        int start = jdbcUrl.indexOf("currentSchema=");
        int end = jdbcUrl.indexOf('&', start);
        if (end == -1) {
            return jdbcUrl.substring(start + "currentSchema=".length());
        }
        return jdbcUrl.substring(start + "currentSchema=".length(), end);
    }

    /**
     * 自当前工作目录向上查找 {@code iptv-modules/iptv-business}；若在仓库根下则为 {@code apps/backend/iptv-modules/iptv-business}。
     */
    static File resolveBackendRoot() {
        File dir = new File(System.getProperty("user.dir")).getAbsoluteFile();
        for (int i = 0; i < 12; i++) {
            File business = new File(dir, "iptv-modules/iptv-business");
            if (business.isDirectory()) {
                log.info("代码生成根目录(BASE_PATH): {}", dir.getPath());
                return dir;
            }
            File nested = new File(dir, "apps/backend/iptv-modules/iptv-business");
            if (nested.isDirectory()) {
                File backendRoot = new File(dir, "apps/backend");
                log.info("代码生成根目录(BASE_PATH): {}", backendRoot.getPath());
                return backendRoot;
            }
            File parent = dir.getParentFile();
            if (parent == null) {
                break;
            }
            dir = parent;
        }
        File fallback = new File(System.getProperty("user.dir")).getAbsoluteFile();
        log.warn("未找到 iptv-modules/iptv-business，将使用 user.dir 作为 BASE_PATH（可能无法生成到正确模块）: {}", fallback.getPath());
        return fallback;
    }

    /**
     * * 代码生成模板
     *
     * @param configs
     */
    static void importTemplate(List<FileOutConfig> configs) {
        // 自定义配置会被优先输出--entity、vo、dto
        configs.add(new CodeFileOutConfig("/entity.java.ftl", ENTITY_MODULE_PATH, ".java"));

        configs.add(new CodeFileOutConfig("/vo.java.ftl", ENTITY_MODULE_PATH + "/vo", "VO.java"));
        configs.add(new CodeFileOutConfig("/dto.java.ftl", ENTITY_MODULE_PATH + "/dto", "DTO.java"));
        configs.add(new CodeFileOutConfig("/pageDto.java.ftl", ENTITY_MODULE_PATH + "/dto/page", "PageDTO.java"));

        // xml 文件
        configs.add(new CodeFileOutConfig("/mapper.xml.ftl", MAPPER_XML_PATH, "Mapper" + StringPool.DOT_XML));
        // 业务层类文件
        configs.add(new CodeFileOutConfig("/mapper.java.ftl", PROJECT_MODULE_PATH + "mapper", "Mapper.java"));
        configs.add(
                new CodeFileOutConfig("/controller.java.ftl", PROJECT_MODULE_PATH + "controller", "Controller.java"));
        configs.add(new CodeFileOutConfig("/service.java.ftl", PROJECT_MODULE_PATH + "service", "Service.java"));
        configs.add(new CodeFileOutConfig("/serviceImpl.java.ftl", PROJECT_MODULE_PATH + "service/impl",
                "ServiceImpl.java"));
        // 测试用例类
//        configs.add(new CodeFileOutConfig("/controllerTest.java.ftl", PROJECT_MODULE_TEST_PATH + "controller",
//                "ControllerTest.java"));

    }

    /**
     * 全局配置
     *
     * @param autoGenerator
     * @param projectPath
     * @param author
     */
    private static void configGlobal(AutoGenerator autoGenerator, String projectPath, String author) {
        // 全局配置
        GlobalConfig gc = new GlobalConfig();
        gc.setOutputDir(projectPath + "/src/main/java");
        gc.setAuthor(author);
        gc.setOpen(false);
        gc.setSwagger2(true);
        gc.setBaseResultMap(true);
        gc.setBaseColumnList(true);
        // 不要带I
        gc.setServiceName("%s" + ConstVal.SERVICE);
        autoGenerator.setGlobalConfig(gc);
    }

    /**
     * pkg配置
     *
     * @param autoGenerator
     */
    private static void configPkg(AutoGenerator autoGenerator) {
        PackageConfig packageConfig = new PackageConfig();
        packageConfig.setParent(PARENT_PKG);
        packageConfig.setController("controller");
        packageConfig.setService("service");
        packageConfig.setServiceImpl("service.impl");
        packageConfig.setMapper("mapper");
        packageConfig.setEntity("api.domain");
        autoGenerator.setPackageInfo(packageConfig);
    }

    /**
     * 模板配置
     *
     * @param autoGenerator
     */
    private static void configTemplate(AutoGenerator autoGenerator) {
        TemplateConfig templateConfig = new TemplateConfig();
        // 只使用前面的自定义生成模板
        templateConfig.setController("");
        templateConfig.setService("");
        templateConfig.setServiceImpl("");
        templateConfig.setEntity("");
        templateConfig.setMapper("");

        templateConfig.setXml(null);
        autoGenerator.setTemplate(templateConfig);
        autoGenerator.setTemplateEngine(new FreemarkerTemplateEngine());
    }

}