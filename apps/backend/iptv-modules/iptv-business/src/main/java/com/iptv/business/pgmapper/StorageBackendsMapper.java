package com.iptv.business.pgmapper;

import com.iptv.business.domain.StorageBackends;
import com.iptv.business.domain.dto.page.StorageBackendsPageDTO;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import java.util.List;

/**
 * <p>
 * 具体对象/文件存储后端实例（可多实例同 provider） Mapper 接口（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-21
 */
public interface StorageBackendsMapper extends BaseMapper<StorageBackends> {

    /**
     * 分页查询
     *
     * @param param 查询条件
     * @param page  分页参数
     * @return 数据列表
     */
    List<StorageBackends> queryPage(@Param("param") StorageBackendsPageDTO param, Page page);
}
