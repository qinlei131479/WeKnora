package com.iptv.business.pgmapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.iptv.business.domain.Models;
import com.iptv.business.domain.dto.page.ModelsPageDTO;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * <p>
 * 模型配置 Mapper 接口（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-19
 */
public interface ModelsMapper extends BaseMapper<Models> {

    /**
     * 查询租户模型列表
     *
     * @param tenantId 租户ID
     * @return 模型列表
     */
    List<Models> selectListByTenantId(@Param("tenantId") Integer tenantId);

    /**
     * 分页查询模型列表
     *
     * @param params 查询参数
     * @param page     分页参数
     * @return 模型列表
     */
    List<Models> queryPage(@Param("param") ModelsPageDTO params, Page page);
    /**
     * 查询所有模型（包括内置）
     *
     * @return 模型列表
     */
    List<Models> selectAllModels();
}
