package com.iptv.business.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.AuditLogs;
import com.iptv.business.pgmapper.AuditLogsMapper;
import com.iptv.business.service.AuditLogsService;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 审计日志：操作者、动作、作用域与请求元数据 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-25
 */
@Service
public class AuditLogsServiceImpl extends ServiceImpl<AuditLogsMapper, AuditLogs> implements AuditLogsService {

}
