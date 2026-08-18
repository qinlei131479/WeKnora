package com.iptv.business.pgmapper;

import com.iptv.business.domain.WebSearchProviders;
import com.iptv.business.domain.dto.page.WebSearchProvidersPageDTO;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import java.util.List;

/**
 * <p>
 * 租户级网络搜索提供商配置（密钥加密存储） Mapper 接口（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-17
 */
public interface WebSearchProvidersMapper extends BaseMapper<WebSearchProviders> {

    /**
     * 分页查询
     *
     * @param param 查询条件
     * @param page  分页参数
     * @return 数据列表
     */
    List<WebSearchProviders> queryPage(@Param("param") WebSearchProvidersPageDTO param, Page page);
}
