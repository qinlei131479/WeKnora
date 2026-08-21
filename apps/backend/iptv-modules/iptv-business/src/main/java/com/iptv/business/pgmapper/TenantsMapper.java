package com.iptv.business.pgmapper;

import com.iptv.business.domain.Tenants;
import com.iptv.business.domain.dto.page.TenantsPageDTO;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import java.util.List;

/**
 * <p>
 * 工作空间（租户）主表：配额、检索引擎、存储/解析/对话等全局配置 Mapper 接口（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
public interface TenantsMapper extends BaseMapper<Tenants> {

    /**
     * 分页查询
     *
     * @param param 查询条件
     * @param page  分页参数
     * @return 数据列表
     */
    List<Tenants> queryPage(@Param("param") TenantsPageDTO param, Page page);
}
