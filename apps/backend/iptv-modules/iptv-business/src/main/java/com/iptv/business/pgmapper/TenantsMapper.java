package com.iptv.business.pgmapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.iptv.business.domain.Tenants;
import com.iptv.business.domain.dto.page.TenantsPageDTO;
import org.apache.ibatis.annotations.Param;
import org.jspecify.annotations.NonNull;

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

    /**
     * 按 id 数组查询包含逻辑删除的数据列表
     *
     * @param ids id 数组（length 为 0 表示查所有数据）
     * @return 数据列表
     */
    List<Tenants> selectListByIdsIncludingDeleted(@Param("ids") Integer... ids);

    /**
     * 按 id 查询包含逻辑删除的数据
     *
     * @param id id
     * @return 数据
     */
    Tenants selectByIdIncludingDeleted(@NonNull @Param("id") Integer id);
}
