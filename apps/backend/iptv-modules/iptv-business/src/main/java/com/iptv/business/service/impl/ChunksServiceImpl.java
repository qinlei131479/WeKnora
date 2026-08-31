package com.iptv.business.service.impl;

import cn.hutool.core.bean.BeanUtil;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.Chunks;
import com.iptv.business.domain.dto.page.ChunksPageDTO;
import com.iptv.business.domain.vo.ChunksVO;
import com.iptv.business.pgmapper.ChunksMapper;
import com.iptv.business.service.ChunksService;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * <p>
 * 知识分块：正文、索引状态、FAQ/图文关系、修订与上下文章节头 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-24
 */
@Slf4j
@Service
public class ChunksServiceImpl extends ServiceImpl<ChunksMapper, Chunks> implements ChunksService {

    @Override
    public TableDataInfo<ChunksVO> queryPage(ChunksPageDTO dto, PageDTO pg) {
        Page<ChunksVO> page = PageUtils.toPage(pg);
        List<Chunks> list = this.baseMapper.queryPage(dto, page);
        List<ChunksVO> voList = BeanUtil.copyToList(list, ChunksVO.class);
        return PageUtils.getDataTable(voList, page);
    }
}
