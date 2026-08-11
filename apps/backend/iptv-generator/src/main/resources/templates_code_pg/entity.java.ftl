package ${package.Entity};

<#-- 1. 基础导入 -->
<#list table.importPackages as pkg>
<#if pkg == 'java.time.LocalDateTime'>
import java.util.Date;
<#else>
import ${pkg};
</#if>
</#list>
<#if entityLombokModel>
import lombok.Data;
import lombok.EqualsAndHashCode;
</#if>
import io.swagger.v3.oas.annotations.media.Schema;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;

<#-- 2. 动态检查是否有 jsonb 列，如果有才导入 JsonbTypeHandler -->
<#assign hasJsonb = false>
<#if pgJsonbColumns??>
    <#list table.fields as f>
        <#if pgJsonbColumns?keys?seq_contains(f.name?lower_case)>
            <#assign hasJsonb = true>
        </#if>
    </#list>
</#if>
<#-- 检查后缀匹配 -->
<#if !hasJsonb && pgJsonbSuffixes?? && (pgJsonbSuffixes?size > 0)>
    <#list table.fields as f>
        <#list pgJsonbSuffixes as suffix>
            <#if f.name?ends_with(suffix)>
                <#assign hasJsonb = true>
            </#if>
        </#list>
    </#list>
</#if>

<#if hasJsonb>
import com.iptv.common.core.typehandler.JsonbTypeHandler;
</#if>

/**
 * <p>
 * ${table.comment!}
 * </p>
 *
 * @author ${author}
 * @since ${date}
 */
<#if entityLombokModel>
@Data
<#if superEntityClass??>
@EqualsAndHashCode(callSuper = true)
<#else>
@EqualsAndHashCode(callSuper = false)
</#if>
</#if>
<#if table.convert>
<#if hasJsonb>
@TableName(value = "${table.name}", autoResultMap = true)
<#else>
@TableName("${table.name}")
</#if>
</#if>
<#if superEntityClass??>
public class ${entity} extends ${superEntityClass}<#if activeRecord><${entity}></#if> {
<#elseif activeRecord>
public class ${entity} extends Model<${entity}> {
<#else>
public class ${entity} implements java.io.Serializable {
</#if>

<#if entitySerialVersionUID>
    private static final long serialVersionUID = 1L;
</#if>
<#list table.fields as field>

    <#if field.comment?? && (field.comment?length > 0)>
    /**
     * ${field.comment}
     */
    </#if>

    <#-- 3. 字段级别检查是否为 jsonb 列 -->
    <#assign isJsonb = false>
    <#if pgJsonbColumns?? && pgJsonbColumns?keys?seq_contains(field.name?lower_case)>
        <#assign isJsonb = true>
    <#elseif pgJsonbSuffixes?? && (pgJsonbSuffixes?size > 0)>
        <#list pgJsonbSuffixes as suffix>
            <#if !isJsonb && field.name?ends_with(suffix)>
                <#assign isJsonb = true>
            </#if>
        </#list>
    </#if>

    @Schema(description = "${field.comment}")
    <#if field.keyFlag>
        <#if field.keyIdentityFlag>
    @TableId(value = "${field.annotationColumnName}", type = IdType.AUTO)
        <#elseif idType??>
    @TableId(value = "${field.annotationColumnName}", type = IdType.${idType})
        <#elseif field.convert>
    @TableId("${field.annotationColumnName}")
        </#if>
    <#elseif field.fill??>
        <#if field.convert>
    @TableField(value = "${field.annotationColumnName}", fill = FieldFill.${field.fill})
        <#else>
    @TableField(fill = FieldFill.${field.fill})
        </#if>
    <#elseif field.convert>
        <#if isJsonb>
    @TableField(value = "${field.annotationColumnName}", typeHandler = JsonbTypeHandler.class)
        <#else>
    @TableField("${field.annotationColumnName}")
        </#if>
    <#elseif isJsonb>
    @TableField(typeHandler = JsonbTypeHandler.class)
    </#if>
    <#if (versionFieldName!"") == field.name>
    @Version
    </#if>
    <#if (logicDeleteFieldName!"") == field.name>
    @TableLogic
    </#if>
    <#if field.propertyType == 'LocalDateTime'>
    private Date ${field.propertyName};
    <#else>
    private ${field.propertyType} ${field.propertyName};
    </#if>
</#list>
}