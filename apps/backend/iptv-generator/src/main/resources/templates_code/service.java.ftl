package ${package.Service};

import jakarta.annotation.Nonnull;

import java.util.List;
import ${package.Entity}.${entity};
import ${package.Entity}.vo.${entity}VO;
import ${package.Entity}.dto.${entity}DTO;
import ${package.Entity}.dto.page.${entity}PageDTO;
import ${superServiceClassPackage};
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;

/**
* <p>
    * ${table.comment!} 服务类
    * </p>
*
* @author ${author}
* @since ${date}
*/
<#if kotlin>
interface ${table.serviceName} : ${superServiceClass}<${entity}>
<#else>
public interface ${table.serviceName} extends IService<${entity}>{

    /**
    * 分页查询
    *
    * @param dto
    * @param pg
    * @return
    */
    TableDataInfo <${entity}VO> queryPage(${entity}PageDTO dto, PageDTO pg);

    /**
    * 按id查询
    *
    * @param id
    * @return
    */
    ${entity}VO queryById(@Nonnull Long id);

    /**
    * 更新
    *
    * @param vo
    * @return
    */
    ${entity} update(@Nonnull ${entity}DTO vo);

    /**
    * 新增
    *
    * @param vo
    * @return
    */
    ${entity} insert(@Nonnull ${entity}DTO vo);

    /**
    * 删除
    *
    * @param id
    */
    void deleteById(@Nonnull Long id);
<#-- 检测表中是否存在 enabled 字段 -->
<#assign hasEnabled = false>
<#list table.fields as field>
    <#if field.name == "enabled">
        <#assign hasEnabled = true>
    </#if>
</#list>
<#if hasEnabled>

    /**
    * 批量启用/停用
    *
    * @param ids     主键列表
    * @return 影响行数
    */
    int updateEnabledBatch(@Nonnull List<Long> ids);

    /**
    * 批量停用
    *
    * @param ids     主键列表
    * @return 影响行数
    */
    int updateDisabledBatch(@Nonnull List<Long> ids);
</#if>
}
    </#if>
