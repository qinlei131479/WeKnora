package ${package.ServiceImpl};

import jakarta.annotation.Nonnull;
import cn.hutool.core.bean.BeanUtil;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.common.core.enums.EnableEnum;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import ${package.Entity}.${entity};
import ${package.Entity}.vo.${entity}VO;
import ${package.Entity}.dto.${entity}DTO;
import ${package.Entity}.dto.page.${entity}PageDTO;


import ${package.Mapper}.${table.mapperName};
import ${package.Service}.${table.serviceName};
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * <p>
 * ${table.comment!} 服务实现类（PostgreSQL）
 * </p>
 *
 * @author ${author}
 * @since ${date}
 */
@Service
public class ${table.serviceImplName} extends ServiceImpl<${table.mapperName}, ${entity}> implements ${table.serviceName} {

    @Override
    public TableDataInfo<${entity}VO> queryPage(${entity}PageDTO dto, PageDTO pg) {
        Page<${entity}VO> page = PageUtils.toPage(pg);
        List<${entity}> list = this.baseMapper.queryPage(dto, page);
        List<${entity}VO> voList = BeanUtil.copyToList(list, ${entity}VO.class);
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public ${entity}VO queryById(@Nonnull Long id) {
        ${entity} entity = this.baseMapper.selectById(id);
        return BeanUtil.copyProperties(entity, ${entity}VO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ${entity}VO insert(@Nonnull ${entity}DTO dto) {
        ${entity} entity = BeanUtil.copyProperties(dto, ${entity}.class);
        this.baseMapper.insert(entity);
        return BeanUtil.copyProperties(entity, ${entity}VO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ${entity}VO update(@Nonnull ${entity}DTO dto) {
        ${entity} entity = this.baseMapper.selectById(dto.getId());
        if (BeanUtil.isEmpty(entity)) {
            throw new ServiceException("${table.comment!}不存在");
        }
        BeanUtil.copyProperties(dto, entity);
        this.baseMapper.updateById(entity);
        return BeanUtil.copyProperties(entity, ${entity}VO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(@Nonnull Long id) {
        ${entity} entity = this.baseMapper.selectById(id);
        if (BeanUtil.isNotEmpty(entity)) {
            this.baseMapper.deleteById(id);
        }
    }
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
        if (ids.isEmpty()) return 0;
        return this.baseMapper.update(new LambdaUpdateWrapper<${entity}>()
                .in(${entity}::getId, ids)
                .set(${entity}::getEnabled, EnableEnum.ENABLE.getCode()));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int updateDisabledBatch(@Nonnull List<Long> ids) {
        if (ids.isEmpty()) return 0;
        return this.baseMapper.update(new LambdaUpdateWrapper<${entity}>()
                .in(${entity}::getId, ids)
                .set(${entity}::getEnabled, EnableEnum.DISABLE.getCode()));
    }
</#if>
}
