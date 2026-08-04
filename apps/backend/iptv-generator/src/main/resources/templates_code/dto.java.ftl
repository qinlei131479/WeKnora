package ${package.Entity}.dto;

<#list table.importPackages as pkg>
<#if !(pkg?contains('mybatis') || pkg?contains('entity'))>
<#if pkg == 'java.time.LocalDateTime'>
import java.util.Date;
<#else >
import ${pkg};
</#if>
</#if>
</#list>
import java.io.Serializable;
<#if entityLombokModel>
import lombok.Data;
import lombok.EqualsAndHashCode;
    <#if chainModel>
import lombok.experimental.Accessors;
    </#if>
</#if>
import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.NotNull;
import com.iptv.common.core.web.domain.dto.BaseDTO;

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
@EqualsAndHashCode(callSuper = true)
<#--    <#if chainModel>-->
<#--@Accessors(chain = true)-->
<#--    </#if>-->
</#if>
public class ${entity}DTO extends BaseDTO implements Serializable {

<#if entitySerialVersionUID>
    private static final long serialVersionUID = 1L;
</#if>
<#list table.fields as field>

    <#if field.propertyName == 'id'>
    @NotNull(message = "ID不能为空", groups = { BaseDTO.Update.class })
    </#if>
    <#if field.comment!?length gt 0>
    /**
     * ${field.comment}
     */
    </#if>
    @Schema(description= "${field.comment}")
    <#if field.propertyType == 'LocalDateTime'>
    private Date ${field.propertyName};
    <#else>
    private ${field.propertyType} ${field.propertyName};
    </#if>
</#list>
<#------------  END 字段循环遍历  ---------->
<#if !entityLombokModel>
    <#list table.fields as field>
        <#if field.propertyType == "boolean">
            <#assign getprefix="is"/>
        <#else>
            <#assign getprefix="get"/>
        </#if>
        <#if field.propertyType == "LocalDateTime">
            <#assign betterPropertyType="Date"/>
        <#else>
            <#assign betterPropertyType="${field.propertyType}"/>
        </#if>

    public ${betterPropertyType} ${getprefix}${field.capitalName}() {
        return ${field.propertyName};
    }

    <#if chainModel>
    public ${entity}DTO set${field.capitalName}(${betterPropertyType} ${field.propertyName}) {
    <#else>
    public void set${field.capitalName}(${betterPropertyType} ${field.propertyName}) {
    </#if>
        this.${field.propertyName} = ${field.propertyName};
        <#if chainModel>
        return this;
        </#if>
    }
    </#list>
</#if>

<#if !entityLombokModel>
    @Override
    public String toString() {
        return "${entity}DTO{" +
    <#list table.fields as field>
        <#if field_index==0>
            "${field.propertyName}=" + ${field.propertyName} +
        <#else>
            ", ${field.propertyName}=" + ${field.propertyName} +
        </#if>
    </#list>
        "}";
    }
</#if>
}
