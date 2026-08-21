package com.iptv.common.mybatisplus.config.pgsql;

import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import org.apache.ibatis.reflection.MetaObject;

import java.util.Date;

/**
 * 插入、更新操作，自动注入值
 * 通过 MybatisPlusConfig#metaObjectHandler() 注册为 Bean
 */
public class PostgresUpdateHandler implements MetaObjectHandler {
    private String CREATE_TIME = "createdAt";
    private String UPDATE_TIME = "updatedAt";

    @Override
    public void insertFill(MetaObject metaObject) {
        Date date = new Date();
        if (metaObject.hasSetter(CREATE_TIME) && metaObject.getValue(CREATE_TIME) == null) {
            setFieldValByName(CREATE_TIME, date, metaObject);
        }
        if (metaObject.hasSetter(UPDATE_TIME) && metaObject.getValue(UPDATE_TIME) == null) {
            setFieldValByName(UPDATE_TIME, date, metaObject);
        }
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        Date date = new Date();
        if (metaObject.hasSetter(UPDATE_TIME)) {
            setFieldValByName(UPDATE_TIME, date, metaObject);
        }
    }
}
