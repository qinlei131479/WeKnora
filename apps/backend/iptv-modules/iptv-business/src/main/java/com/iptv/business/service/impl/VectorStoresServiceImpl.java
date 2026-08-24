package com.iptv.business.service.impl;

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
import com.iptv.business.domain.VectorStores;
import com.iptv.business.domain.vo.VectorStoresVO;
import com.iptv.business.domain.dto.VectorStoresDTO;
import com.iptv.business.domain.dto.page.VectorStoresPageDTO;


import com.iptv.business.pgmapper.VectorStoresMapper;
import com.iptv.business.service.VectorStoresService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * <p>
 * 向量库连接实例：引擎类型、连接与索引配置 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-24
 */
@Service
public class VectorStoresServiceImpl extends ServiceImpl<VectorStoresMapper, VectorStores> implements VectorStoresService {

    @Override
    public TableDataInfo<VectorStoresVO> queryPage(VectorStoresPageDTO dto, PageDTO pg) {
        Page<VectorStoresVO> page = PageUtils.toPage(pg);
        List<VectorStores> list = this.baseMapper.queryPage(dto, page);
        List<VectorStoresVO> voList = BeanUtil.copyToList(list, VectorStoresVO.class);
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public VectorStoresVO queryById(@Nonnull String id) {
        VectorStores entity = this.baseMapper.selectById(id);
        return BeanUtil.copyProperties(entity, VectorStoresVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public VectorStoresVO insert(@Nonnull VectorStoresDTO dto) {
        VectorStores entity = BeanUtil.copyProperties(dto, VectorStores.class);
        this.baseMapper.insert(entity);
        return BeanUtil.copyProperties(entity, VectorStoresVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public VectorStoresVO update(@Nonnull VectorStoresDTO dto) {
        VectorStores entity = this.baseMapper.selectById(dto.getId());
        if (BeanUtil.isEmpty(entity)) {
            throw new ServiceException("向量库连接实例：引擎类型、连接与索引配置不存在");
        }
        BeanUtil.copyProperties(dto, entity);
        this.baseMapper.updateById(entity);
        return BeanUtil.copyProperties(entity, VectorStoresVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(@Nonnull String id) {
        VectorStores entity = this.baseMapper.selectById(id);
        if (BeanUtil.isNotEmpty(entity)) {
            this.baseMapper.deleteById(id);
        }
    }
}
