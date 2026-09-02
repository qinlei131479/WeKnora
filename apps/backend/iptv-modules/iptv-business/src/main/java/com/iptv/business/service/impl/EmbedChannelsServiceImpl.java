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
import com.iptv.business.domain.EmbedChannels;
import com.iptv.business.domain.vo.EmbedChannelsVO;
import com.iptv.business.domain.dto.EmbedChannelsDTO;
import com.iptv.business.domain.dto.page.EmbedChannelsPageDTO;


import com.iptv.business.pgmapper.EmbedChannelsMapper;
import com.iptv.business.service.EmbedChannelsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * <p>
 * Web 嵌入渠道：发布令牌、来源白名单、限流与 UI 配置 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-09-02
 */
@Service
public class EmbedChannelsServiceImpl extends ServiceImpl<EmbedChannelsMapper, EmbedChannels> implements EmbedChannelsService {

    @Override
    public TableDataInfo<EmbedChannelsVO> queryPage(EmbedChannelsPageDTO dto, PageDTO pg) {
        Page<EmbedChannelsVO> page = PageUtils.toPage(pg);
        List<EmbedChannels> list = this.baseMapper.queryPage(dto, page);
        List<EmbedChannelsVO> voList = BeanUtil.copyToList(list, EmbedChannelsVO.class);
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public EmbedChannelsVO queryById(@Nonnull String id) {
        EmbedChannels entity = this.baseMapper.selectById(id);
        return BeanUtil.copyProperties(entity, EmbedChannelsVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public EmbedChannelsVO insert(@Nonnull EmbedChannelsDTO dto) {
        EmbedChannels entity = BeanUtil.copyProperties(dto, EmbedChannels.class);
        this.baseMapper.insert(entity);
        return BeanUtil.copyProperties(entity, EmbedChannelsVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public EmbedChannelsVO update(@Nonnull EmbedChannelsDTO dto) {
        EmbedChannels entity = this.baseMapper.selectById(dto.getId());
        if (BeanUtil.isEmpty(entity)) {
            throw new ServiceException("Web 嵌入渠道：发布令牌、来源白名单、限流与 UI 配置不存在");
        }
        BeanUtil.copyProperties(dto, entity);
        this.baseMapper.updateById(entity);
        return BeanUtil.copyProperties(entity, EmbedChannelsVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(@Nonnull String id) {
        EmbedChannels entity = this.baseMapper.selectById(id);
        if (BeanUtil.isNotEmpty(entity)) {
            this.baseMapper.deleteById(id);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int updateEnabledBatch(@Nonnull List<String> ids) {
        if (ids.isEmpty()) return 0;
        return this.baseMapper.update(new LambdaUpdateWrapper<EmbedChannels>()
                .in(EmbedChannels::getId, ids)
                .set(EmbedChannels::getEnabled, EnableEnum.ENABLE.getCode()));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int updateDisabledBatch(@Nonnull List<String> ids) {
        if (ids.isEmpty()) return 0;
        return this.baseMapper.update(new LambdaUpdateWrapper<EmbedChannels>()
                .in(EmbedChannels::getId, ids)
                .set(EmbedChannels::getEnabled, EnableEnum.DISABLE.getCode()));
    }
}
