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
import com.iptv.business.domain.Messages;
import com.iptv.business.domain.vo.MessagesVO;
import com.iptv.business.domain.dto.MessagesDTO;
import com.iptv.business.domain.dto.page.MessagesPageDTO;


import com.iptv.business.pgmapper.MessagesMapper;
import com.iptv.business.service.MessagesService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * <p>
 * 会话消息：角色内容、知识引用、Agent 步骤、附件与执行上下文 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-25
 */
@Service
public class MessagesServiceImpl extends ServiceImpl<MessagesMapper, Messages> implements MessagesService {

    @Override
    public TableDataInfo<MessagesVO> queryPage(MessagesPageDTO dto, PageDTO pg) {
        Page<MessagesVO> page = PageUtils.toPage(pg);
        List<Messages> list = this.baseMapper.queryPage(dto, page);
        List<MessagesVO> voList = BeanUtil.copyToList(list, MessagesVO.class);
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public MessagesVO queryById(@Nonnull String id) {
        Messages entity = this.baseMapper.selectById(id);
        return BeanUtil.copyProperties(entity, MessagesVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MessagesVO insert(@Nonnull MessagesDTO dto) {
        Messages entity = BeanUtil.copyProperties(dto, Messages.class);
        this.baseMapper.insert(entity);
        return BeanUtil.copyProperties(entity, MessagesVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MessagesVO update(@Nonnull MessagesDTO dto) {
        Messages entity = this.baseMapper.selectById(dto.getId());
        if (BeanUtil.isEmpty(entity)) {
            throw new ServiceException("会话消息：角色内容、知识引用、Agent 步骤、附件与执行上下文不存在");
        }
        BeanUtil.copyProperties(dto, entity);
        this.baseMapper.updateById(entity);
        return BeanUtil.copyProperties(entity, MessagesVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(@Nonnull String id) {
        Messages entity = this.baseMapper.selectById(id);
        if (BeanUtil.isNotEmpty(entity)) {
            this.baseMapper.deleteById(id);
        }
    }
}
