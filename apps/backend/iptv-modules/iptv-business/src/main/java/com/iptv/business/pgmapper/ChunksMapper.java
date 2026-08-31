package com.iptv.business.pgmapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.iptv.business.domain.Chunks;
import com.iptv.business.domain.dto.FAQEntryQueryDTO;
import com.iptv.business.domain.dto.page.ChunksPageDTO;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * <p>
 * 知识分块：正文、索引状态、FAQ/图文关系、修订与上下文章节头 Mapper 接口（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-24
 */
public interface ChunksMapper extends BaseMapper<Chunks> {

    /**
     * 根据知识条目ID列表删除分块（软删除）
     *
     * @param knowledgeIds 知识条目ID列表
     * @return 删除的记录数
     */
    int deleteByKnowledgeIds(@Param("knowledgeIds") List<String> knowledgeIds);

    /**
     * 分页查询FAQ条目
     *
     * @return FAQ分块列表
     */
    List<Chunks> selectFAQEntries(@Param("param") FAQEntryQueryDTO dto, Page page);

    /**
     * 分页查询知识分块
     *
     * @param param 查询条件
     * @param page  分页参数
     * @return 分块列表
     */
    List<Chunks> queryPage(@Param("param") ChunksPageDTO param, Page page);
}
