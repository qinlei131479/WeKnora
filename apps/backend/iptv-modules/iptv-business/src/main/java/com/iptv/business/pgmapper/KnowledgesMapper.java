package com.iptv.business.pgmapper;

import com.iptv.business.domain.Knowledges;
import com.iptv.business.domain.dto.page.KnowledgesPageDTO;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import java.util.List;
import java.util.Map;

/**
 * <p>
 * 知识条目（文档/FAQ/URL/手工等）：解析状态、文件元数据、目录路径 Mapper 接口（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-23
 */
public interface KnowledgesMapper extends BaseMapper<Knowledges> {

    /**
     * 分页查询
     *
     * @param param 查询条件
     * @param page  分页参数
     * @return 数据列表
     */
    List<Knowledges> queryPage(@Param("param") KnowledgesPageDTO param, Page page);

    /**
     * 按文件夹路径分组统计文档数量
     *
     * @param knowledgeBaseId 知识库ID
     * @return 文件夹路径和文档数量的映射列表
     */
    List<Map<String, Object>> selectFolderCounts(@Param("knowledgeBaseId") String knowledgeBaseId);
}
