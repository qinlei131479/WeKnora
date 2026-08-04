package com.iptv.generator;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.core.toolkit.StringPool;
import com.baomidou.mybatisplus.generator.AutoGenerator;
import com.baomidou.mybatisplus.generator.InjectionConfig;
import com.baomidou.mybatisplus.generator.config.*;
import com.baomidou.mybatisplus.generator.config.rules.NamingStrategy;
import com.baomidou.mybatisplus.generator.engine.FreemarkerTemplateEngine;
import com.iptv.common.core.web.domain.BaseEntity;
import com.iptv.generator.config.CodeFileOutConfig;

import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;

/**
 * 基础业务逻辑代码生成
 * 
 * @author apple
 */
@Slf4j
public class CodeGeneratorBak {

	static String entityDir;
	static String voDir;
	static String dtoDir;
	static String mapperDir;
	static String mapperXmlDir;
	static String serviceDir;
	static String controllerDir;
	static String serviceImplDir;

	// 生成路径
	static final String codePrefix = "/src/main/java/com/iptv/v4/system";
	static final String xmlPrefix = "/src/main/resources/mapper/system";
	static final String moduleName = "iptv-v4-modules-system";
	// 父模块名称，若无，置空即可
	static final String parentModuleName = "iptv-v4-modules";
	//实体类存放模块路径，实体类可存放在其他模块，若为空，则与controller、service等存放在相同模块下
	static final String entityModuleName = "iptv-v4-api/iptv-v4-api-system";

	// 是否覆盖
	static final boolean override = false;
	// 父类包
	static final String parentPkg = "com.iptv.v4.system";
	static final String author = "qinlei";
	// 模板路径
	static final String templatePath = "/templates_code";
	// 生成的表
	static final String[] dataTables = { "data_table" };
	// 实体基类字段 生成实体时会忽略这些字段，从父类继承
	static final String[] superEntityCols = { "update_by", "update_time", "create_by", "create_time" };
	// 实体基类
	// BaseEntity.class
	static final Class<?> baseEntity = BaseEntity.class;

	private interface DataBaseConfig {
		String url = "jdbc:mysql://192.168.180.250:3306/kjsc_ruoyi?useUnicode=true&useSSL=false&characterEncoding=utf8";
		String username = "hzjy";
		String password = "knEs97Kx9aiX";

	}

	public static void main(String[] args) {
		// 代码生成器
		AutoGenerator autoGenerator = new AutoGenerator();
		String basePath = System.getProperty("user.dir");
		String projectPath = basePath + (StrUtil.isNotBlank(parentModuleName) ? "/" + parentModuleName : "") + "/"
				+ moduleName;
		String entityPath;
		if (StrUtil.isBlank(entityModuleName)) {
			entityPath = projectPath;
		} else {
			entityPath = basePath + "/" + entityModuleName;
		}

		// 初始化输出文件夹
		init(projectPath + codePrefix, entityPath + codePrefix, projectPath + xmlPrefix);
		// 删除之前生成的数据
		if (override) {
			deleteDir();
		}
		// 全局配置
		configGlobal(autoGenerator, projectPath, author);
		// pkg设置
		configPkg(autoGenerator);
		// 数据源配置
		DataSourceConfig dsc = new DataSourceConfig();
		dsc.setDbType(DbType.MYSQL);
		dsc.setUrl(DataBaseConfig.url);
		dsc.setSchemaName("public");
		dsc.setDriverName("com.mysql.cj.jdbc.Driver");
		dsc.setUsername(DataBaseConfig.username);
		dsc.setPassword(DataBaseConfig.password);
		autoGenerator.setDataSource(dsc);
		// 配置指定自定义模板参数和类型
		InjectionConfig cfg = new InjectionConfig() {
			@Override
			public void initMap() {
				Map<String, Object> map = new HashMap<>();
				map.put("baseResultMap", true);
				map.put("packageParent", parentPkg);
				this.setMap(map);
			}
		};
		List<FileOutConfig> focList = new ArrayList<>();
		importTemplate(focList, templatePath);
		cfg.setFileOutConfigList(focList);
		autoGenerator.setCfg(cfg);

		// 配置策略
		StrategyConfig strategyConfig = new StrategyConfig();
		strategyConfig.setEntityLombokModel(true);
		// 实体基类和基类的字段
		if (baseEntity != null) {
			strategyConfig.setSuperEntityClass(baseEntity);
		}
		strategyConfig.setSuperEntityColumns(superEntityCols);

		// 包含的表
		strategyConfig.setInclude(dataTables);
		strategyConfig.setNaming(NamingStrategy.underline_to_camel);
		strategyConfig.setColumnNaming(NamingStrategy.underline_to_camel);
		strategyConfig.setRestControllerStyle(true);
		autoGenerator.setStrategy(strategyConfig);
		// 配置模板
		configTemplate(autoGenerator);
		// 执行
		autoGenerator.execute();
	}

	/**
	 * 初始化文件路径
	 * @param codePrefixPath java类文件路径，包括 controller、service、mapper
	 * @param entityPath	实体文件路径，包括 entity、vo、dto
	 * @param xmlPath		xml文件路径
	 */
	static void init(String codePrefixPath, String entityPath, String xmlPath) {
		entityDir = entityPath + "/domain/entity";
		voDir = entityPath + "/domain/vo";
		dtoDir = entityPath + "/domain/dto";
		mapperDir = codePrefixPath + "/mapper";
		mapperXmlDir = xmlPath;
		serviceDir = codePrefixPath + "/service";
		serviceImplDir = codePrefixPath + "/service/impl";
		controllerDir = codePrefixPath + "/controller";
	}

	static void init(String codePrefixPath, String xmlPath) {
		init(codePrefixPath, codePrefixPath, xmlPath);
	}


	static void deleteDir() {
		List<String> dirs = new ArrayList<>();
		dirs.add(entityDir);
		dirs.add(voDir);
		dirs.add(dtoDir);
		dirs.add(mapperDir);
		dirs.add(mapperXmlDir);
		dirs.add(serviceDir);
		dirs.add(serviceImplDir);
		dirs.add(controllerDir);
		for (String per : dirs) {
			if (FileUtil.exist(per)) {
				FileUtil.del(per);
			} else {
				log.warn("no dir" + per);
			}
		}
	}

	static void importTemplate(List<FileOutConfig> focList, String templatePath) {
		String entityTemplatePath = templatePath + "/entity.java.ftl";
		String mapperTemplatePath = templatePath + "/mapper.java.ftl";
		String mapperXmlTemplatePath = templatePath + "/mapper.xml.ftl";
		String voTemplatePath = templatePath + "/vo.java.ftl";
		String dtoTemplatePath = templatePath + "/dto.java.ftl";

		String controllerTemplatePath = templatePath + "/controller.java.ftl";
		String serviceTemplatePath = templatePath + "/service.java.ftl";
		String serviceImplTemplatePath = templatePath + "/serviceImpl.java.ftl";
		// 自定义配置会被优先输出
		focList.add(new CodeFileOutConfig(entityTemplatePath, entityDir, ".java"));
		focList.add(new CodeFileOutConfig(voTemplatePath, voDir, "VO.java"));
		focList.add(new CodeFileOutConfig(dtoTemplatePath, dtoDir, "DTO.java"));
		focList.add(new CodeFileOutConfig(mapperTemplatePath, mapperDir, "Mapper.java"));
		focList.add(new CodeFileOutConfig(mapperXmlTemplatePath, mapperXmlDir, "Mapper" + StringPool.DOT_XML));
		focList.add(new CodeFileOutConfig(controllerTemplatePath, controllerDir, "Controller.java"));
		focList.add(new CodeFileOutConfig(serviceTemplatePath, serviceDir, "Service.java"));
		focList.add(new CodeFileOutConfig(serviceImplTemplatePath, serviceImplDir, "ServiceImpl.java"));
	}

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

	private static void configPkg(AutoGenerator autoGenerator) {
		PackageConfig packageConfig = new PackageConfig();
		packageConfig.setParent(parentPkg);
		packageConfig.setController("controller");
		packageConfig.setService("service");
		packageConfig.setServiceImpl("service.impl");
		packageConfig.setMapper("mapper");
		packageConfig.setEntity("domain.entity");
		autoGenerator.setPackageInfo(packageConfig);
	}

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