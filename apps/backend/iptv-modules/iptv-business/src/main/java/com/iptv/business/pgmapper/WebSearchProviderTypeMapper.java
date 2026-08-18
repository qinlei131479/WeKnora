package com.iptv.business.pgmapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.iptv.business.domain.WebSearchProviderType;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/**
 * 网络搜索提供商类型元数据 Mapper
 *
 * @author kjsc
 * @since 2026-08-18
 */
@Mapper
public interface WebSearchProviderTypeMapper extends BaseMapper<WebSearchProviderType> {

    /**
     * 查询所有启用的提供商类型（按排序顺序）
     *
     * @return 提供商类型列表
     */
    List<WebSearchProviderType> selectAllEnabled();
}
