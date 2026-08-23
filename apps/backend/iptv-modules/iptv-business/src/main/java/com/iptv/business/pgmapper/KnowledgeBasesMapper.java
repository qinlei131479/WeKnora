package com.iptv.business.pgmapper;

import com.iptv.business.domain.KnowledgeBases;
import com.iptv.business.domain.dto.page.KnowledgeBasesPageDTO;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import java.util.List;

/**
 * <p>
 * 知识库主表：分块、向量库绑定、Wiki/FAQ/自动打标等配置 Mapper 接口（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-23
 */
public interface KnowledgeBasesMapper extends BaseMapper<KnowledgeBases> {

    /**
     * 分页查询
     *
     * @param param 查询条件
     * @param page  分页参数
     * @return 数据列表
     */
    List<KnowledgeBases> queryPage(@Param("param") KnowledgeBasesPageDTO param, Page page);
}
