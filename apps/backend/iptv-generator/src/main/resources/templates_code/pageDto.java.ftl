package ${cfg.packageParent}.api.domain.dto.page;

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
import com.iptv.common.core.web.page.PageDTO;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Schema;

<#if entityLombokModel>
import lombok.Data;
import lombok.EqualsAndHashCode;
    <#if chainModel>
import lombok.experimental.Accessors;
    </#if>
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
@EqualsAndHashCode(callSuper = false)
<#--@Accessors(chain = true)-->
</#if>
<#if swagger2>
@Tag(name="${table.comment!} pageDTO")
</#if>
public class ${entity}PageDTO extends PageDTO implements Serializable {
    private static final long serialVersionUID = 1L;
<#list table.fields as field>
    <#if field.comment!?length gt 0>
        <#if swagger2>
    @Schema(description = "${field.comment}")
        <#else>
    /**
     * ${field.comment}
     */
        </#if>
    </#if>
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
    public ${entity} set${field.capitalName}(${betterPropertyType} ${field.propertyName}) {
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
        return "${entity}{" +
    <#list table.commonFields as field>
        <#if field_index==0>
            "${field.propertyName}=" + ${field.propertyName} +
        <#else>
            ", ${field.propertyName}=" + ${field.propertyName} +
        </#if>
    </#list>
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
