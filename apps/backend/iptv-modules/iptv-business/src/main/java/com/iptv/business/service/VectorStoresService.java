package com.iptv.business.service;

import jakarta.annotation.Nonnull;
import com.iptv.business.domain.VectorStores;
import com.iptv.business.domain.vo.VectorStoresVO;
import com.iptv.business.domain.dto.VectorStoresDTO;
import com.iptv.business.domain.dto.page.VectorStoresPageDTO;
import com.baomidou.mybatisplus.extension.service.IService;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;

import java.util.List;

/**
 * <p>
 * 向量库连接实例：引擎类型、连接与索引配置 服务类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-24
 */
public interface VectorStoresService extends IService<VectorStores> {

    /**
     * 分页查询
     *
     * @param dto 查询条件
     * @param pg  分页参数
     * @return 分页结果
     */
    TableDataInfo<VectorStoresVO> queryPage(VectorStoresPageDTO dto, PageDTO pg);

    /**
     * 按 id 查询
     *
     * @param id 主键
     * @return 实体
     */
    VectorStoresVO queryById(@Nonnull String id);

    /**
     * 新增
     *
     * @param dto 实体
     * @return 已保存实体
     */
    VectorStoresVO insert(@Nonnull VectorStoresDTO dto);

    /**
     * 按 id 更新
     *
     * @param dto 实体
     * @return 已更新实体
     */
    VectorStoresVO update(@Nonnull VectorStoresDTO dto);

    /**
     * 按 id 删除
     *
     * @param id 主键
     */
    void deleteById(@Nonnull String id);
}
