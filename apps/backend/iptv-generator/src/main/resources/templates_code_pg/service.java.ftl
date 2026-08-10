package ${package.Service};

import jakarta.annotation.Nonnull;
import ${package.Entity}.${entity};
import ${package.Entity}.vo.${entity}VO;
import ${package.Entity}.dto.${entity}DTO;
import ${package.Entity}.dto.page.${entity}PageDTO;
import ${superServiceClassPackage};
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;

import java.util.List;

/**
 * <p>
 * ${table.comment!} 服务类（PostgreSQL）
 * </p>
 *
 * @author ${author}
 * @since ${date}
 */
public interface ${table.serviceName} extends IService<${entity}> {

    /**
     * 分页查询
     *
     * @param dto 查询条件
     * @param pg  分页参数
     * @return 分页结果
     */
    TableDataInfo<${entity}VO> queryPage(${entity}PageDTO dto, PageDTO pg);

    /**
     * 按 id 查询
     *
     * @param id 主键
     * @return 实体
     */
    ${entity}VO queryById(@Nonnull Long id);

    /**
     * 新增
     *
     * @param dto 实体
     * @return 已保存实体
     */
    ${entity}VO insert(@Nonnull ${entity}DTO dto);

    /**
     * 按 id 更新
     *
     * @param dto 实体
     * @return 已更新实体
     */
    ${entity}VO update(@Nonnull ${entity}DTO dto);

    /**
     * 按 id 删除
     *
     * @param id 主键
     */
    void deleteById(@Nonnull Long id);
<#assign hasEnabled = false>
<#list table.fields as field>
    <#if field.name == "enabled">
        <#assign hasEnabled = true>
    </#if>
</#list>
<#if hasEnabled>

    /**
     * 批量启用
     *
     * @param ids 主键列表
     * @return 影响行数
     */
    int updateEnabledBatch(@Nonnull List<Long> ids);

    /**
     * 批量停用
     *
     * @param ids 主键列表
     * @return 影响行数
     */
    int updateDisabledBatch(@Nonnull List<Long> ids);
</#if>
}
