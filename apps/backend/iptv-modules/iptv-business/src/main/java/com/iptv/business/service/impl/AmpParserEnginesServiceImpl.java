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
import com.iptv.business.domain.AmpParserEngines;
import com.iptv.business.domain.vo.AmpParserEnginesVO;
import com.iptv.business.domain.dto.AmpParserEnginesDTO;
import com.iptv.business.domain.dto.page.AmpParserEnginesPageDTO;


import com.iptv.business.pgmapper.AmpParserEnginesMapper;
import com.iptv.business.service.AmpParserEnginesService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * <p>
 * 文档解析引擎表 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-09-01
 */
@Service
public class AmpParserEnginesServiceImpl extends ServiceImpl<AmpParserEnginesMapper, AmpParserEngines> implements AmpParserEnginesService {

    @Override
    public TableDataInfo<AmpParserEnginesVO> queryPage(AmpParserEnginesPageDTO dto, PageDTO pg) {
        Page<AmpParserEnginesVO> page = PageUtils.toPage(pg);
        List<AmpParserEngines> list = this.baseMapper.queryPage(dto, page);
        List<AmpParserEnginesVO> voList = BeanUtil.copyToList(list, AmpParserEnginesVO.class);
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public AmpParserEnginesVO queryById(@Nonnull Long id) {
        AmpParserEngines entity = this.baseMapper.selectById(id);
        return BeanUtil.copyProperties(entity, AmpParserEnginesVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AmpParserEnginesVO insert(@Nonnull AmpParserEnginesDTO dto) {
        AmpParserEngines entity = BeanUtil.copyProperties(dto, AmpParserEngines.class);
        this.baseMapper.insert(entity);
        return BeanUtil.copyProperties(entity, AmpParserEnginesVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AmpParserEnginesVO update(@Nonnull AmpParserEnginesDTO dto) {
        AmpParserEngines entity = this.baseMapper.selectById(dto.getId());
        if (BeanUtil.isEmpty(entity)) {
            throw new ServiceException("文档解析引擎表不存在");
        }
        BeanUtil.copyProperties(dto, entity);
        this.baseMapper.updateById(entity);
        return BeanUtil.copyProperties(entity, AmpParserEnginesVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(@Nonnull Long id) {
        AmpParserEngines entity = this.baseMapper.selectById(id);
        if (BeanUtil.isNotEmpty(entity)) {
            this.baseMapper.deleteById(id);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int updateEnabledBatch(@Nonnull List<Long> ids) {
        if (ids.isEmpty()) return 0;
        return this.baseMapper.update(new LambdaUpdateWrapper<AmpParserEngines>()
                .in(AmpParserEngines::getId, ids)
                .set(AmpParserEngines::getEnabled, EnableEnum.ENABLE.getCode()));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int updateDisabledBatch(@Nonnull List<Long> ids) {
        if (ids.isEmpty()) return 0;
        return this.baseMapper.update(new LambdaUpdateWrapper<AmpParserEngines>()
                .in(AmpParserEngines::getId, ids)
                .set(AmpParserEngines::getEnabled, EnableEnum.DISABLE.getCode()));
    }
}
