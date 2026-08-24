package com.iptv.business.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.Chunks;
import com.iptv.business.pgmapper.ChunksMapper;
import com.iptv.business.service.ChunksService;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 知识分块：正文、索引状态、FAQ/图文关系、修订与上下文章节头 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-24
 */
@Service
public class ChunksServiceImpl extends ServiceImpl<ChunksMapper, Chunks> implements ChunksService {

}
