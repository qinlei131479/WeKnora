package com.iptv.business.pgmapper;

import com.iptv.business.domain.VectorStores;
import com.iptv.business.domain.dto.page.VectorStoresPageDTO;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import java.util.List;

/**
 * <p>
 * 向量库连接实例：引擎类型、连接与索引配置 Mapper 接口（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-24
 */
public interface VectorStoresMapper extends BaseMapper<VectorStores> {

    /**
     * 分页查询
     *
     * @param param 查询条件
     * @param page  分页参数
     * @return 数据列表
     */
    List<VectorStores> queryPage(@Param("param") VectorStoresPageDTO param, Page page);
}
