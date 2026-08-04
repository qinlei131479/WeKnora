package com.iptv.common.mybatisplus.config;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import com.iptv.common.security.utils.SecurityUtils;
import org.apache.ibatis.reflection.MetaObject;
import java.util.Date;

/**
 * 插入、更新操作，自动注入值
 * 通过 MybatisPlusConfig#metaObjectHandler() 注册为 Bean
 */
public class MybatisUpdateHandler implements MetaObjectHandler {
	private String CREATE_TIME = "createTime";
	private String UPDATE_TIME = "updateTime";
	private String CREATE_BY = "createBy";
	private String UPDATE_BY = "updateBy";

	@Override
	public void insertFill(MetaObject metaObject) {
		Date date = new Date();
		if (metaObject.hasSetter(CREATE_TIME) && metaObject.getValue(CREATE_TIME) == null) {
			setFieldValByName(CREATE_TIME, date, metaObject);
		}
		if (metaObject.hasSetter(UPDATE_TIME) && metaObject.getValue(UPDATE_TIME) == null) {
			setFieldValByName(UPDATE_TIME, date, metaObject);
		}
		String userName = SecurityUtils.getUsername();
		if (StrUtil.isNotEmpty(userName)) {
			if (metaObject.hasSetter(CREATE_BY) && metaObject.getValue(CREATE_BY) == null) {
				setFieldValByName(CREATE_BY, userName, metaObject);
			}
			if (metaObject.hasSetter(UPDATE_BY) && metaObject.getValue(UPDATE_BY) == null) {
				setFieldValByName(UPDATE_BY, userName, metaObject);
			}
		}
	}

	@Override
	public void updateFill(MetaObject metaObject) {
		Date date = new Date();
		if (metaObject.hasSetter(UPDATE_TIME)) {
			setFieldValByName(UPDATE_TIME, date, metaObject);
		}
		String userName = SecurityUtils.getUsername();
		if (metaObject.hasSetter(UPDATE_BY)) {
			setFieldValByName(UPDATE_BY, userName, metaObject);
		}
	}
}
