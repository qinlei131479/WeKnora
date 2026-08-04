<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="${package.Mapper}.${table.mapperName}">

    <#if enableCache>
    <!-- 开启二级缓存 -->
    <cache type="org.mybatis.caches.ehcache.LoggingEhcache"/>
    </#if>
    <#if baseResultMap>
    <!-- 通用查询映射结果 -->
    <resultMap id="BaseResultMap" type="${package.Entity}.${entity}">
        <#list table.fields as field>
            <#if field.keyFlag><#--生成主键排在第一位-->
        <id column="${field.name}" property="${field.propertyName}"/>
            </#if>
        </#list>
        <#list table.commonFields as field><#--生成公共字段 -->
        <result column="${field.name}" property="${field.propertyName}"/>
        </#list>
        <#list table.fields as field>
            <#if !field.keyFlag><#--生成普通字段 -->
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

    <select id="queryPage" resultMap="BaseResultMap" parameterType="${package.Entity}.dto.page.${entity}PageDTO">
        SELECT
        <include refid="Base_Column_List"/>
        FROM ${table.name}
        <where>
            <#list table.fields as field>
            <#if field.propertyType == 'String'>
            <if test="param.${field.propertyName} != null and param.${field.propertyName} != ''">
            <#else>
            <#if field.propertyType == 'String'>
            <if test="param.${field.propertyName} != null and param.${field.propertyName} != ''">
            <#else>
            <if test="param.${field.propertyName} != null">
            </#if>
            </#if>
            <#if field.propertyType == 'String'>
                AND ${field.annotationColumnName} LIKE CONCAT('%', ${"#{"}param.${field.propertyName}${"}"}, '%')
            <#else>
                AND ${field.annotationColumnName} = ${"#{"}param.${field.propertyName}${"}"}
            </#if>
            </if>
            </#list>
        </where>
    </select>

</mapper>
