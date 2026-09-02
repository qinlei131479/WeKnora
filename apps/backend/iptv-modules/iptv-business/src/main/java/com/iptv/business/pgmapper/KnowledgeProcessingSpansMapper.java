package com.iptv.business.pgmapper;

import com.iptv.business.domain.KnowledgeProcessingSpans;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * <p>
 * 知识处理Span Mapper 接口（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-31
 */
public interface KnowledgeProcessingSpansMapper extends BaseMapper<KnowledgeProcessingSpans> {

    /**
     * 查询最新的尝试号
     *
     * @param knowledgeId 知识条目ID
     * @return 最新尝试号，如果没有记录则返回0
     */
    Integer selectLatestAttempt(@Param("knowledgeId") String knowledgeId);

    /**
     * 按尝试号查询Span列表
     *
     * @param knowledgeId 知识条目ID
     * @param attempt 尝试号
     * @return Span列表，按id升序排列
     */
    List<KnowledgeProcessingSpans> selectListByAttempt(@Param("knowledgeId") String knowledgeId, @Param("attempt") Integer attempt);
}
