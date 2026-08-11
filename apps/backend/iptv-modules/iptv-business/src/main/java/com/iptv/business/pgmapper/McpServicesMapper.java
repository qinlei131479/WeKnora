package com.iptv.business.pgmapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.iptv.business.domain.McpServices;
import com.iptv.business.domain.dto.page.McpServicesPageDTO;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * <p>
 * MCP service configurations Mapper 接口（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-11
 */
public interface McpServicesMapper extends BaseMapper<McpServices> {

    /**
     * 分页查询
     *
     * @param param 查询条件
     * @param page  分页参数
     * @return 数据列表
     */
    List<McpServices> queryPage(@Param("param") McpServicesPageDTO param, Page page);
}
