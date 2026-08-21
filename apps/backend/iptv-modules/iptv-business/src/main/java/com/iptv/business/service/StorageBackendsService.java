package com.iptv.business.service;

import jakarta.annotation.Nonnull;
import com.iptv.business.domain.StorageBackends;
import com.iptv.business.domain.vo.StorageBackendsVO;
import com.iptv.business.domain.dto.StorageBackendsDTO;
import com.iptv.business.domain.dto.page.StorageBackendsPageDTO;
import com.baomidou.mybatisplus.extension.service.IService;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;

import java.util.List;

/**
 * <p>
 * 具体对象/文件存储后端实例（可多实例同 provider） 服务类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-21
 */
public interface StorageBackendsService extends IService<StorageBackends> {

    /**
     * 分页查询
     *
     * @param dto 查询条件
     * @param pg  分页参数
     * @return 分页结果
     */
    TableDataInfo<StorageBackendsVO> queryPage(StorageBackendsPageDTO dto, PageDTO pg);

    /**
     * 按 id 查询
     *
     * @param id 主键
     * @return 实体
     */
    StorageBackendsVO queryById(@Nonnull String id);

    /**
     * 新增
     *
     * @param dto 实体
     * @return 已保存实体
     */
    StorageBackendsVO insert(@Nonnull StorageBackendsDTO dto);

    /**
     * 按 id 更新
     *
     * @param dto 实体
     * @return 已更新实体
     */
    StorageBackendsVO update(@Nonnull StorageBackendsDTO dto);

    /**
     * 按 id 删除
     *
     * @param id 主键
     */
    void deleteById(@Nonnull String id);
}
