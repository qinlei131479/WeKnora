package com.iptv.business.service.impl;

import cn.hutool.core.bean.BeanUtil;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.CustomAgents;
import com.iptv.business.domain.dto.page.CustomAgentsPageDTO;
import com.iptv.business.domain.vo.CustomAgentsVO;
import com.iptv.business.pgmapper.CustomAgentsMapper;
import com.iptv.business.service.CustomAgentsService;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import jakarta.annotation.Nonnull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * <p>
 * 自定义/内置智能体配置（与租户组成复合主键） 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-26
 */
@Service
public class CustomAgentsServiceImpl extends ServiceImpl<CustomAgentsMapper, CustomAgents> implements CustomAgentsService {

    @Override
    public TableDataInfo<CustomAgentsVO> queryPage(CustomAgentsPageDTO dto, PageDTO pg) {
        Page<CustomAgentsVO> page = PageUtils.toPage(pg);
        List<CustomAgents> list = this.baseMapper.queryPage(dto, page);
        List<CustomAgentsVO> voList = BeanUtil.copyToList(list, CustomAgentsVO.class);
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public CustomAgentsVO queryById(@Nonnull String id) {
        CustomAgents entity = this.baseMapper.selectById(id);
        return BeanUtil.copyProperties(entity, CustomAgentsVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(@Nonnull String id) {
        CustomAgents entity = this.baseMapper.selectById(id);
        if (BeanUtil.isNotEmpty(entity)) {
            this.baseMapper.deleteById(id);
        }
    }
}
