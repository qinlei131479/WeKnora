package com.iptv.business.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.iptv.business.domain.Chunks;
import com.iptv.business.domain.dto.page.ChunksPageDTO;
import com.iptv.business.domain.vo.ChunksVO;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;

/**
 * <p>
 * 知识分块：正文、索引状态、FAQ/图文关系、修订与上下文章节头 服务类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-24
 */
public interface ChunksService extends IService<Chunks> {

    /**
     * 分页查询知识分块
     *
     * @param dto 查询条件
     * @param pg  分页参数
     * @return 分页结果
     */
    TableDataInfo<ChunksVO> queryPage(ChunksPageDTO dto, PageDTO pg);
}
