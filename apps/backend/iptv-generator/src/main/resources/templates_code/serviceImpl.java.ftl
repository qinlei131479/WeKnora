package ${package.ServiceImpl};

import jakarta.annotation.Nonnull;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.iptv.common.core.enums.EnableEnum;

import cn.hutool.core.bean.BeanUtil;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import ${package.Entity}.${entity};
import ${package.Entity}.vo.${entity}VO;
import ${package.Entity}.dto.${entity}DTO;
import ${package.Entity}.dto.page.${entity}PageDTO;
import ${package.Mapper}.${table.mapperName};
import ${package.Service}.${table.serviceName};

import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import ${superServiceImplClassPackage};

import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.transaction.annotation.Transactional;

import com.iptv.common.core.exception.ServiceException;
/**
 * <p>
 * ${table.comment!} 服务实现类
 * </p>
 *
 * @author ${author}
 * @since ${date}
 */
@Service
<#if kotlin>
open class ${table.serviceImplName} : ${superServiceImplClass}<${table.mapperName}, ${entity}>(), ${table.serviceName} {

}
<#else>
public class ${table.serviceImplName} extends ServiceImpl<${table.mapperName}, ${entity}> implements ${table.serviceName} {

    @Override
    public TableDataInfo<${entity}VO> queryPage(${entity}PageDTO dto, PageDTO pg) {
        Page page = PageUtils.toPage(pg);
        List<${entity}> list = this.baseMapper.queryPage(dto, page);
        List<${entity}VO> voList = BeanUtil.copyToList(list, ${entity}VO.class);
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public ${entity}VO queryById(@Nonnull Long id) {
        ${entity} entity = this.baseMapper.selectById(id);
        ${entity}VO vo = BeanUtil.copyProperties(entity, ${entity}VO.class);
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ${entity} insert(@Nonnull ${entity}DTO dto) {
        ${entity} entity = BeanUtil.copyProperties(dto, ${entity}.class);
        this.baseMapper.insert(entity);
        return entity;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ${entity} update(@Nonnull ${entity}DTO dto) {
        ${entity} entity = this.baseMapper.selectById(dto.getId());
        if (BeanUtil.isEmpty(entity)) {
            // 不存在
            throw new ServiceException("不存在");
        }
        BeanUtil.copyProperties(dto, entity);
        this.baseMapper.updateById(entity);
        return entity;
    }

    @Override
    public void deleteById(@Nonnull Long id) {
        ${entity} entity = this.baseMapper.selectById(id);
        if (BeanUtil.isNotEmpty(entity)) {
            this.baseMapper.deleteById(id);
        }
    }
<#-- 检测表中是否存在 enabled 字段 -->
<#assign hasEnabled = false>
<#list table.fields as field>
    <#if field.name == "enabled">
        <#assign hasEnabled = true>
    </#if>
</#list>
<#if hasEnabled>

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int updateEnabledBatch(@Nonnull List<Long> ids) {
        if (ids.isEmpty()) {
            return 0;
        }
    return this.baseMapper
        .update(new LambdaUpdateWrapper<${entity}>()
        .in(${entity}::getId, ids)
        .set(${entity}::getEnabled, EnableEnum.ENABLE.getCode()));
}

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int updateDisabledBatch(@Nonnull List<Long> ids) {
        if (ids.isEmpty()) {
        return 0;
        }
        return this.baseMapper
            .update(new LambdaUpdateWrapper<${entity}>()
            .in(${entity}::getId, ids)
            .set(${entity}::getEnabled, EnableEnum.DISABLE.getCode()));
    }
</#if>
}
</#if>
