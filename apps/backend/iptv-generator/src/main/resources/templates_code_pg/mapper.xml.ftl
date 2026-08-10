<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="${package.Mapper}.${table.mapperName}">

    <#if baseResultMap>
    <!-- 通用查询映射结果 -->
    <resultMap id="BaseResultMap" type="${package.Entity}.${entity}">
        <#list table.fields as field>
        <#if field.keyFlag>
        <id column="${field.name}" property="${field.propertyName}"/>
        </#if>
        </#list>
        <#list table.commonFields as field>
        <result column="${field.name}" property="${field.propertyName}"/>
        </#list>
        <#list table.fields as field>
        <#if !field.keyFlag>
        <result column="${field.name}" property="${field.propertyName}"/>
        </#if>
        </#list>
    </resultMap>

    </#if>
    <#if baseColumnList>
    <!-- 通用查询结果列 -->
    <sql id="Base_Column_List">
        <#list table.commonFields as field>
        ${field.columnName},
        </#list>
        ${table.fieldNames}
    </sql>
    </#if>

    <!-- 分页查询（PostgreSQL：字符串使用 ILIKE 大小写不敏感模糊查询） -->
    <select id="queryPage" resultMap="BaseResultMap" parameterType="${cfg.packageParent}.domain.dto.page.${entity}PageDTO">
        SELECT
        <include refid="Base_Column_List"/>
        FROM ${table.name}
        <where>
            <#list table.commonFields as field>
            <#if field.propertyType == 'String'>
            <if test="param.${field.propertyName} != null and param.${field.propertyName} != ''">
                AND ${field.annotationColumnName} ILIKE CONCAT('%', ${"#{"}param.${field.propertyName}${"}"}, '%')
            </if>
            <#else>
            <if test="param.${field.propertyName} != null">
                AND ${field.annotationColumnName} = ${"#{"}param.${field.propertyName}${"}"}
            </if>
            </#if>
            </#list>
            <#list table.fields as field>
            <#if field.propertyType == 'String'>
            <if test="param.${field.propertyName} != null and param.${field.propertyName} != ''">
                AND ${field.annotationColumnName} ILIKE CONCAT('%', ${"#{"}param.${field.propertyName}${"}"}, '%')
            </if>
            <#else>
            <if test="param.${field.propertyName} != null">
                AND ${field.annotationColumnName} = ${"#{"}param.${field.propertyName}${"}"}
            </if>
            </#if>
            </#list>
        </where>
        ORDER BY id DESC
    </select>

</mapper>
