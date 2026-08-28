package com.iptv.business.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.KnowledgeTagRelations;
import com.iptv.business.pgmapper.KnowledgeTagRelationsMapper;
import com.iptv.business.service.KnowledgeTagRelationsService;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 知识条目与标签的多对多关联 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-28
 */
@Service
public class KnowledgeTagRelationsServiceImpl extends ServiceImpl<KnowledgeTagRelationsMapper, KnowledgeTagRelations> implements KnowledgeTagRelationsService {

}
