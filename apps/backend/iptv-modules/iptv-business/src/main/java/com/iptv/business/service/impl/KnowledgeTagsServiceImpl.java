package com.iptv.business.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.KnowledgeTags;
import com.iptv.business.pgmapper.KnowledgeTagsMapper;
import com.iptv.business.service.KnowledgeTagsService;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 知识库内标签定义（名称/颜色/排序），FAQ 等分类用 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-27
 */
@Service
public class KnowledgeTagsServiceImpl extends ServiceImpl<KnowledgeTagsMapper, KnowledgeTags> implements KnowledgeTagsService {

}
