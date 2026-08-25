package com.iptv.business.pgmapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.iptv.business.domain.AuditLogs;

import java.util.List;

/**
 * <p>
 * 审计日志：操作者、动作、作用域与请求元数据 Mapper 接口（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-25
 */
public interface AuditLogsMapper extends BaseMapper<AuditLogs> {

    List<AuditLogs> selectByKnowledgeBaseId(String knowledgeBaseId, Page page);
}
